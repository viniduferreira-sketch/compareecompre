import { algoliasearch } from "algoliasearch";

import { fetchQA_MercadoLivre, type PartnerQA } from "@/lib/partner-qa.server";

const AFFILIATE_PARAMS = "matt_tool=15523479&matt_word=compareecompre";
const DEFAULT_INDEX_NAME = "produtos_mercado_livre";
const TARGET_OFFERS_PER_CATEGORY = 100;
const MAX_SEARCH_PAGES_PER_QUERY = 10;
const SEARCH_PAGE_SIZE = 50;
const ITEM_LOOKUP_CONCURRENCY = 5;

const MENU_CATEGORIES = [
  { name: "Eletrônicos", queries: ["smart tv", "fone bluetooth", "caixa de som", "tablet", "câmera digital", "smartwatch", "monitor"] },
  { name: "Moda", queries: ["tênis", "camiseta", "vestido", "calça jeans", "bolsa", "relógio", "jaqueta"] },
  { name: "Casa", queries: ["air fryer", "liquidificador", "cafeteira", "aspirador", "ventilador", "microondas", "panela elétrica"] },
  { name: "Celulares", queries: ["iphone", "samsung galaxy", "motorola celular", "xiaomi celular", "realme celular", "smartphone"] },
  { name: "Games", queries: ["playstation", "xbox", "nintendo switch", "controle gamer", "headset gamer", "cadeira gamer", "jogo videogame"] },
  { name: "Beleza", queries: ["perfume", "maquiagem", "secador de cabelo", "chapinha", "barbeador", "hidratante", "protetor solar"] },
  { name: "Esportes", queries: ["bicicleta", "tênis corrida", "halter", "bola futebol", "camisa de time", "suplemento", "mochila esportiva"] },
] as const;

export const MENU_CATEGORY_NAMES = MENU_CATEGORIES.map((category) => category.name);
export const SOURCE_MERCADO_LIVRE = "mercadolivre";

type SyncOptions = {
  recordsPerQuery?: number;
  targetPerCategory?: number;
  /** Sync a single category; omit to run all categories sequentially. */
  category?: string;
};

export type CategorySyncReport = {
  category: string;
  success: boolean;
  fetched: number;
  updated: number;
  removed: number;
  errors: number;
  error?: string;
};

export type SyncOffersResult = {
  indexed: number;
  removed: number;
  categories: CategorySyncReport[];
  message: string;
};

let cronConfigured = false;

type CatalogProduct = {
  id: string;
  name: string;
  domain_id?: string;
  pictures?: Array<{ url?: string }>;
  attributes?: Array<{ id?: string; value_name?: string }>;
};

type CatalogItem = {
  id?: string;
  item_id?: string;
  title?: string;
  thumbnail?: string;
  price?: number;
  original_price?: number | null;
  category_id?: string;
  status?: string;
  available_quantity?: number;
  shipping?: { free_shipping?: boolean };
  permalink?: string;
};

type AlgoliaOffer = {
  objectID: string;
  itemId: string;
  title: string;
  imageUrl: string | null;
  store: string;
  source: typeof SOURCE_MERCADO_LIVRE;
  status: "active";
  last_synced_at: string;
  lastSyncedAtTs: number;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  freeShipping: boolean;
  affiliateUrl: string;
  category: string | null;
  categoryName: string | null;
  brand: string | null;
  sellerCount: number;
  qa: PartnerQA[];
};

/** Raised when the partner API fails in a way that must not trigger deletions. */
class PartnerApiError extends Error {}

let cachedToken: { value: string; expiresAt: number } | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** 429: up to 3 retries with growing waits. 5xx/network: 1 retry. */
async function fetchWithRetry(input: string, init?: RequestInit): Promise<Response> {
  let rateLimitRetries = 0;
  let serverRetries = 0;
  for (;;) {
    let response: Response;
    try {
      response = await fetch(input, init);
    } catch (error) {
      if (serverRetries >= 1) throw error;
      serverRetries += 1;
      await sleep(1000);
      continue;
    }
    if (response.status === 429 && rateLimitRetries < 3) {
      rateLimitRetries += 1;
      await sleep(1000 * 2 ** rateLimitRetries);
      continue;
    }
    if (response.status >= 500 && serverRetries < 1) {
      serverRetries += 1;
      await sleep(1000);
      continue;
    }
    return response;
  }
}

function isBlockingStatus(status: number): boolean {
  return status === 401 || status === 403 || status === 429 || status >= 500;
}

async function getMeliToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;

  const clientId = process.env["ML_CLIENT_ID"];
  const clientSecret = process.env["ML_CLIENT_SECRET"];
  if (!clientId || !clientSecret) throw new Error("As credenciais do Mercado Livre não estão configuradas.");

  const response = await fetchWithRetry("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!response.ok) {
    console.error("Mercado Livre token failed", response.status, await response.text());
    throw new Error("Não foi possível autenticar a sincronização do Mercado Livre.");
  }

  const json = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return cachedToken.value;
}

