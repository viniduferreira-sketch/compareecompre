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

export function withAffiliate(url: string): string {
  const clean = url.split("#")[0] ?? url;
  const separator = clean.includes("?") ? "&" : "?";
  return `${clean}${separator}${AFFILIATE_PARAMS}`;
}

type SearchItem = {
  id: string;
  title?: string;
  thumbnail?: string;
  price?: number;
  original_price?: number | null;
  permalink?: string;
  category_id?: string;
  shipping?: { free_shipping?: boolean };
};

type CatalogProduct = {
  id: string;
  name: string;
  domain_id?: string;
  pictures?: Array<{ url?: string }>;
  attributes?: Array<{
    id?: string;
    name?: string;
    value_id?: string;
    value_name?: string;
  }>;
};

type CatalogItem = {
  price: number;
  original_price?: number | null;
  shipping?: { free_shipping?: boolean };
};

type MercadoLivreSearchResponse = {
  results?: SearchItem[];
  paging?: { total?: number; offset?: number; limit?: number };
  available_filters?: Array<{
    id?: string;
    name?: string;
    values?: Array<{ id?: string; name?: string; results?: number }>;
  }>;
};

function improveThumbnail(url?: string): string | null {
  if (!url) return null;
  return url.replace(/-I\.jpg(?=\?|$)/i, "-O.jpg");
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
    const res = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    if (!res.ok) {
      console.error("Mercado Livre token failed", res.status);
      return null;
    }
    const json = (await res.json()) as { access_token: string; expires_in: number };
    cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
    return cachedToken.value;
  } catch (error) {
    console.error("Mercado Livre token error", error);
    return null;
  }
}

async function searchCatalog(
  query: string,
  limit: number,
  offset: number,
  sort: OfferSort,
): Promise<SearchOffersResult> {
  const token = await getMeliToken();
  if (!token) {
    return { offers: [], availableFilters: [], paging: { total: 0, offset, limit } };
  }

  const params = new URLSearchParams({
    status: "active",
    site_id: "MLB",
    q: query,
    limit: String(limit),
    offset: String(offset),
  });
  const response = await fetch(`https://api.mercadolibre.com/products/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!response.ok) {
    console.error("Mercado Livre catalog search failed", response.status);
    return { offers: [], availableFilters: [], paging: { total: 0, offset, limit } };
  }

  const json = (await response.json()) as {
    results?: CatalogProduct[];
    paging?: { total?: number; offset?: number; limit?: number };
  };
  const products = json.results ?? [];
  const offers = await Promise.all(
      products.map(async (product): Promise<Offer> => {
        try {
          const itemsResponse = await fetch(
            `https://api.mercadolibre.com/products/${encodeURIComponent(product.id)}/items?limit=20`,
            { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
          );
          if (!itemsResponse.ok) {
            return {
              id: product.id,
              title: product.name,
              imageUrl: product.pictures?.[0]?.url ?? null,
              store: "Mercado Livre",
              price: 0,
              originalPrice: null,
              discountPercent: null,
              freeShipping: false,
              affiliateUrl: withAffiliate(`https://www.mercadolivre.com.br/p/${product.id}`),
              category: product.domain_id ?? null,
              sellerCount: 0,
            };
          }
          const itemsJson = (await itemsResponse.json()) as { results?: CatalogItem[] };
          const items = (itemsJson.results ?? []).filter((item) => typeof item.price === "number");
          if (items.length === 0) {
            return {
              id: product.id,
              title: product.name,
              imageUrl: product.pictures?.[0]?.url ?? null,
              store: "Mercado Livre",
              price: 0,
              originalPrice: null,
              discountPercent: null,
              freeShipping: false,
              affiliateUrl: withAffiliate(`https://www.mercadolivre.com.br/p/${product.id}`),
              category: product.domain_id ?? null,
              sellerCount: 0,
            };
          }
          const cheapest = items.reduce((best, item) => (item.price < best.price ? item : best));
          const original = cheapest.original_price && cheapest.original_price > cheapest.price
            ? cheapest.original_price
            : null;
          return {
            id: product.id,
            title: product.name,
            imageUrl: product.pictures?.[0]?.url ?? null,
            store: "Mercado Livre",
            price: cheapest.price,
            originalPrice: original,
            discountPercent: original
              ? Math.round(((original - cheapest.price) / original) * 100)
              : null,
            freeShipping: Boolean(cheapest.shipping?.free_shipping),
            affiliateUrl: withAffiliate(`https://www.mercadolivre.com.br/p/${product.id}`),
            category: product.domain_id ?? null,
            sellerCount: items.length,
          };
        } catch (error) {
          console.error("Mercado Livre catalog item failed", product.id, error);
          return {
            id: product.id,
            title: product.name,
            imageUrl: product.pictures?.[0]?.url ?? null,
            store: "Mercado Livre",
            price: 0,
            originalPrice: null,
            discountPercent: null,
            freeShipping: false,
            affiliateUrl: withAffiliate(`https://www.mercadolivre.com.br/p/${product.id}`),
            category: product.domain_id ?? null,
            sellerCount: 0,
          };
        }
      }),
    );

  const filterGroups = new Map<string, OfferFilter>();
  for (const product of products) {
    for (const attribute of product.attributes ?? []) {
      if (!attribute.id || !attribute.name || !attribute.value_name) continue;
      const valueId = attribute.value_id ?? attribute.value_name;
      const group = filterGroups.get(attribute.id) ?? {
        id: attribute.id,
        name: attribute.name,
        values: [],
      };
      const existing = group.values.find((value) => value.id === valueId);
      if (existing) existing.results += 1;
      else group.values.push({ id: valueId, name: attribute.value_name, results: 1 });
      filterGroups.set(attribute.id, group);
    }
  }

  if (sort === "price_asc") offers.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") offers.sort((a, b) => b.price - a.price);

  return {
    offers,
    availableFilters: [...filterGroups.values()],
    paging: {
      total: json.paging?.total ?? offers.length,
      offset: json.paging?.offset ?? offset,
      limit: json.paging?.limit ?? limit,
    },
  };
}

