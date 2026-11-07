import { liteClient } from "algoliasearch/lite";
import { z } from "zod";
import { selectVisibleOffers } from "./offer-freshness";
import { interleaveByStore } from "./storefront-mix";
import { storefrontIdentity, type StorefrontRecord } from "./storefront-record";
import type { Offer, OfferFilter, OfferSort, SearchOffersResult, CategoryCover } from "./search-offers.functions";
export type { Offer, OfferFilter, OfferSort } from "./search-offers.functions";

type AlgoliaOffer = StorefrontRecord & {
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
  source?: string;
  status?: string | undefined;
  last_synced_at?: string | undefined;
};

const INDEX_NAME = "produtos_mercado_livre";
const RESULTS_PER_PAGE = 40;

function getAlgoliaConfig() {
  const applicationId = import.meta.env["VITE_LOVABLE_CONNECTOR_ALGOLIA_APPLICATION_ID"];
  const apiKey = import.meta.env["VITE_LOVABLE_CONNECTOR_ALGOLIA_PUBLIC_API_KEY"];
  if (!applicationId || !apiKey) throw new Error("A busca inteligente não está configurada.");
  const client = liteClient(applicationId, apiKey);
  return {
    indexName: INDEX_NAME,
    client: {
      async searchSingleIndex<T>({ indexName, searchParams }: { indexName: string; searchParams: Record<string, unknown> }) {
        let results;
        try {
          ({ results } = await client.searchForHits<T>({ requests: [{ indexName, ...searchParams }] }));
        } catch (error) {
          const e = error as { status?: number; message?: string };
          console.error("[Algolia debug] erro", { indexName, searchParams, status: e.status, message: e.message });
          throw error;
        }
        const response = results[0];
        console.info("[Algolia debug] resposta", { indexName, searchParams, status: 200, nbHits: response?.nbHits, response });
        if (!response) throw new Error("O Algolia não retornou resultados.");
        return response;
      }
    }
  };
}

function emptyResult(offset: number, limit = RESULTS_PER_PAGE): SearchOffersResult {
  return { offers: [], availableFilters: [], paging: { total: 0, offset, limit } };
}

function facetsToFilters(facets?: Record<string, Record<string, number>>): OfferFilter[] {
  const labels: Record<string, string> = {
    store: "Loja",
    categoryName: "Categoria",
    brand: "Marca",
    freeShipping: "Frete grátis",
  };
  return Object.entries(facets ?? {}).flatMap(([id, values]) => {
    const mappedValues = Object.entries(values)
      .filter(([name]) => name && name !== "null")
      .sort(([, left], [, right]) => right - left)
      .map(([name, results]) => ({ id: name, name: name === "true" ? "Sim" : name === "false" ? "Não" : name, results }));
    return mappedValues.length > 0
      ? [{ id, name: labels[id] ?? id, values: mappedValues }]
      : [];
  });
}

