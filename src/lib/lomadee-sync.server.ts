import { getAlgoliaIndexingConfig } from "./algolia-indexing.server";
import { lomadeeObjectId, normalizeLomadeeProduct, type LomadeeBrand, type LomadeeProduct, type NormalizedLomadeeProduct } from "./lomadee-catalog";

// Lomadee allows 60 requests/minute per key. Each run stays within a fixed call
// budget and resumes from the stored page on the next run.
const GATEWAY = "https://connector-gateway.lovable.dev/udc_lomadee";
const CALL_BUDGET = 40;
const CALL_SPACING_MS = 1000;
const PAGE_SIZE = 100;

function credentials() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const key = process.env["UDC_LOMADEE_API_KEY"];
  if (!lovable || !key) throw new Error("A conexão com a Lomadee não está configurada.");
  return { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": key, Accept: "application/json" };
}

export async function runLomadeeSync(): Promise<{ id: string; indexed: number; skipped: number; nextPage: number }> {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  await db.from("catalog_imports").update({ status: "failed", error: "Execução interrompida; solicite novamente." })
    .eq("source", "lomadee").in("status", ["queued", "running"]).lt("updated_at", new Date(Date.now() - 5 * 60_000).toISOString());
  const last = await db.from("catalog_imports").select("next_page").eq("source", "lomadee").eq("status", "completed")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  let page = last.data?.next_page ?? 1;
  const { data: job, error } = await db.from("catalog_imports").insert({ source: "lomadee", status: "running" }).select("id").single();
  if (error || !job) throw new Error("Já existe uma sincronização da Lomadee em andamento.");

  const headers = credentials();
  let calls = 0;
  const call = async (path: string, init?: RequestInit) => {
    if (calls > 0) await new Promise((r) => setTimeout(r, CALL_SPACING_MS));
    calls += 1;
    const res = await fetch(`${GATEWAY}${path}`, { ...init, headers: { ...headers, ...(init?.headers ?? {}) } });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Lomadee request failed [${res.status}] ${path.split("?")[0]}: ${body.slice(0, 300)}`);
      throw new Error(`A Lomadee recusou a consulta (${res.status}).`);
    }
    return res.json() as Promise<unknown>;
  };

  let indexed = 0;
  let skipped = 0;
  try {
    const brands = new Map<string, LomadeeBrand>();
    // The API caps brand pages at 20 entries.
    for (let bp = 1; bp <= 10; bp += 1) {
      const json = (await call(`/affiliate/brands?limit=20&page=${bp}`)) as { data?: Array<{ id: string; name: string; site?: string }>; pagination?: { totalPages?: number } };
      for (const b of json.data ?? []) brands.set(b.id, { name: b.name, site: b.site });
      if (bp >= (json.pagination?.totalPages ?? 1)) break;
    }

    const syncedAt = new Date().toISOString();
    // Stores that refuse this site's channel are remembered (private, non-active rows) for 7 days.
    const blockedRows = await db.from("partner_catalog").select("object_id").eq("source", "lomadee_blocked")
      .gt("last_synced_at", new Date(Date.now() - 7 * 86400_000).toISOString());
    const blockedOrgs = new Set((blockedRows.data ?? []).map((r) => r.object_id.replace(/^lomadee-blocked-/, "")));
    const newlyBlocked = new Set<string>();
    const { client, indexName } = getAlgoliaIndexingConfig();
    pageLoop: while (calls < CALL_BUDGET) {
      const json = (await call(`/affiliate/products?limit=${PAGE_SIZE}&page=${page}&isAvailable=true`)) as { data?: LomadeeProduct[] };
      const products = json.data ?? [];
      const ids = products.map(lomadeeObjectId).filter((id): id is string => Boolean(id));
      const existing = new Map<string, { productUrl?: string; affiliateUrl?: string }>();
      if (ids.length) {
        const rows = await db.from("partner_catalog").select("object_id,record").in("object_id", ids);
        for (const row of rows.data ?? []) existing.set(row.object_id, row.record as { productUrl?: string; affiliateUrl?: string });
      }
      const ready: NormalizedLomadeeProduct[] = [];
      let finishedPage = true;
      for (const product of products) {
        const id = lomadeeObjectId(product);
        if (!id || !product.url || !product.organizationId) { skipped += 1; continue; }
        const prev = existing.get(id);
        let link = prev?.productUrl === product.url ? prev.affiliateUrl ?? null : null;
        // Don't spend rate-limited link calls on products that would be rejected anyway.
        if (!link && (blockedOrgs.has(product.organizationId) || !normalizeLomadeeProduct(product, brands.get(product.organizationId), "https://lmdee.link/check", syncedAt))) { skipped += 1; continue; }
        if (!link) {
          if (calls >= CALL_BUDGET) { finishedPage = false; break; }
          try {
            const channels = (await call("/affiliate/shortener/url", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ organizationId: product.organizationId, type: "Custom", url: product.url }),
            })) as Array<{ shortUrls?: string[] }>;
            link = channels.flatMap((c) => c.shortUrls ?? [])[0] ?? null;
            // The store doesn't allow this site's channel; skip its other products this run.
            if (!link) { blockedOrgs.add(product.organizationId); newlyBlocked.add(product.organizationId); }
          } catch { link = null; }
        }
        const record = normalizeLomadeeProduct(product, brands.get(product.organizationId), link, syncedAt);
        if (record) ready.push(record); else skipped += 1;
      }
      if (ready.length) {
        const saved = await db.from("partner_catalog").upsert(ready.map((record) => ({ object_id: record.objectID, source: "lomadee", record, last_synced_at: syncedAt })), { onConflict: "object_id" });
        if (saved.error) throw new Error("Falha ao salvar produtos da Lomadee.");
        await client.saveObjects({ indexName, objects: ready, waitForTasks: true, batchSize: 100 });
        indexed += ready.length;
      }
      if (newlyBlocked.size) {
        await db.from("partner_catalog").upsert([...newlyBlocked].map((org) => ({ object_id: `lomadee-blocked-${org}`, source: "lomadee_blocked", record: { status: "blocked" }, last_synced_at: syncedAt })), { onConflict: "object_id" });
        newlyBlocked.clear();
      }
      if (!finishedPage) break pageLoop;
      page = products.length < PAGE_SIZE ? 1 : page + 1;
      if (page === 1) break;
    }
    await db.from("catalog_import_batches").upsert({ import_id: job.id, batch: 0, indexed, skipped });
    await db.from("catalog_imports").update({ status: "completed", next_page: page, finished_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", job.id);
    return { id: job.id, indexed, skipped, nextPage: page };
  } catch (e) {
    await db.from("catalog_import_batches").upsert({ import_id: job.id, batch: 0, indexed, skipped });
    await db.from("catalog_imports").update({ status: "failed", next_page: page, error: e instanceof Error ? e.message.slice(0, 300) : "Falha na sincronização.", finished_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", job.id);
    throw e;
  }
}
