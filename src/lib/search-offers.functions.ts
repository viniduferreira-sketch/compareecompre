import { liteClient } from "algoliasearch/lite";
import { freshnessNumericFilters, isFreshPrice } from "@/lib/offer-freshness";
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
  source: string;
  status: string;
  last_synced_at: string | null;
  last_synced_at_timestamp: number;
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

export type CategoryCover = {
  imageUrl: string;
  title: string;
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
  source: string;
  status: string;
  last_synced_at: string | null;
  last_synced_at_timestamp: number;
};

const INDEX_NAME = "produtos_mercado_livre";
const RESULTS_PER_PAGE = 40;

export function withAffiliate(url: string): string {
  const clean = url.split("#")[0] ?? url;
  const separator = clean.includes("?") ? "&" : "?";
  return `${clean}${separator}${AFFILIATE_PARAMS}`;
}

function getAlgoliaConfig() {
  const applicationId = import.meta.env.VITE_LOVABLE_CONNECTOR_ALGOLIA_APPLICATION_ID;
  const apiKey = import.meta.env.VITE_LOVABLE_CONNECTOR_ALGOLIA_PUBLIC_API_KEY;
  if (!applicationId || !apiKey) throw new Error("A busca inteligente não está configurada.");
  return { client: liteClient(applicationId, apiKey), indexName: INDEX_NAME };
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

export async function searchOffers({ data: input }: { data: unknown }): Promise<SearchOffersResult> {
    const data = z.object({
      query: z.string().min(1).max(120),
      limit: z.number().int().min(1).max(50).optional(),
      offset: z.number().int().min(0).max(10_000).optional(),
      sort: z.enum(["relevance", "price_asc", "price_desc"]).optional(),
      filters: z.array(z.object({ id: z.string(), value: z.string() })).optional(),
    }).parse(input);
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
      const { results } = await client.searchForHits<AlgoliaOffer>({ requests: [{
        indexName: searchIndex,
          query: data.query,
          numericFilters: freshnessNumericFilters(),
          filters: data.filters?.filter(filter => ["categoryName", "brand", "freeShipping"].includes(filter.id)).map(filter => `${filter.id}:${JSON.stringify(filter.value)}`).join(" AND ") || undefined,
          page,
          hitsPerPage: limit,
          facets: ["categoryName", "brand", "freeShipping"],
          typoTolerance: true,
          attributesToRetrieve: [
            "objectID", "title", "imageUrl", "store", "price", "originalPrice",
            "discountPercent", "freeShipping", "affiliateUrl", "category", "sellerCount", "source", "status", "last_synced_at", "last_synced_at_timestamp",
          ],
      }] });
      const response = results[0];
      if (!response) return emptyResult(offset, limit);
      const validOffers = response.hits.flatMap((hit) => {
        if (!Number.isFinite(hit.price) || hit.price <= 0 || !isFreshPrice(hit.last_synced_at)) return [];
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
          source: hit.source,
          status: hit.status,
          last_synced_at: hit.last_synced_at,
          last_synced_at_timestamp: hit.last_synced_at_timestamp,
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
}

export async function getHomeOffers(): Promise<{
    urgent: Offer[];
    priceDrops: Offer[];
    popular: Offer[];
    categoryCovers: Record<string, CategoryCover>;
  }> {
    try {
      const { client, indexName } = getAlgoliaConfig();
      const searchIndex = async (request: { indexName: string; searchParams: { query: string; hitsPerPage: number; filters?: string; attributesToRetrieve: string[]; typoTolerance?: boolean } }) => {
        const { results } = await client.searchForHits<AlgoliaOffer>({ requests: [{ indexName: request.indexName, ...request.searchParams, numericFilters: freshnessNumericFilters() }] });
        return results[0] ?? { hits: [] };
      };
      const categoryCoversConfig = [
        { name: "Eletrônicos", query: "" },
        { name: "Moda", query: "camiseta" },
        { name: "Casa", query: "" },
        { name: "Celulares", query: "" },
        { name: "Games", query: "" },
        { name: "Beleza", query: "" },
        { name: "Esportes", query: "" },
      ];
      const [urgentResponse, priceDropsResponse, popularResponse, categoryResponses] = await Promise.all([
        searchIndex({
          indexName,
          searchParams: {
            query: "",
            hitsPerPage: 14,
            filters: "price > 0 AND discountPercent >= 10",
            attributesToRetrieve: ["objectID", "title", "imageUrl", "store", "price", "originalPrice", "discountPercent", "freeShipping", "affiliateUrl", "category", "sellerCount", "source", "status", "last_synced_at", "last_synced_at_timestamp"],
          },
        }),
        searchIndex({
          indexName: `${indexName}_price_asc`,
          searchParams: {
            query: "",
            hitsPerPage: 14,
            filters: "price > 0",
            attributesToRetrieve: ["objectID", "title", "imageUrl", "store", "price", "originalPrice", "discountPercent", "freeShipping", "affiliateUrl", "category", "sellerCount", "source", "status", "last_synced_at", "last_synced_at_timestamp"],
          },
        }),
        searchIndex({
          indexName,
          searchParams: {
            query: "iphone",
            hitsPerPage: 14,
            typoTolerance: true,
            attributesToRetrieve: ["objectID", "title", "imageUrl", "store", "price", "originalPrice", "discountPercent", "freeShipping", "affiliateUrl", "category", "sellerCount", "source", "status", "last_synced_at", "last_synced_at_timestamp"],
          },
        }),
        Promise.all(categoryCoversConfig.map(({ name, query }) =>
          searchIndex({
            indexName,
            searchParams: {
              query,
              hitsPerPage: name === "Moda" ? 20 : 1,
              filters: `price > 0 AND categoryName:"${name}"`,
              attributesToRetrieve: ["title", "imageUrl"],
            },
          }),
        )),
      ]);

      const mapHits = (hits: AlgoliaOffer[]) => hits.flatMap((hit) => {
        if (!Number.isFinite(hit.price) || hit.price <= 0 || !isFreshPrice(hit.last_synced_at)) return [];
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
          source: hit.source,
          status: hit.status,
          last_synced_at: hit.last_synced_at,
          last_synced_at_timestamp: hit.last_synced_at_timestamp,
        }];
      });

      const categoryCovers = Object.fromEntries(categoryResponses.flatMap((response, index) => {
        const categoryName = categoryCoversConfig[index]?.name;
        const hit = response.hits.find((item) => {
          if (typeof item.imageUrl !== "string" || item.imageUrl.length === 0) return false;
          if (categoryName !== "Moda") return true;

          const title = item.title.toLocaleLowerCase("pt-BR");
          const isApparelOrFootwear = /\b(camiseta|camisa|blusa|vestido|calça|shorts|bermuda|jaqueta|tênis|sapato|sandália|bota)\b/.test(title);
          const isAccessory = /\b(chaveiro|pingente|colar|pulseira|brinco|miniatura)\b/.test(title);
          return isApparelOrFootwear && !isAccessory;
        });
        return hit && categoryName && hit.imageUrl
          ? [[categoryName, { imageUrl: hit.imageUrl, title: hit.title }]]
          : [];
      }));

      return {
        urgent: mapHits(urgentResponse.hits),
        priceDrops: mapHits(priceDropsResponse.hits),
        popular: mapHits(popularResponse.hits),
        categoryCovers,
      };
    } catch (error) {
      console.error("Homepage offers failed", error);
      return { urgent: [], priceDrops: [], popular: [], categoryCovers: {} };
    }
}

