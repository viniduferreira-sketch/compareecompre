import { getAlgoliaIndexingConfig, CATALOG_FACETS } from "@/lib/algolia-indexing.server";
import { mercadoLivreIdentifiers } from "./product-identifiers";
import { fetchQA_MercadoLivre, type PartnerQA } from "@/lib/partner-qa.server";
import { ADULT_CONTENT_REASON, getAdultContentMatch } from "./content-policy";
import { addDiscard, type DiscardReasons } from "./import-discards";
import { enrichPopularity } from "./popularity.server";
import { POPULARITY_INDEX_SETTINGS } from "./popularity";
import { applyStoreDisplay } from "./partner-stores";
import { applyPriceReviewToRecords } from "./price-review.server";

const AFFILIATE_PARAMS = "matt_tool=15523479&matt_word=compareecompre";
const DEFAULT_INDEX_NAME = "produtos_mercado_livre";
const TARGET_OFFERS_PER_CATEGORY = 100;
const MAX_SEARCH_PAGES_PER_QUERY = 10;
const MAX_SEARCH_OFFSET = 100; // Mercado Livre rejects larger offsets on products/search.
const SEARCH_PAGE_SIZE = 50;
const ITEM_LOOKUP_CONCURRENCY = 6;

const MENU_CATEGORIES = [
  { name: "Eletrônicos", queries: ["smart tv", "fone bluetooth", "caixa de som", "tablet", "câmera digital", "smartwatch", "monitor"] },
  { name: "Moda", queries: ["tênis", "camiseta", "vestido", "calça jeans", "bolsa", "relógio", "jaqueta"] },
  { name: "Casa", queries: ["air fryer", "liquidificador", "cafeteira", "aspirador", "ventilador", "microondas", "panela elétrica"] },
  { name: "Celulares", queries: ["iphone", "samsung galaxy", "motorola celular", "xiaomi celular", "realme celular", "smartphone"] },
  { name: "Games", queries: ["playstation", "xbox", "nintendo switch", "controle gamer", "headset gamer", "cadeira gamer", "jogo videogame"] },
  { name: "Beleza", queries: ["perfume", "maquiagem", "secador de cabelo", "chapinha", "barbeador", "hidratante", "protetor solar"] },
  { name: "Esportes", queries: ["bicicleta", "tênis corrida", "halter", "bola futebol", "camisa de time", "suplemento", "mochila esportiva"] },
] as const;

type SyncOptions = {
  recordsPerQuery?: number;
  targetPerCategory?: number;
};

export type SyncOffersResult = {
  indexed: number;
  skipped: number;
  discovered: number;
  categories: Record<string, number>;
  discardReasons: DiscardReasons;
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
  item_id?: string;
  title?: string;
  thumbnail?: string;
  price?: number;
  original_price?: number | null;
  category_id?: string;
  shipping?: { free_shipping?: boolean };
  permalink?: string;
};

type AlgoliaOffer = {
  objectID: string;
  itemId: string;
  title: string;
  imageUrl: string | null;
  store: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  freeShipping: boolean;
  affiliateUrl: string;
  category: string | null;
  categoryName: string | null;
  brand: string | null;
  gtin: string | null;
  model: string | null;
  sellerCount: number;
  qa: PartnerQA[];
  source: "mercadolivre";
  status: "active";
  last_synced_at: string;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function fetchWithRetry(input: string, init?: RequestInit, attempts = 3): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(input, init);
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === attempts) return response;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }
  throw lastError instanceof Error ? lastError : new Error("Falha temporária ao consultar o Mercado Livre.");
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

