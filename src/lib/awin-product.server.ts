import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { AwinProduct } from "./awin-catalog";
import type { ProductDetail } from "./product-detail.functions";
import { isOfferExpired } from "./offer-freshness";
import { productIndexability } from "./product-indexability";
import type { PartnerQA } from "./partner-qa.server";
import { readRealPriceHistory } from './price-history.server';
import { partnerDescription } from './product-content';

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
  const { data, error } = await db.from("partner_catalog").select("record,last_synced_at").eq("object_id", id).eq("source", id.startsWith("lomadee-") ? "lomadee" : "awin").maybeSingle();
  if (error || !data) return null;
  const p = data.record as unknown as AwinProduct & Record<string, unknown>;
  const history = await readRealPriceHistory(id);
  const policy = productIndexability({ ...p, price_history: history.get(id) ?? [], last_synced_at: p.last_synced_at ?? data.last_synced_at });
  if (p["price_review_status"] === "pending") return null;
  const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(",", ".")) : NaN);
  const ratingValue = num(p["rating"] ?? p["average_rating"] ?? p["reviews_rating"]);
  const ratingCount = num(p["review_count"] ?? p["reviews"] ?? p["number_of_reviews"]);
  const source = id.startsWith("lomadee-") ? "lomadee" : "awin";
  const rating = ratingValue > 0 && ratingValue <= 5 && ratingCount > 0 ? { value: ratingValue, count: Math.round(ratingCount), source } : null;
  const eanRaw = p["ean"] ?? p["gtin"] ?? p["product_GTIN"];
  const ean = typeof eanRaw === "string" && /^\d{8,14}$/.test(eanRaw) ? eanRaw : null;
  return {
    seoIndexable: policy.indexable, stale: policy.stale, priceHistory: policy.history,
    status: policy.unavailable ? "unavailable" : p.status,
    categoryName: p.categoryName,
    id: p.objectID, source: id.startsWith("lomadee-") ? "lomadee" : "awin", store: p.store, title: p.title,
    images: p.images.length ? p.images : p.imageUrl ? [p.imageUrl] : [],
    price: policy.unavailable || isOfferExpired(p) ? null : p.price,
    originalPrice: p.originalPrice, discountPercent: p.discountPercent,
    freeShipping: p.freeShipping, affiliateUrl: p.affiliateUrl,
    sellerCount: 1, category: p.category, description: partnerDescription(p.description),
    attributes: p.attributes, pros: [], cons: [], qa: Array.isArray(p["qa"]) ? p["qa"] as PartnerQA[] : [], last_synced_at: p.last_synced_at ?? data.last_synced_at, rating, ean, storeLogoUrl: [p["storeLogoUrl"], p["merchant_logo"], p["store_logo"]].find((v): v is string => typeof v === "string" && v.startsWith("https://")) ?? null,
  };
}