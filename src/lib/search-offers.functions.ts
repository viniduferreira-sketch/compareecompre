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
const offerCache = new Map<string, { offers: Offer[]; expiresAt: number }>();

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
    const cacheKey = `${data.query.toLowerCase()}|${limit}`;
    const cached = offerCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.offers;

    const token = await getMeliToken();
    if (!token) return [];

    let products: CatalogProduct[] = [];
    try {
      const res = await fetch(
        `https://api.mercadolibre.com/products/search?status=active&site_id=MLB&q=${encodeURIComponent(
          data.query,
        )}&limit=50`,
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

    // Many catalog products have no active listing, so walk them in batches
    // until we collect enough priced offers.
    const collected: Offer[] = [];
    const batchSize = 10;
    for (let index = 0; index < products.length && collected.length < limit; index += batchSize) {
      const batch = products.slice(index, index + batchSize);
      const results = await Promise.all(
        batch.map(async (product) => {
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
      for (const offer of results) if (offer) collected.push(offer);
    }

    const offers = collected.slice(0, limit).sort((a, b) => a.price - b.price);
    offerCache.set(cacheKey, { offers, expiresAt: Date.now() + 10 * 60 * 1000 });

    if (offers.length === 0) return [];

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

      if (productError) {
        console.error("[supabase] products upsert error", productError);
        throw productError;
      }
      console.log(`[supabase] products upsert ok: ${saved?.length ?? 0} rows`);

      const idByExternal = new Map((saved ?? []).map((p) => [p.external_id, p.id]));

      const { data: savedOffers, error: offerError } = await supabaseAdmin
        .from("offers")
        .upsert(
          offers
            .filter((offer) => idByExternal.has(offer.id))
            .map((offer) => ({
              product_id: idByExternal.get(offer.id)!,
              store_name: offer.store,
              external_id: offer.id,
              price: offer.price,
              original_price: offer.originalPrice,
              discount_percent: offer.discountPercent,
              affiliate_url: offer.affiliateUrl,
              free_shipping: offer.freeShipping,
              updated_at: new Date().toISOString(),
            })),
          { onConflict: "product_id,store_name" },
        )
        .select("id");

      if (offerError) {
        console.error("[supabase] offers upsert error", offerError);
        throw offerError;
      }
      console.log(`[supabase] offers upsert ok: ${savedOffers?.length ?? 0} rows`);

      // Read back from the database so the UI always renders stored data.
      const { data: stored, error: readError } = await supabaseAdmin
        .from("offers")
        .select(
          "price, original_price, discount_percent, affiliate_url, free_shipping, store_name, products!inner(id, external_id, title, image_url, category)",
        )
        .in("product_id", [...idByExternal.values()])
        .order("price", { ascending: true });

      if (readError) throw readError;

      const sellerCountByExternal = new Map(offers.map((offer) => [offer.id, offer.sellerCount]));

      const fromDb: Offer[] = (stored ?? []).map((row) => {
        const product = row.products as unknown as {
          external_id: string;
          title: string;
          image_url: string | null;
          category: string | null;
        };
        return {
          id: product.external_id,
          title: product.title,
          imageUrl: product.image_url,
          store: row.store,
          price: Number(row.price),
          originalPrice: row.original_price === null ? null : Number(row.original_price),
          discountPercent: row.discount_percent,
          freeShipping: row.free_shipping,
          affiliateUrl: row.affiliate_url,
          category: product.category,
          sellerCount: sellerCountByExternal.get(product.external_id) ?? 1,
        };
      });

      if (fromDb.length > 0) {
        offerCache.set(cacheKey, { offers: fromDb, expiresAt: Date.now() + 10 * 60 * 1000 });
        return fromDb;
      }
    } catch (error) {
      console.error("Failed to persist offers", error);
    }

    return offers;
  });
