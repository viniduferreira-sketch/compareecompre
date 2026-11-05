import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { AwinProduct } from "./awin-catalog";
import type { ProductDetail } from "./product-detail.functions";
import { isOfferExpired } from "./offer-freshness";

export async function getAwinProductDetail(id: string): Promise<ProductDetail | null> {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const url = process.env["SUPABASE_URL"];
  if (!key || !url) return null;
  const db = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const { data, error } = await db.from("partner_catalog").select("record").eq("object_id", id).eq("source", "awin").maybeSingle();
  if (error || !data) return null;
  const p = data.record as unknown as AwinProduct;
  return {
    id: p.objectID, source: "awin", store: p.store, title: p.title,
    images: p.images.length ? p.images : p.imageUrl ? [p.imageUrl] : [],
    price: isOfferExpired(p) ? null : p.price,
    originalPrice: p.originalPrice, discountPercent: p.discountPercent,
    freeShipping: p.freeShipping, affiliateUrl: p.affiliateUrl,
    sellerCount: 1, category: p.category, description: p.description,
    attributes: p.attributes, pros: [], cons: [], qa: [], last_synced_at: p.last_synced_at,
  };
}