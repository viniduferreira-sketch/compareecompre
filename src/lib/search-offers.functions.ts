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
      const searchIndex = data.sort === "price_asc"
        ? `${indexName}_price_asc`
        : data.sort === "price_desc"
          ? `${indexName}_price_desc`
          : indexName;
      const response = await client.searchSingleIndex<AlgoliaOffer>({
        indexName: searchIndex,
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
      return {
        offers: validOffers,
        availableFilters: facetsToFilters(response.facets),
        paging: { total: response.nbHits ?? validOffers.length, offset: page * limit, limit },
      };
    } catch (error) {
      console.error("Algolia search failed", error);
      return emptyResult(offset, limit);
    }
  });

export const getHomeOffers = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ urgent: Offer[]; priceDrops: Offer[]; popular: Offer[] }> => {
    try {
      const { client, indexName } = getAlgoliaConfig();
      const [urgentResponse, priceDropsResponse, popularResponse] = await Promise.all([
        client.searchSingleIndex<AlgoliaOffer>({
          indexName,
          searchParams: {
            query: "",
            hitsPerPage: 14,
            filters: "price > 0 AND discountPercent >= 10",
            attributesToRetrieve: ["objectID", "title", "imageUrl", "store", "price", "originalPrice", "discountPercent", "freeShipping", "affiliateUrl", "category", "sellerCount"],
          },
        }),
        client.searchSingleIndex<AlgoliaOffer>({
          indexName: `${indexName}_price_asc`,
          searchParams: {
            query: "",
            hitsPerPage: 14,
            filters: "price > 0",
            attributesToRetrieve: ["objectID", "title", "imageUrl", "store", "price", "originalPrice", "discountPercent", "freeShipping", "affiliateUrl", "category", "sellerCount"],
          },
        }),
        client.searchSingleIndex<AlgoliaOffer>({
          indexName,
          searchParams: {
            query: "iphone",
            hitsPerPage: 14,
            typoTolerance: true,
            attributesToRetrieve: ["objectID", "title", "imageUrl", "store", "price", "originalPrice", "discountPercent", "freeShipping", "affiliateUrl", "category", "sellerCount"],
          },
        }),
      ]);

      const mapHits = (hits: AlgoliaOffer[]) => hits.flatMap((hit) => {
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

      return { urgent: mapHits(urgentResponse.hits), priceDrops: mapHits(priceDropsResponse.hits), popular: mapHits(popularResponse.hits) };
    } catch (error) {
      console.error("Homepage offers failed", error);
      return { urgent: [], priceDrops: [], popular: [] };
    }
  },
);