function withAffiliate(url: string): string {
  const clean = url.split("#")[0] ?? url;
  return `${clean}${clean.includes("?") ? "&" : "?"}${AFFILIATE_PARAMS}`;
}

function validPermalink(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && /(^|\.)mercadoli(vre|bre)\.com(\.br)?$/.test(parsed.hostname)
      ? url
      : null;
  } catch {
    return null;
  }
}

function getAlgoliaConfig() {
  const applicationId = process.env["ALGOLIA_APPLICATION_ID"];
  const apiKey = process.env["ALGOLIA_API_KEY"];
  const indexName = process.env["ALGOLIA_INDEX_NAME"] ?? DEFAULT_INDEX_NAME;
  if (!applicationId || !apiKey) throw new Error("A busca inteligente não está configurada.");
  return { client: algoliasearch(applicationId, apiKey), indexName };
}

type AlgoliaClient = ReturnType<typeof algoliasearch>;

async function applyIndexSettings(client: AlgoliaClient, indexName: string) {
  await client.setSettings({
    indexName,
    indexSettings: {
      searchableAttributes: ["title", "brand", "categoryName"],
      attributesForFaceting: [
        "searchable(categoryName)",
        "searchable(brand)",
        "freeShipping",
        "filterOnly(source)",
        "filterOnly(status)",
      ],
      typoTolerance: true,
      removeStopWords: ["pt"],
      ignorePlurals: ["pt"],
      replicas: [`${indexName}_price_asc`, `${indexName}_price_desc`],
    },
  });
  await Promise.all([
    client.setSettings({
      indexName: `${indexName}_price_asc`,
      indexSettings: { ranking: ["asc(price)", "typo", "geo", "words", "filters", "proximity", "attribute", "exact", "custom"] },
    }),
    client.setSettings({
      indexName: `${indexName}_price_desc`,
      indexSettings: { ranking: ["desc(price)", "typo", "geo", "words", "filters", "proximity", "attribute", "exact", "custom"] },
    }),
  ]);
}

async function syncCategory(
  client: AlgoliaClient,
  indexName: string,
  category: (typeof MENU_CATEGORIES)[number],
  headers: Record<string, string>,
  pageSize: number,
  targetPerCategory: number,
): Promise<CategorySyncReport> {
  const report: CategorySyncReport = { category: category.name, success: false, fetched: 0, updated: 0, removed: 0, errors: 0 };
  const records: AlgoliaOffer[] = [];
  const seen = new Set<string>();

  const mapProduct = async (product: CatalogProduct): Promise<AlgoliaOffer | null> => {
    const response = await fetchWithRetry(
      `https://api.mercadolibre.com/products/${encodeURIComponent(product.id)}/items?limit=20`,
      { headers },
    );
    if (isBlockingStatus(response.status)) {
      throw new PartnerApiError(`items ${product.id} HTTP ${response.status}`);
    }
    if (!response.ok) return null; // 404 etc.: product is no longer listed

    const json = (await response.json()) as { results?: CatalogItem[] };
    const items = (json.results ?? []).filter((item) =>
      typeof item.price === "number" && Number.isFinite(item.price) && item.price > 0
      && (item.status === undefined || item.status === "active")
      && item.available_quantity !== 0,
    );
    if (items.length === 0) return null;

    const cheapest = items.reduce((best, item) => Number(item.price) < Number(best.price) ? item : best);
    const permalink = validPermalink(cheapest.permalink) ?? validPermalink(`https://www.mercadolivre.com.br/p/${product.id}`);
    if (!permalink) return null;

    const price = Number(cheapest.price);
    const originalPrice = cheapest.original_price && cheapest.original_price > price ? cheapest.original_price : null;
    const brand = product.attributes?.find((attribute) => attribute.id === "BRAND")?.value_name ?? null;
    const itemId = (cheapest.id ?? cheapest.item_id)?.trim() ?? "";
    const qa = itemId ? await fetchQA_MercadoLivre(itemId, headers, fetchWithRetry) : [];
    const syncedAt = new Date();

    return {
      objectID: product.id,
      itemId,
      title: product.name,
      imageUrl: product.pictures?.[0]?.url ?? cheapest.thumbnail ?? null,
      store: "Mercado Livre",
      source: SOURCE_MERCADO_LIVRE,
      status: "active",
      last_synced_at: syncedAt.toISOString(),
      lastSyncedAtTs: Math.floor(syncedAt.getTime() / 1000),
      price,
      originalPrice,
      discountPercent: originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : null,
      freeShipping: Boolean(cheapest.shipping?.free_shipping),
      affiliateUrl: withAffiliate(permalink),
      category: cheapest.category_id ?? product.domain_id ?? null,
      categoryName: category.name,
      brand,
      sellerCount: items.length,
      qa,
    };
  };

  try {
    for (const query of category.queries) {
      if (records.length >= targetPerCategory) break;
      for (let page = 0; page < MAX_SEARCH_PAGES_PER_QUERY; page += 1) {
        const params = new URLSearchParams({
          status: "active",
          site_id: "MLB",
          q: query,
          limit: String(pageSize),
          offset: String(page * pageSize),
        });
        const response = await fetchWithRetry(`https://api.mercadolibre.com/products/search?${params}`, { headers });
        if (!response.ok) {
          throw new PartnerApiError(`search "${query}" page ${page} HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`);
        }
        const json = (await response.json()) as { results?: CatalogProduct[] };
        const results = json.results ?? [];
        const pageProducts = results.filter((product) => {
          if (!product.id || !product.name || seen.has(product.id)) return false;
          seen.add(product.id);
          return true;
        });
        report.fetched += pageProducts.length;

        for (let position = 0; position < pageProducts.length; position += ITEM_LOOKUP_CONCURRENCY) {
          if (records.length >= targetPerCategory) break;
          const group = pageProducts.slice(position, position + ITEM_LOOKUP_CONCURRENCY);
          const mapped = await Promise.all(group.map(mapProduct));
          for (const record of mapped) {
            if (record && records.length < targetPerCategory) records.push(record);
          }
        }
        if (records.length >= targetPerCategory || results.length < pageSize) break;
      }
    }
    if (records.length === 0) throw new PartnerApiError("resposta vazia inesperada: nenhuma oferta válida");
  } catch (error) {
    report.errors += 1;
    report.error = error instanceof Error ? error.message : String(error);
    console.error("Mercado Livre category sync aborted; index left untouched", category.name, report.error);
    return report;
  }

  // Category fetched successfully: upsert, then remove stale Mercado Livre records of this category.
  await client.saveObjects({ indexName, objects: records, batchSize: 500, waitForTasks: true });
  report.updated = records.length;

  const keep = new Set(records.map((record) => record.objectID));
  const toDelete: string[] = [];
  await client.browseObjects<{ source?: string; store?: string }>({
    indexName,
    browseParams: {
      filters: `categoryName:"${category.name}"`,
      attributesToRetrieve: ["source", "store"],
      hitsPerPage: 1000,
    },
    aggregator: (response) => {
      for (const hit of response.hits) {
        // Legacy records (pre-"source") from Mercado Livre are identified by their store.
        const source = hit.source ?? (hit.store === "Mercado Livre" ? SOURCE_MERCADO_LIVRE : null);
        if (source === SOURCE_MERCADO_LIVRE && !keep.has(hit.objectID)) toDelete.push(hit.objectID);
      }
    },
  });
  if (toDelete.length > 0) {
    await client.deleteObjects({ indexName, objectIDs: toDelete, waitForTasks: true });
  }
  report.removed = toDelete.length;
  report.success = true;
  return report;
}