export async function syncOffersToAlgolia(options: SyncOptions = {}): Promise<SyncOffersResult> {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const controls = await db.from("partner_stores").select("network,external_id,merchant_name,import_enabled,display_enabled").eq("network", "mercadolivre");
  if (controls.error) throw new Error("Não foi possível conferir os controles do Mercado Livre.");
  if ((controls.data ?? []).some((store) => !store.import_enabled)) return { indexed: 0, skipped: 0, discovered: 0, categories: {}, discardReasons: {}, message: "Importação do Mercado Livre desativada pelo administrador." };
  const startedAt = Date.now();
  const token = await getMeliToken();
  const { client } = getAlgoliaIndexingConfig();
  const indexName = DEFAULT_INDEX_NAME;
  const pageSize = Math.min(options.recordsPerQuery ?? SEARCH_PAGE_SIZE, 100);
  const targetPerCategory = Math.min(options.targetPerCategory ?? TARGET_OFFERS_PER_CATEGORY, 150);
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  const records: AlgoliaOffer[] = [];
  const syncedAt = new Date().toISOString();
  const indexedIds = new Set<string>();
  const categories: Record<string, number> = {};
  let discovered = 0;
  let skipped = 0;
  const discardReasons: DiscardReasons = {};

  const mapProduct = async (product: CatalogProduct, categoryName: string): Promise<AlgoliaOffer | null> => {
    try {
      if (getAdultContentMatch({ store: "Mercado Livre", category: product.domain_id, title: product.name })) {
        addDiscard(discardReasons, ADULT_CONTENT_REASON);
        return null;
      }
      // Direct /products/{id} revalidation also captures these; never infer from titles.
      const identifiers = mercadoLivreIdentifiers(product.attributes);
      const response = await fetchWithRetry(
        `https://api.mercadolibre.com/products/${encodeURIComponent(product.id)}/items?limit=20`,
        { headers },
      );
      if (!response.ok) return null;

      const json = (await response.json()) as { results?: CatalogItem[] };
      const items = (json.results ?? []).filter(
        (item) => typeof item.price === "number" && Number.isFinite(item.price) && item.price > 0,
      );
      if (items.length === 0) return null;

      const cheapest = items.reduce((best, item) => Number(item.price) < Number(best.price) ? item : best);
      if (getAdultContentMatch({ store: "Mercado Livre", category: cheapest.category_id, title: cheapest.title })) {
        addDiscard(discardReasons, ADULT_CONTENT_REASON);
        return null;
      }
      const price = Number(cheapest.price);
      const originalPrice = cheapest.original_price && cheapest.original_price > price
        ? cheapest.original_price
        : null;
      const brand = product.attributes?.find((attribute) => attribute.id === "BRAND")?.value_name ?? null;
       const itemId = cheapest.item_id?.trim() ?? "";
       const qa = itemId ? await fetchQA_MercadoLivre(itemId, headers, fetchWithRetry) : [];

      return {
        objectID: product.id,
         itemId,
        title: product.name,
        imageUrl: product.pictures?.[0]?.url ?? cheapest.thumbnail ?? null,
        store: "Mercado Livre",
        price,
        originalPrice,
        discountPercent: originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : null,
        freeShipping: Boolean(cheapest.shipping?.free_shipping),
        affiliateUrl: withAffiliate(cheapest.permalink ?? `https://www.mercadolivre.com.br/p/${product.id}`),
        category: cheapest.category_id ?? product.domain_id ?? null,
        categoryName,
        brand,
        ...identifiers,
        sellerCount: items.length,
         qa,
        source: "mercadolivre",
        status: "active",
        last_synced_at: syncedAt,
      };
    } catch (error) {
      console.error("Mercado Livre sync item failed", product.id, error);
      return null;
    }
  };

  for (const category of MENU_CATEGORIES) {
    const categoryRecords: AlgoliaOffer[] = [];
    const seenInCategory = new Set<string>();

    for (const query of category.queries) {
      if (categoryRecords.length >= targetPerCategory) break;
      for (let page = 0; page < MAX_SEARCH_PAGES_PER_QUERY && page * pageSize <= MAX_SEARCH_OFFSET; page += 1) {
        const params = new URLSearchParams({
          status: "active",
          site_id: "MLB",
          q: query,
          limit: String(pageSize),
          offset: String(page * pageSize),
        });
        const response = await fetchWithRetry(`https://api.mercadolibre.com/products/search?${params}`, { headers });
        if (!response.ok) {
          console.error("Mercado Livre sync search failed", category.name, query, page, response.status, await response.text());
          break;
        }

        const json = (await response.json()) as { results?: CatalogProduct[] };
        const pageProducts = (json.results ?? []).filter((product) => {
          if (!product.id || !product.name || seenInCategory.has(product.id) || indexedIds.has(product.id)) return false;
          seenInCategory.add(product.id);
          return true;
        });
        discovered += pageProducts.length;

        for (let position = 0; position < pageProducts.length; position += ITEM_LOOKUP_CONCURRENCY) {
          if (categoryRecords.length >= targetPerCategory) break;
          const group = pageProducts.slice(position, position + ITEM_LOOKUP_CONCURRENCY);
          const mapped = await Promise.all(group.map((product) => mapProduct(product, category.name)));
          for (const record of mapped) {
            if (!record || categoryRecords.length >= targetPerCategory) {
              if (!record) skipped += 1;
              continue;
            }
            categoryRecords.push(record);
            indexedIds.add(record.objectID);
          }
        }
        if (categoryRecords.length >= targetPerCategory || (json.results ?? []).length < pageSize) break;
      }
    }

    if (categoryRecords.length < targetPerCategory) {
      // Preserve existing records for this category; only upsert what was verified now.
      console.error("Mercado Livre category below target", category.name, categoryRecords.length);
    }
    categories[category.name] = categoryRecords.length;
    records.push(...categoryRecords);
  }

  if (records.length === 0) throw new Error("A sincronização não encontrou ofertas com preço válido.");

  await client.setSettings({
    indexName,
    indexSettings: {
      searchableAttributes: ["title", "brand", "categoryName"],
      attributesForFaceting: CATALOG_FACETS,
      typoTolerance: true,
      removeStopWords: ["pt"],
      ignorePlurals: ["pt"],
      replicas: [`${indexName}_price_asc`, `${indexName}_price_desc`],
      ...POPULARITY_INDEX_SETTINGS,
    },
  });
  // Upsert only: existing records are never deleted or replaced during synchronization.
  const enriched = applyStoreDisplay(await applyPriceReviewToRecords(await enrichPopularity(records)), controls.data ?? []);
  await client.saveObjects({ indexName, objects: enriched, batchSize: 500, waitForTasks: true });
  await Promise.all([
    client.setSettings({
      indexName: `${indexName}_price_asc`,
      indexSettings: { ...POPULARITY_INDEX_SETTINGS, ranking: ["asc(price)", "typo", "geo", "words", "filters", "proximity", "attribute", "exact", "custom"] },
    }),
    client.setSettings({
      indexName: `${indexName}_price_desc`,
      indexSettings: { ...POPULARITY_INDEX_SETTINGS, ranking: ["desc(price)", "typo", "geo", "words", "filters", "proximity", "attribute", "exact", "custom"] },
    }),
  ]);

  const result = {
    indexed: records.length,
    skipped,
    discovered,
    categories,
    discardReasons,
    message: `${records.length} ofertas sincronizadas em ${Object.keys(categories).length} categorias.`,
  };
  console.info("Algolia sync completed", { ...result, durationMs: Date.now() - startedAt });

  // After the category sync, revalidate stale Mercado Livre records directly against
  // the items API (never by absence from the search). Failures here must not fail the sync.
  try {
    const { revalidateMercadoLivreOffers } = await import("@/lib/ml-revalidate.server");
    const revalidation = await revalidateMercadoLivreOffers();
    console.info("Mercado Livre revalidation finished", revalidation);
  } catch (error) {
    console.error("Mercado Livre revalidation failed", error);
  }
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