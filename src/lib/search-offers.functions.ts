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

function withAffiliate(url: string): string {
  const clean = url.split("#")[0] ?? url;
  const separator = clean.includes("?") ? "&" : "?";
  return `${clean}${separator}${AFFILIATE_PARAMS}`;
}

type CatalogProduct = {
  id: string;
  name: string;
  domain_id?: string;
  pictures?: { url?: string }[];
};

type CatalogItem = {
  item_id: string;
  price: number;
  original_price: number | null;
  shipping?: { free_shipping?: boolean };
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getMeliToken(): Promise<string | null> {
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

async function fetchCheapestItem(
  productId: string,
  token: string,
): Promise<{ item: CatalogItem; sellerCount: number } | null> {
  try {
    const res = await fetch(
      `https://api.mercadolibre.com/products/${productId}/items?limit=20`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { results?: CatalogItem[] };
    const items = (json.results ?? []).filter((item) => typeof item.price === "number");
    if (items.length === 0) return null;
    const cheapest = items.reduce((best, item) => (item.price < best.price ? item : best));
    return { item: cheapest, sellerCount: items.length };
  } catch {
    return null;
  }
}

export const searchOffers = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({ query: z.string().min(1).max(120), limit: z.number().min(1).max(30).optional() })
      .parse(data),
  )
  .handler(async ({ data }): Promise<Offer[]> => {
    const limit = data.limit ?? 12;
    const token = await getMeliToken();
    if (!token) return [];

    let products: CatalogProduct[] = [];
    try {
      const res = await fetch(
        `https://api.mercadolibre.com/products/search?status=active&site_id=MLB&q=${encodeURIComponent(
          data.query,
        )}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
      );
      if (res.ok) {
        const json = (await res.json()) as { results?: CatalogProduct[] };
        products = json.results ?? [];
      } else {
        console.error("Mercado Livre catalog search failed", res.status);
      }
    } catch (error) {
      console.error("Mercado Livre catalog search error", error);
    }

    const settled = await Promise.all(
      products.slice(0, limit).map(async (product) => {
        const cheapest = await fetchCheapestItem(product.id, token);
        if (!cheapest) return null;
        const { item, sellerCount } = cheapest;
        const original =
          item.original_price && item.original_price > item.price ? item.original_price : null;

        const offer: Offer = {
          id: product.id,
          title: product.name,
          imageUrl: product.pictures?.[0]?.url ?? null,
          store: "Mercado Livre",
          price: item.price,
          originalPrice: original,
          discountPercent: original
            ? Math.round(((original - item.price) / original) * 100)
            : null,
          freeShipping: Boolean(item.shipping?.free_shipping),
          affiliateUrl: withAffiliate(`https://www.mercadolivre.com.br/p/${product.id}`),
          category: product.domain_id ?? null,
          sellerCount,
        };
        return offer;
      }),
    );

    const offers = settled
      .filter((offer): offer is Offer => offer !== null)
      .sort((a, b) => a.price - b.price);

    if (offers.length > 0) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: saved, error: productError } = await supabaseAdmin
          .from("products")
          .upsert(
            offers.map((offer) => ({
              external_id: offer.id,
              title: offer.title,
              image_url: offer.imageUrl,
              category: offer.category,
              updated_at: new Date().toISOString(),
            })),
            { onConflict: "external_id" },
          )
          .select("id, external_id");

        if (productError) throw productError;

        const idByExternal = new Map((saved ?? []).map((p) => [p.external_id, p.id]));

        const { error: offerError } = await supabaseAdmin.from("offers").upsert(
          offers
            .filter((offer) => idByExternal.has(offer.id))
            .map((offer) => ({
              product_id: idByExternal.get(offer.id)!,
              store: offer.store,
              price: offer.price,
              original_price: offer.originalPrice,
              discount_percent: offer.discountPercent,
              affiliate_url: offer.affiliateUrl,
              free_shipping: offer.freeShipping,
              updated_at: new Date().toISOString(),
            })),
          { onConflict: "product_id,store" },
        );

        if (offerError) throw offerError;
      } catch (error) {
        console.error("Failed to persist offers", error);
      }
    }

    return offers;
  });