export async function syncOffersToAlgolia(options: SyncOptions = {}): Promise<SyncOffersResult> {
  const startedAt = Date.now();
  const selected = options.category
    ? MENU_CATEGORIES.filter((category) => category.name === options.category)
    : MENU_CATEGORIES;
  if (selected.length === 0) throw new Error(`Categoria desconhecida: ${options.category}`);

  const token = await getMeliToken();
  const { client, indexName } = getAlgoliaConfig();
  const pageSize = Math.min(options.recordsPerQuery ?? SEARCH_PAGE_SIZE, 100);
  const targetPerCategory = Math.min(options.targetPerCategory ?? TARGET_OFFERS_PER_CATEGORY, 150);
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

  await applyIndexSettings(client, indexName);

  const categories: CategorySyncReport[] = [];
  for (const category of selected) {
    const report = await syncCategory(client, indexName, category, headers, pageSize, targetPerCategory);
    console.info("Algolia sync category report", report);
    categories.push(report);
  }

  const indexed = categories.reduce((sum, report) => sum + report.updated, 0);
  const removed = categories.reduce((sum, report) => sum + report.removed, 0);
  const failed = categories.filter((report) => !report.success).map((report) => report.category);
  const result: SyncOffersResult = {
    indexed,
    removed,
    categories,
    message: failed.length
      ? `${indexed} ofertas atualizadas; falha (índice preservado) em: ${failed.join(", ")}.`
      : `${indexed} ofertas atualizadas e ${removed} removidas.`,
  };
  console.info("Algolia sync completed", { ...result, durationMs: Date.now() - startedAt });
  return result;
}

export async function configureDailyAlgoliaSync(): Promise<void> {
  if (cronConfigured) return;
  const cronSecret = process.env["LOVABLE_CRON_SECRET"];
  if (!cronSecret) throw new Error("O segredo da tarefa agendada não está configurado.");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.rpc("configure_algolia_sync_job", {
    _cron_secret: cronSecret,
  });
  if (error) {
    console.error("Algolia cron configuration failed", error);
    throw new Error("Não foi possível configurar a tarefa diária.");
  }
  cronConfigured = true;
}