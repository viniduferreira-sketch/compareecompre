import { algoliasearch } from "algoliasearch";

const AFFILIATE_PARAMS = "matt_tool=15523479&matt_word=compareecompre";
const DEFAULT_INDEX_NAME = "produtos_mercado_livre";
const DEFAULT_PRODUCT_LIMIT = 800;
const MAX_SEARCH_PAGES = 10;
const SEARCH_PAGE_SIZE = 50;
const ITEM_LOOKUP_CONCURRENCY = 20;

const DEFAULT_QUERIES = [
  "celulares",
  "eletrônicos",
  "informática",
  "notebooks",
  "smart tv",
  "áudio e fones",
  "games e consoles",
  "eletrodomésticos",
  "casa inteligente",
  "câmeras",
];

type SyncOptions = {
  queries?: string[];
  recordsPerQuery?: number;
  maxProducts?: number;
};

export type SyncOffersResult = {
  indexed: number;
  skipped: number;
  discovered: number;
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
  price?: number;
  original_price?: number | null;
  category_id?: string;
  shipping?: { free_shipping?: boolean };
  permalink?: string;
};

type AlgoliaOffer = {
  objectID: string;
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
  sellerCount: number;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getMeliToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;

  const clientId = process.env["ML_CLIENT_ID"];
  const clientSecret = process.env["ML_CLIENT_SECRET"];
  if (!clientId || !clientSecret) throw new Error("As credenciais do Mercado Livre não estão configuradas.");

  const response = await fetch("https://api.mercadolibre.com/oauth/token", {
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

function getAlgoliaConfig() {
  const applicationId = process.env["ALGOLIA_APPLICATION_ID"];
  const apiKey = process.env["ALGOLIA_API_KEY"];
  const indexName = process.env["ALGOLIA_INDEX_NAME"] ?? DEFAULT_INDEX_NAME;
  if (!applicationId || !apiKey) throw new Error("A busca inteligente não está configurada.");
  return { client: algoliasearch(applicationId, apiKey), indexName };
}

export async function syncOffersToAlgolia(options: SyncOptions = {}): Promise<SyncOffersResult> {
  const startedAt = Date.now();
  const token = await getMeliToken();
  const { client, indexName } = getAlgoliaConfig();
  const queries = options.queries ?? DEFAULT_QUERIES;
  const pageSize = Math.min(options.recordsPerQuery ?? SEARCH_PAGE_SIZE, 100);
  const maxProducts = Math.min(options.maxProducts ?? DEFAULT_PRODUCT_LIMIT, 1_000);
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  const products = new Map<string, CatalogProduct>();
  const exhaustedQueries = new Set<string>();

  for (let page = 0; page < MAX_SEARCH_PAGES && products.size < maxProducts; page += 1) {
    for (const query of queries) {
      if (products.size >= maxProducts) break;
      if (exhaustedQueries.has(query)) continue;

      const params = new URLSearchParams({
        status: "active",
        site_id: "MLB",
        q: query,
        limit: String(pageSize),
        offset: String(page * pageSize),
      });
      const response = await fetch(`https://api.mercadolibre.com/products/search?${params}`, { headers });
      if (!response.ok) {
        console.error("Mercado Livre sync search failed", query, page, response.status, await response.text());
        exhaustedQueries.add(query);
        continue;
      }

      const json = (await response.json()) as { results?: CatalogProduct[] };
      const pageProducts = json.results ?? [];
      if (pageProducts.length < pageSize) exhaustedQueries.add(query);
      for (const product of pageProducts) {
        if (products.size >= maxProducts) break;
        if (product.id && product.name) products.set(product.id, product);
      }
    }
  }

  const records: AlgoliaOffer[] = [];
  let skipped = 0;
  const productList = [...products.values()];
  for (let position = 0; position < productList.length; position += ITEM_LOOKUP_CONCURRENCY) {
    const group = productList.slice(position, position + ITEM_LOOKUP_CONCURRENCY);
    const mapped = await Promise.all(group.map(async (product): Promise<AlgoliaOffer | null> => {
      try {
        const response = await fetch(
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
        const price = Number(cheapest.price);
        const originalPrice = cheapest.original_price && cheapest.original_price > price
          ? cheapest.original_price
          : null;
        const brand = product.attributes?.find((attribute) => attribute.id === "BRAND")?.value_name ?? null;
        const categoryName = product.domain_id?.replace(/^MLB-/, "").replaceAll("-", " ") ?? null;

        return {
          objectID: product.id,
          title: product.name,
          imageUrl: product.pictures?.[0]?.url ?? null,
          store: "Mercado Livre",
          price,
          originalPrice,
          discountPercent: originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : null,
          freeShipping: Boolean(cheapest.shipping?.free_shipping),
          affiliateUrl: withAffiliate(cheapest.permalink ?? `https://www.mercadolivre.com.br/p/${product.id}`),
          category: cheapest.category_id ?? product.domain_id ?? null,
          categoryName,
          brand,
          sellerCount: items.length,
        };
      } catch (error) {
        console.error("Mercado Livre sync item failed", product.id, error);
        return null;
      }
    }));

    for (const record of mapped) {
      if (record) records.push(record);
      else skipped += 1;
    }
  }

  if (records.length === 0) throw new Error("A sincronização não encontrou ofertas com preço válido.");

  await client.setSettings({
    indexName,
    indexSettings: {
      searchableAttributes: ["title", "brand", "categoryName"],
      attributesForFaceting: ["searchable(categoryName)", "searchable(brand)", "freeShipping"],
      typoTolerance: true,
      removeStopWords: ["pt"],
      ignorePlurals: ["pt"],
      replicas: [`${indexName}_price_asc`, `${indexName}_price_desc`],
    },
  });
  await client.saveObjects({ indexName, objects: records, batchSize: 500, waitForTasks: true });
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

  const result = {
    indexed: records.length,
    skipped,
    discovered: productList.length,
    message: `${records.length} ofertas sincronizadas de ${productList.length} produtos encontrados.`,
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