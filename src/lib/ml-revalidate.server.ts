import { getAlgoliaIndexingConfig, CATALOG_FACETS } from "./algolia-indexing.server";
import { mercadoLivreIdentifiers, type CatalogAttribute } from "./product-identifiers";
import { classifyMeliItemsList, classifyMeliProduct, shouldAbortRevalidation } from "./ml-revalidate";
import { enrichPopularity } from "./popularity.server";

const STALE_AFTER_HOURS = 12;
const MAX_ITEMS_PER_RUN = 200;
const PRODUCT_LOOKUP_CONCURRENCY = 4;
const FACETING = CATALOG_FACETS;

export type MlRevalidationResult = {
  dryRun: boolean;
  candidates: number;
  verified: number;
  updated: number;
  unavailable: number;
  errors: number;
  aborted: boolean;
  sampleUnavailable: string[];
  message: string;
};

type StaleRecord = {
  objectID: string;
  title?: string;
  imageUrl?: string | null;
  store?: string;
  category?: string | null;
  categoryName?: string | null;
  itemId?: string;
  last_synced_at?: string;
  source?: string;
};

type CatalogItemSummary = {
  item_id?: string;
  price?: number;
  original_price?: number | null;
  shipping?: { free_shipping?: boolean };
};

type CandidateOutcome =
  | { kind: "unavailable"; record: StaleRecord }
  | { kind: "unknown"; record: StaleRecord }
  | {
      kind: "active";
      record: StaleRecord;
      itemId: string;
      price: number;
      originalPrice: number | null;
      freeShipping: boolean;
      title?: string;
      imageUrl?: string;
      permalink?: string;
      gtin: string | null;
      model: string | null;
    };

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** GET with growing waits on 429/5xx; returns the response for definitive answers. */
async function fetchWithBackoff(url: string, headers: Record<string, string>): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers });
      if (response.status === 429 || response.status >= 500) {
        await wait(attempt * 2000);
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < 4) await wait(attempt * 2000);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Falha temporária ao consultar o Mercado Livre.");
}

async function getToken(): Promise<string> {
  const { getMeliToken } = await import("./search-offers.functions");
  const token = await getMeliToken();
  if (!token) throw new Error("As credenciais do Mercado Livre não estão configuradas.");
  return token;
}

async function ensureStatusFilterable(client: ReturnType<typeof getAlgoliaIndexingConfig>["client"], indexName: string) {
  await Promise.all([
    client.setSettings({ indexName, indexSettings: { attributesForFaceting: FACETING } }),
    client.setSettings({ indexName: `${indexName}_price_asc`, indexSettings: { attributesForFaceting: FACETING } }),
    client.setSettings({ indexName: `${indexName}_price_desc`, indexSettings: { attributesForFaceting: FACETING } }),
  ]);
}

/**
 * Checks one catalog product directly against the Mercado Livre API:
 * product status, then its items list, resolving the cheapest item id for the
 * multiget stock check. Absence from the daily search is never used here.
 */
async function checkCandidate(record: StaleRecord, headers: Record<string, string>): Promise<CandidateOutcome> {
  const productRes = await fetchWithBackoff(`https://api.mercadolibre.com/products/${encodeURIComponent(record.objectID)}`, headers);
  const productBody = productRes.ok
    ? ((await productRes.json()) as { status?: string; name?: string; permalink?: string; attributes?: CatalogAttribute[]; pictures?: Array<{ url?: string; secure_url?: string }> })
    : null;
  const productVerdict = classifyMeliProduct(productRes.status, productBody);
  if (productVerdict === "unknown") console.warn("Mercado Livre revalidation product unknown", record.objectID, productRes.status);
  if (productVerdict !== "active") {
    return { kind: productVerdict === "unavailable" ? "unavailable" : "unknown", record };
  }

  const itemsRes = await fetchWithBackoff(`https://api.mercadolibre.com/products/${encodeURIComponent(record.objectID)}/items?limit=20`, headers);
  const itemsBody = itemsRes.ok ? ((await itemsRes.json()) as { results?: CatalogItemSummary[] }) : null;
  const listVerdict = classifyMeliItemsList(itemsRes.status, itemsBody?.results ?? null);
  if (listVerdict === "unknown") console.warn("Mercado Livre revalidation items unknown", record.objectID, itemsRes.status);
  if (listVerdict !== "active") return { kind: listVerdict === "unavailable" ? "unavailable" : "unknown", record };

  const sellable = (itemsBody?.results ?? []).filter((item) => typeof item.price === "number" && Number.isFinite(item.price) && item.price > 0);
  if (sellable.length === 0) return { kind: "unavailable", record };
  const cheapest = sellable.reduce((best, item) => (Number(item.price) < Number(best.price) ? item : best));
  const price = Number(cheapest.price);
  const picture = productBody?.pictures?.[0];
  return {
    kind: "active",
    record,
    ...mercadoLivreIdentifiers(productBody?.attributes),
    itemId: cheapest.item_id?.trim() ?? "",
    price,
    originalPrice: cheapest.original_price && cheapest.original_price > price ? cheapest.original_price : null,
    freeShipping: Boolean(cheapest.shipping?.free_shipping),
    ...(productBody?.name ? { title: productBody.name } : {}),
    ...(picture?.secure_url ?? picture?.url ? { imageUrl: (picture.secure_url ?? picture.url) as string } : {}),
    ...(productBody?.permalink ? { permalink: productBody.permalink } : {}),
  };
}

