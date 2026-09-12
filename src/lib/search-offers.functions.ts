import { algoliasearch } from "algoliasearch";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const AFFILIATE_PARAMS = "matt_tool=15523479&matt_word=compareecompre";

export type Offer = {
  id: string;
  title: string;
  imageUrl: string | null;
  store: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  freeShipping: boolean;
  affiliateUrl: string;
  category: string | null;
  sellerCount: number;
};

export type OfferFilter = {
  id: string;
  name: string;
  values: Array<{ id: string; name: string; results: number }>;
};

export type OfferSort = "relevance" | "price_asc" | "price_desc";

export type SearchOffersResult = {
  offers: Offer[];
  availableFilters: OfferFilter[];
  paging: { total: number; offset: number; limit: number };
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

type CatalogProduct = {
  id: string;
  name: string;
  domain_id?: string;
  pictures?: Array<{ url?: string }>;
  attributes?: Array<{ id?: string; value_name?: string }>;
};

type CatalogItem = {
  item_id?: string;
  price?: number;
  original_price?: number | null;
  category_id?: string;
  shipping?: { free_shipping?: boolean };
  permalink?: string;
};

const INDEX_NAME = "produtos_mercado_livre";
const RESULTS_PER_PAGE = 40;

export function withAffiliate(url: string): string {
  const clean = url.split("#")[0] ?? url;
  const separator = clean.includes("?") ? "&" : "?";
  return `${clean}${separator}${AFFILIATE_PARAMS}`;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getMeliToken(): Promise<string | null> {
  const clientId = process.env["ML_CLIENT_ID"];
  const clientSecret = process.env["ML_CLIENT_SECRET"];
  if (!clientId || !clientSecret) {
    console.error("Mercado Livre credentials are missing");
    return null;
  }
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;

  try {
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
      return null;
    }
    const json = (await response.json()) as { access_token: string; expires_in: number };
    cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
    return cachedToken.value;
  } catch (error) {
    console.error("Mercado Livre token error", error);
    return null;
  }
}

function getAlgoliaConfig() {
  const applicationId = process.env["ALGOLIA_APPLICATION_ID"];
  const apiKey = process.env["ALGOLIA_API_KEY"];
  const indexName = process.env["ALGOLIA_INDEX_NAME"] ?? INDEX_NAME;
  if (!applicationId || !apiKey) throw new Error("A busca inteligente não está configurada.");
  return { client: algoliasearch(applicationId, apiKey), indexName };
}

function emptyResult(offset: number, limit = RESULTS_PER_PAGE): SearchOffersResult {
  return { offers: [], availableFilters: [], paging: { total: 0, offset, limit } };
}

function facetsToFilters(facets?: Record<string, Record<string, number>>): OfferFilter[] {
  const labels: Record<string, string> = {
    categoryName: "Categoria",
    brand: "Marca",
    freeShipping: "Frete grátis",
  };
  return Object.entries(facets ?? {}).flatMap(([id, values]) => {
    const mappedValues = Object.entries(values)
      .filter(([name]) => name && name !== "null")
      .sort(([, left], [, right]) => right - left)
      .slice(0, 12)
      .map(([name, results]) => ({ id: name, name: name === "true" ? "Sim" : name, results }));
    return mappedValues.length > 0
      ? [{ id, name: labels[id] ?? id, values: mappedValues }]
      : [];
  });
}

export const searchOffers = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({
      query: z.string().min(1).max(120),
      limit: z.number().int().min(1).max(50).optional(),
      offset: z.number().int().min(0).max(10_000).optional(),
      sort: z.enum(["relevance", "price_asc", "price_desc"]).optional(),
      filters: z.array(z.object({ id: z.string(), value: z.string() })).optional(),
    }).parse(data),
  )
  .handler(async ({ data }): Promise<SearchOffersResult> => {
    const limit = RESULTS_PER_PAGE;
    const offset = data.offset ?? 0;
    const page = Math.floor(offset / limit);
    try {
      const { client, indexName } = getAlgoliaConfig();
      const response = await client.searchSingleIndex<AlgoliaOffer>({
        indexName,
        searchParams: {
          query: data.query,
          page,
          hitsPerPage: limit,
          facets: ["categoryName", "brand", "freeShipping"],
          typoTolerance: true,
          attributesToRetrieve: [
            "objectID", "title", "imageUrl", "store", "price", "originalPrice",
            "discountPercent", "freeShipping", "affiliateUrl", "category", "sellerCount",
          ],
        },
      });
      const validOffers = response.hits.flatMap((hit) => {
        if (!Number.isFinite(hit.price) || hit.price <= 0) return [];
        return [{
          id: hit.objectID,
          title: hit.title,
          imageUrl: hit.imageUrl,
          store: hit.store,
          price: hit.price,
          originalPrice: hit.originalPrice,
          discountPercent: hit.discountPercent,
          freeShipping: Boolean(hit.freeShipping),
          affiliateUrl: hit.affiliateUrl,
          category: hit.category,
          sellerCount: hit.sellerCount,
        }];
      });
      if (data.sort === "price_asc") validOffers.sort((left, right) => left.price - right.price);
      if (data.sort === "price_desc") validOffers.sort((left, right) => right.price - left.price);
      return {
        offers: validOffers,
        availableFilters: facetsToFilters(response.facets),
        paging: { total: response.nbHits, offset: page * limit, limit },
      };
    } catch (error) {
      console.error("Algolia search failed", error);
      return emptyResult(offset, limit);
    }
  });

