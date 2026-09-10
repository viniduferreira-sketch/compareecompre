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
};

function withAffiliate(url: string): string {
  const clean = url.split("#")[0] ?? url;
  const separator = clean.includes("?") ? "&" : "?";
  return `${clean}${separator}${AFFILIATE_PARAMS}`;
}

type MeliItem = {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  permalink: string;
  thumbnail: string;
  category_id?: string;
  shipping?: { free_shipping?: boolean };
};

export const searchOffers = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({ query: z.string().min(1).max(120), limit: z.number().min(1).max(30).optional() })
      .parse(data),
  )
  .handler(async ({ data }): Promise<Offer[]> => {
    const limit = data.limit ?? 12;
    const endpoint = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(
      data.query,
    )}&limit=${limit}`;

    let items: MeliItem[] = [];
    try {
      const res = await fetch(endpoint, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const json = (await res.json()) as { results?: MeliItem[] };
        items = json.results ?? [];
      } else {
        console.error("Mercado Livre search failed", res.status);
      }
    } catch (error) {
      console.error("Mercado Livre search error", error);
    }

    const offers: Offer[] = items
      .filter((item) => item && typeof item.price === "number")
      .map((item) => {
        const original =
          item.original_price && item.original_price > item.price ? item.original_price : null;
        return {
          id: item.id,
          title: item.title,
          imageUrl: item.thumbnail ? item.thumbnail.replace(/^http:/, "https:").replace("-I.jpg", "-O.jpg") : null,
          store: "Mercado Livre",
          price: item.price,
          originalPrice: original,
          discountPercent: original ? Math.round(((original - item.price) / original) * 100) : null,
          freeShipping: Boolean(item.shipping?.free_shipping),
          affiliateUrl: withAffiliate(item.permalink),
          category: item.category_id ?? null,
        };
      })
      .sort((a, b) => a.price - b.price);

    if (offers.length > 0) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: products, error: productError } = await supabaseAdmin
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

        const idByExternal = new Map((products ?? []).map((p) => [p.external_id, p.id]));

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