export async function searchOffers({ data: input }: { data: { query: string; limit?: number; offset?: number; sort?: OfferSort; filters?: Array<{ id: string; value: string }> } }): Promise<SearchOffersResult> {
    const data = z.object({ query: z.string().max(120), offset: z.number().int().min(0).max(10000).optional(), sort: z.enum(["relevance", "price_asc", "price_desc"]).optional(), filters: z.array(z.object({ id: z.enum(["store", "categoryName", "brand", "freeShipping"]), value: z.string().min(1).max(200) })).max(20).optional() }).parse(input);
    const byFacet = new Map<string, string[]>();
    for (const filter of data.filters ?? []) byFacet.set(filter.id, [...(byFacet.get(filter.id) ?? []), `${filter.id}:${filter.value}`]);
    const facetFilters = [...byFacet.values()];
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
          facets: ["store", "categoryName", "brand", "freeShipping"],
          maxValuesPerFacet: 1000,
          filters: 'price > 0 AND NOT status:"unavailable" AND NOT quality_status:"rejected"',
          ...(facetFilters.length > 0 ? { facetFilters } : {}),
          typoTolerance: true,
          attributesToRetrieve: [
            "objectID", "title", "imageUrl", "store", "price", "originalPrice",
            "discountPercent", "freeShipping", "affiliateUrl", "category", "sellerCount", "source", "status", "last_synced_at",
            "merchant_name", "loja", "storeLogoUrl", "merchant_logo", "store_logo", "aw_deep_link",
          ],
        }
      });
      const validOffers = response.hits.flatMap((hit) => {
        if (!Number.isFinite(hit.price) || hit.price <= 0) return [];
        return [{
          id: hit.objectID,
          title: hit.title,
          imageUrl: hit.imageUrl,
          ...storefrontIdentity(hit),
          price: hit.price,
          originalPrice: hit.originalPrice,
          discountPercent: hit.discountPercent,
          freeShipping: Boolean(hit.freeShipping),
          category: hit.category,
          sellerCount: hit.sellerCount,
          source: hit.source,
           status: hit.status,
           last_synced_at: hit.last_synced_at,
        }];
      });
      return {
        offers: selectVisibleOffers(validOffers),
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
    stores: Array<{ name: string; count: number; logoUrl?: string | null }>;
    debugError?: string;
  }> {
    try {
      const { client, indexName } = getAlgoliaConfig();
      const categoryCoversConfig = [
        { name: "Eletrônicos", query: "" },
        { name: "Moda", query: "camiseta" },
        { name: "Casa", query: "" },
        { name: "Celulares", query: "" },
        { name: "Games", query: "" },
        { name: "Beleza", query: "" },
        { name: "Esportes", query: "" },
      ];
      const ATTRS = ["objectID", "title", "imageUrl", "store", "price", "originalPrice", "discountPercent", "freeShipping", "affiliateUrl", "category", "sellerCount", "source", "status", "last_synced_at", "merchant_name", "loja", "storeLogoUrl", "merchant_logo", "store_logo", "aw_deep_link"];
      const activeFilter = 'price > 0 AND NOT status:"unavailable" AND NOT quality_status:"rejected"';
      const storesResponse = await client.searchSingleIndex<AlgoliaOffer>({
        indexName,
        searchParams: { query: "", hitsPerPage: 0, facets: ["store"], maxValuesPerFacet: 1000, filters: activeFilter },
      });
      const storeNames = Object.keys(storesResponse?.facets?.["store"] ?? {}).filter((name) => name && name !== "null");
      const storeGroups = storeNames.length > 0 ? storeNames.map((name) => [[`store:${name}`]]) : [[]];
      // Each rail asks every active store separately, then interleaves, so one big catalog never fills a rail alone.
      const perStore = (index: string, params: Record<string, unknown>) => Promise.all(storeGroups.map((facetFilters) =>
        client.searchSingleIndex<AlgoliaOffer>({
          indexName: index,
          searchParams: { query: "", hitsPerPage: 42, attributesToRetrieve: ATTRS, ...params, ...(facetFilters.length ? { facetFilters } : {}) },
        }).catch(() => ({ hits: [] as AlgoliaOffer[] })),
      ));
      const [urgentResponses, priceDropsResponses, popularResponses, categoryResponses] = await Promise.all([
        perStore(indexName, { filters: `${activeFilter} AND discountPercent >= 10` }),
        perStore(`${indexName}_price_asc`, { filters: activeFilter }),
        perStore(indexName, { filters: activeFilter }),
        Promise.all(categoryCoversConfig.map(({ name, query }) =>
          client.searchSingleIndex<AlgoliaOffer>({
            indexName,
            searchParams: {
              query,
              hitsPerPage: name === "Moda" ? 20 : 1,
              filters: `price > 0 AND categoryName:"${name}" AND NOT status:"unavailable" AND NOT quality_status:"rejected"`,
              attributesToRetrieve: ["title", "imageUrl"],
            }
          }),
        )),
      ]);
      const seed = Math.floor(Date.now() / 3600000);
      const mapHits = (hits: AlgoliaOffer[]) => hits.flatMap((hit) => {
        if (!Number.isFinite(hit.price) || hit.price <= 0) return [];
        return [{
          id: hit.objectID,
          title: hit.title,
          imageUrl: hit.imageUrl,
          ...storefrontIdentity(hit),
          price: hit.price,
          originalPrice: hit.originalPrice,
          discountPercent: hit.discountPercent,
          freeShipping: Boolean(hit.freeShipping),
          category: hit.category,
          sellerCount: hit.sellerCount,
          source: hit.source,
           status: hit.status,
           last_synced_at: hit.last_synced_at,
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

      // Same logo source the product cards use: the partner-provided logo on each store's own records.
      const storeLogos = new Map<string, string>();
      for (const response of [...popularResponses, ...priceDropsResponses, ...urgentResponses]) {
        for (const hit of response.hits) {
          const identity = storefrontIdentity(hit);
          if (identity.storeLogoUrl && !storeLogos.has(identity.store)) storeLogos.set(identity.store, identity.storeLogoUrl);
        }
      }

      return {
        urgent: interleaveByStore(urgentResponses.map((r) => selectVisibleOffers(mapHits(r.hits))), 14, seed),
        priceDrops: interleaveByStore(priceDropsResponses.map((r) => selectVisibleOffers(mapHits(r.hits))), 14, seed + 1),
        popular: interleaveByStore(popularResponses.map((r) => selectVisibleOffers(mapHits(r.hits))), 14, seed + 2),
        categoryCovers,
        stores: Object.entries(storesResponse?.facets?.["store"] ?? {})
          .filter(([name]) => name && name !== "null")
          .sort(([, a], [, b]) => b - a)
          .map(([name, count]) => ({ name, count, logoUrl: storeLogos.get(name) ?? null })),
      };
    } catch (error) {
      console.error("Homepage offers failed", error);
      const e = error as { status?: number; message?: string };
      const debugError = `Erro da Algolia${e.status ? ` (status ${e.status})` : ""}: ${e.message ?? String(error)}`;
      return { urgent: [], priceDrops: [], popular: [], categoryCovers: {}, stores: [], debugError };
    }
  }

export type ComparedOffer = { id: string; store: string; storeLogoUrl?: string | null; price: number; affiliateUrl: string; source?: string | undefined; last_synced_at?: string | undefined };

const STOP = new Set(["de", "da", "do", "com", "para", "e", "em", "a", "o", "the", "and", "with"]);
const tokens = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/).filter((t) => t.length > 1 && !STOP.has(t));

/** Same-product match: shared EAN/GTIN, or most of the distinctive title tokens (incl. any model numbers) shared. */
export function isSameProduct(base: { title: string; ean?: string | null }, other: { title: string; ean?: string | null }) {
  if (base.ean && other.ean) return base.ean === other.ean;
  const a = new Set(tokens(base.title).slice(0, 8));
  const b = new Set(tokens(other.title));
  if (a.size < 2) return false;
  const models = [...a].filter((t) => /\d/.test(t));
  if (models.some((m) => !b.has(m))) return false;
  const shared = [...a].filter((t) => b.has(t)).length;
  return shared / a.size >= 0.75;
}

export async function compareOffers(product: { id: string; title: string; ean?: string | null }): Promise<ComparedOffer[]> {
  try {
    const { client, indexName } = getAlgoliaConfig();
    const response = await client.searchSingleIndex<AlgoliaOffer & { ean?: string | null; gtin?: string | null }>({
      indexName,
      searchParams: {
        query: tokens(product.title).slice(0, 6).join(" "),
        hitsPerPage: 30,
        filters: 'price > 0 AND NOT status:"unavailable" AND NOT quality_status:"rejected"',
        removeWordsIfNoResults: "allOptional",
        attributesToRetrieve: ["objectID", "title", "store", "price", "affiliateUrl", "source", "status", "last_synced_at", "ean", "gtin", "merchant_name", "loja", "storeLogoUrl", "merchant_logo", "store_logo", "aw_deep_link"],
      },
    });
    return groupComparedOffers(product, response.hits);
  } catch (error) {
    console.error("Price comparison failed", error);
    return [];
  }
}

type CompareHit = AlgoliaOffer & { ean?: string | null; gtin?: string | null };
/** Keeps matching offers from each store and the cheapest per store, cheapest first. */
export function groupComparedOffers(product: { id: string; title: string; ean?: string | null }, hits: CompareHit[]): ComparedOffer[] {
  const best = new Map<string, ComparedOffer>();
  for (const hit of selectVisibleOffers(hits.map((h) => ({ ...h, id: h.objectID })))) {
    if (!Number.isFinite(hit.price) || hit.price <= 0) continue;
    if (hit.objectID !== product.id && !isSameProduct(product, { title: hit.title, ean: hit.ean ?? hit.gtin ?? null })) continue;
    const identity = storefrontIdentity(hit);
    if (!identity.affiliateUrl) continue;
    const offer: ComparedOffer = { id: hit.objectID, ...identity, price: hit.price, source: hit.source, last_synced_at: hit.last_synced_at };
    const current = best.get(identity.store);
    if (!current || offer.price < current.price) best.set(identity.store, offer);
  }
  return [...best.values()].sort((l, r) => l.price - r.price);
}