const syncInput = z.object({
  queries: z.array(z.string().min(2).max(60)).min(1).max(20).optional(),
  recordsPerQuery: z.number().int().min(10).max(100).optional(),
});

export const syncOffersToAlgolia = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => syncInput.parse(data))
  .handler(async ({ data }): Promise<{ indexed: number; skipped: number; message: string }> => {
    const token = await getMeliToken();
    if (!token) throw new Error("Não foi possível autenticar a sincronização do Mercado Livre.");
    const { client, indexName } = getAlgoliaConfig();
    const queries = data.queries ?? [
      "celular", "notebook", "smart tv", "air fryer", "geladeira", "fone bluetooth",
      "video game", "máquina de lavar", "aspirador", "cafeteira",
    ];
    const limit = data.recordsPerQuery ?? 40;
    const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
    const products = new Map<string, CatalogProduct>();

    for (const query of queries) {
      const params = new URLSearchParams({ status: "active", site_id: "MLB", q: query, limit: String(limit) });
      const response = await fetch(`https://api.mercadolibre.com/products/search?${params}`, { headers });
      if (!response.ok) {
        console.error("Mercado Livre sync search failed", query, response.status, await response.text());
        continue;
      }
      const json = (await response.json()) as { results?: CatalogProduct[] };
      for (const product of json.results ?? []) products.set(product.id, product);
    }

    const records: AlgoliaOffer[] = [];
    let skipped = 0;
    const productList = [...products.values()];
    for (let position = 0; position < productList.length; position += 10) {
      const group = productList.slice(position, position + 10);
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
          const cheapest = items.reduce((best, item) => (Number(item.price) < Number(best.price) ? item : best));
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
            affiliateUrl: withAffiliate(
              cheapest.permalink ?? `https://www.mercadolivre.com.br/p/${product.id}`,
            ),
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
        attributesForFaceting: ["searchable(categoryName)", "searchable(brand)", "filterOnly(freeShipping)"],
        customRanking: ["asc(price)"],
        typoTolerance: true,
        removeStopWords: ["pt"],
        ignorePlurals: ["pt"],
      },
    });
    await client.saveObjects({ indexName, objects: records, batchSize: 500, waitForTasks: true });
    return { indexed: records.length, skipped, message: `${records.length} ofertas sincronizadas.` };
  });