export const searchOffers = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        query: z.string().min(1).max(120),
        limit: z.number().int().min(1).max(50).optional(),
        offset: z.number().int().min(0).max(10_000).optional(),
        sort: z.enum(["relevance", "price_asc", "price_desc"]).optional(),
        filters: z.array(z.object({ id: z.string().min(1).max(80), value: z.string().min(1).max(160) })).max(12).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<SearchOffersResult> => {
    const limit = data.limit ?? 40;
    const offset = data.offset ?? 0;
    const sort = data.sort ?? "relevance";
    const selectedFilters = data.filters ?? [];
    const params = new URLSearchParams({
      q: data.query,
      limit: String(limit),
      offset: String(offset),
    });
    if (sort !== "relevance") params.set("sort", sort);
    for (const filter of selectedFilters) params.append(filter.id, filter.value);

    let response: Response;
    try {
      response = await fetch(
        `https://api.mercadolibre.com/sites/MLB/search?${params.toString()}`,
        { headers: { Accept: "application/json" } },
      );
    } catch (error) {
      console.error("Mercado Livre public search request failed", error);
      return searchCatalog(data.query, limit, offset, sort);
    }

    if (!response.ok) {
      console.error("Mercado Livre public search failed", response.status);
      if (response.status === 401 || response.status === 403) {
        return searchCatalog(data.query, limit, offset, sort);
      }
      return { offers: [], availableFilters: [], paging: { total: 0, offset, limit } };
    }

    const json = (await response.json()) as MercadoLivreSearchResponse;
    const offers = (json.results ?? []).map((item) => {
        const price = typeof item.price === "number" ? item.price : 0;
        const original = item.original_price && item.original_price > price
          ? item.original_price
          : null;
        return {
          id: item.id,
          title: item.title ?? "Produto Mercado Livre",
          imageUrl: improveThumbnail(item.thumbnail),
          store: "Mercado Livre",
          price,
          originalPrice: original,
          discountPercent: original
            ? Math.round(((original - price) / original) * 100)
            : null,
          freeShipping: Boolean(item.shipping?.free_shipping),
          affiliateUrl: withAffiliate(
            item.permalink ?? `https://produto.mercadolivre.com.br/${encodeURIComponent(item.id)}`,
          ),
          category: item.category_id ?? null,
          sellerCount: 1,
        } satisfies Offer;
      });

    const availableFilters = (json.available_filters ?? []).flatMap((filter) => {
      if (!filter.id || !filter.name) return [];
      const values = (filter.values ?? []).flatMap((value) =>
        value.id && value.name
          ? [{ id: value.id, name: value.name, results: value.results ?? 0 }]
          : [],
      );
      return values.length > 0 ? [{ id: filter.id, name: filter.name, values }] : [];
    });

    return {
      offers,
      availableFilters,
      paging: {
        total: json.paging?.total ?? 0,
        offset: json.paging?.offset ?? offset,
        limit: json.paging?.limit ?? limit,
      },
    };
  });