/**
 * Revalidates stale Mercado Livre offers (last_synced_at older than 12h or missing),
 * oldest first, up to 200 per run. Only touches source="mercadolivre" records and
 * never deletes anything: unavailable items are marked status="unavailable".
 * With dryRun, nothing is written and sample ids are returned instead.
 */
export async function revalidateMercadoLivreOffers(options: { dryRun?: boolean; limit?: number } = {}): Promise<MlRevalidationResult> {
  const dryRun = options.dryRun === true;
  const limit = Math.min(options.limit ?? MAX_ITEMS_PER_RUN, MAX_ITEMS_PER_RUN);
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");

  let jobId: string | null = null;
  if (!dryRun) {
    await db.from("catalog_imports").update({ status: "failed", error: "Execução interrompida; solicite novamente." })
      .eq("source", "mercadolivre").in("status", ["queued", "running"]).lt("updated_at", new Date(Date.now() - 10 * 60_000).toISOString());
    const running = await db.from("catalog_imports").select("id").eq("source", "mercadolivre").in("status", ["queued", "running"]).limit(1);
    if (running.error) throw new Error("Não foi possível verificar as execuções em andamento.");
    if (running.data?.length) throw new Error("Já existe uma revalidação do Mercado Livre em andamento.");
    const { data: job, error } = await db.from("catalog_imports").insert({ source: "mercadolivre", status: "running" }).select("id").single();
    if (error || !job) throw new Error("Já existe uma revalidação do Mercado Livre em andamento.");
    jobId = job.id;
  }

  const finish = async (outcome: { status: "completed" | "failed"; error?: string | null; counts: Record<string, number> }) => {
    if (!jobId) return;
    await db.from("catalog_import_batches").upsert({ import_id: jobId, batch: 0, indexed: outcome.counts["updated"] ?? 0, skipped: outcome.counts["errors"] ?? 0 });
    await db.from("catalog_imports").update({
      status: outcome.status,
      error: outcome.error ?? null,
      sync_cursor: JSON.parse(JSON.stringify({ revalidacao: outcome.counts })),
      finished_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);
  };

  try {
    const { client, indexName } = getAlgoliaIndexingConfig();
    const cutoff = Date.now() - STALE_AFTER_HOURS * 3600_000;
    const stale: StaleRecord[] = [];
    await client.browseObjects<StaleRecord>({
      indexName,
      browseParams: {
        query: "",
        attributesToRetrieve: ["objectID", "itemId", "last_synced_at", "source", "title", "imageUrl", "store", "category", "categoryName"],
        hitsPerPage: 1000,
      },
      aggregator: (batch) => {
        for (const hit of batch.hits) {
          // source is not a faceting attribute, so the partner filter happens here.
          if (hit.source !== "mercadolivre") continue;
          const timestamp = hit.last_synced_at ? Date.parse(hit.last_synced_at) : Number.NaN;
          if (!Number.isFinite(timestamp) || timestamp < cutoff) stale.push(hit);
        }
      },
    });
    stale.sort((left, right) => (Date.parse(left.last_synced_at ?? "") || 0) - (Date.parse(right.last_synced_at ?? "") || 0));
    const candidates = stale.slice(0, limit);

    const token = await getToken();
    const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
    const now = new Date().toISOString();

    // Step 1: product-level checks, resolving the cheapest item id per product.
    const outcomes: CandidateOutcome[] = [];
    for (let position = 0; position < candidates.length; position += PRODUCT_LOOKUP_CONCURRENCY) {
      const group = candidates.slice(position, position + PRODUCT_LOOKUP_CONCURRENCY);
      const settled = await Promise.all(group.map(async (record) => {
        try {
          return await checkCandidate(record, headers);
        } catch (error) {
          console.error("Mercado Livre revalidation candidate failed", record.objectID, error);
          return { kind: "unknown", record } satisfies CandidateOutcome;
        }
      }));
      outcomes.push(...settled);
    }

    // Step 2: build the partial updates. Item-level multiget (/items?ids=, 20 per call)
    // is blocked for this application's token (403 access_denied), so availability is
    // decided by the product status and its items list, which only returns sellable items.
    const updates: Array<Record<string, unknown>> = [];
    const unavailableIds: string[] = [];
    let verified = 0;
    let errors = 0;

    for (const outcome of outcomes) {
      if (outcome.kind === "unknown") {
        errors += 1;
        continue;
      }
      verified += 1;
      if (outcome.kind === "unavailable") {
        unavailableIds.push(outcome.record.objectID);
        updates.push({ objectID: outcome.record.objectID, status: "unavailable", unavailable_at: now, last_synced_at: now });
        continue;
      }
      updates.push({
        objectID: outcome.record.objectID,
        gtin: outcome.gtin,
        model: outcome.model,
        ...(outcome.title ? { title: outcome.title } : {}),
        ...(outcome.imageUrl ? { imageUrl: outcome.imageUrl } : {}),
        price: outcome.price,
        originalPrice: outcome.originalPrice,
        discountPercent: outcome.originalPrice ? Math.round(((outcome.originalPrice - outcome.price) / outcome.originalPrice) * 100) : null,
        ...(outcome.permalink ? { affiliateUrl: `${outcome.permalink.split("#")[0]}${outcome.permalink.includes("?") ? "&" : "?"}matt_tool=15523479&matt_word=compareecompre` } : {}),
        freeShipping: outcome.freeShipping,
        ...(outcome.itemId ? { itemId: outcome.itemId } : {}),
        status: "active",
        last_synced_at: now,
      });
    }

    const result: MlRevalidationResult = {
      dryRun,
      candidates: candidates.length,
      verified,
      updated: verified - unavailableIds.length,
      unavailable: unavailableIds.length,
      errors,
      aborted: false,
      sampleUnavailable: unavailableIds.slice(0, 10),
      message: "",
    };

    if (shouldAbortRevalidation(verified, unavailableIds.length)) {
      result.aborted = true;
      result.message = `Disjuntor acionado: ${unavailableIds.length} de ${verified} itens verificados (${Math.round((unavailableIds.length / verified) * 100)}%) ficaram indisponíveis, acima do limite de 30%. Nenhuma marcação foi gravada.`;
      console.error("Mercado Livre revalidation aborted by circuit breaker", result);
      await finish({ status: "completed", error: result.message, counts: { verified, updated: 0, unavailable: unavailableIds.length, errors, aborted: 1 } });
      return result;
    }

    if (!dryRun && updates.length > 0) {
      await ensureStatusFilterable(client, indexName);
      const complete = updates.map((update) => ({ ...candidates.find((r) => r.objectID === update["objectID"]), ...update, objectID: String(update["objectID"]) }));
      const enriched = await enrichPopularity(complete);
      const rankedUpdates = updates.map((update, index) => ({ ...update, popularity_score: enriched[index]?.popularity_score ?? 0, group_key: enriched[index]?.group_key }));
      // Partial updates on the primary index propagate to the price replicas automatically.
      await client.partialUpdateObjects({ indexName, objects: rankedUpdates, createIfNotExists: false, waitForTasks: true });
    }

    result.message = dryRun
      ? `Simulação: ${candidates.length} candidatos, ${verified} verificados, ${unavailableIds.length} seriam marcados como indisponíveis, ${errors} erros. Nada foi gravado.`
      : `Revalidação concluída: ${verified} verificados, ${verified - unavailableIds.length} atualizados, ${unavailableIds.length} indisponíveis, ${errors} erros.`;
    console.info("Mercado Livre revalidation finished", result);
    await finish({ status: "completed", counts: { verified, updated: result.updated, unavailable: result.unavailable, errors, aborted: 0 } });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 300) : "Falha na revalidação.";
    await finish({ status: "failed", error: message, counts: { verified: 0, updated: 0, unavailable: 0, errors: 0 } });
    throw error;
  }
}
