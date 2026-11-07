import { toSiteCategory } from "./storefront-mix";
import { normalizeGtin } from "./product-identifiers";

// Pure normalization for Lomadee affiliate products (GET /affiliate/products).
// Missing data stays empty; nothing is invented to fill gaps.

export type LomadeeProduct = {
  id?: string;
  organizationId?: string;
  available?: boolean;
  name?: string;
  description?: string;
  url?: string;
  images?: Array<{ url?: string }>;
  categories?: Array<{ name?: string }>;
  metadata?: Array<{ key?: string; value?: string | number }>;
  options?: Array<{
    available?: boolean;
    seller?: string;
    brands?: Array<{ name?: string } | string>;
    pricing?: Array<{ listPrice?: number; price?: number }>;
  }>;
};

export type LomadeeBrand = { name: string; site?: string | undefined; logo?: string | undefined; channels?: Array<{ shortUrls?: string[] | null }>; network?: { active?: boolean } };

function httpsUrl(value: string | undefined): string | null {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch { return null; }
}

function text(value: string | undefined, max = 5000) {
  return (value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function lomadeeObjectId(product: LomadeeProduct): string | null {
  const id = (product.id ?? "").trim();
  const org = (product.organizationId ?? "").trim();
  if (!/^[\w-]{1,80}$/.test(id) || !/^[\w-]{1,60}$/.test(org)) return null;
  return `lomadee-${org}-${id}`;
}

/** Returns null when the product lacks a title, price, product URL or store. */
export function normalizeLomadeeProduct(
  product: LomadeeProduct,
  brand: LomadeeBrand | undefined,
  affiliateUrl: string | null,
  syncedAt: string,
) {
  const objectID = lomadeeObjectId(product);
  const title = text(product.name, 500);
  const productUrl = httpsUrl(product.url);
  const offers = (product.options ?? []).flatMap((option) => (option.pricing ?? []).map((p) => ({ option, price: Number(p.price), list: Number(p.listPrice) })))
    .filter((o) => Number.isFinite(o.price) && o.price > 0 && o.price < 1e7);
  const availableOffers = offers.filter((o) => o.option.available !== false);
  const pool = availableOffers.length ? availableOffers : offers;
  if (!objectID || !title || !productUrl || !pool.length) return null;
  const best = pool.reduce((a, b) => (b.price < a.price ? b : a));
  const store = text(brand?.name, 200) || text(best.option.seller, 200);
  const link = httpsUrl(affiliateUrl ?? undefined);
  if (!store || !link) return null;
  const originalPrice = Number.isFinite(best.list) && best.list > best.price ? best.list : null;
  const rawCategories = (product.categories ?? []).map((c) => text(c.name, 120).replace(/_/g, " ")).filter(Boolean);
  const categoryName = rawCategories.map((c) => toSiteCategory(c)).find(Boolean) ?? null;
  const brandName = (best.option.brands ?? []).map((b) => (typeof b === "string" ? b : b.name ?? "")).map((b) => text(b, 120)).find(Boolean) ?? null;
  const unavailable = product.available === false || !availableOffers.length;
  const images = (product.images ?? []).flatMap((i) => { const u = httpsUrl(i.url); return u ? [u] : []; }).slice(0, 8);
  return {
    objectID,
    externalId: String(product.id),
    merchantId: String(product.organizationId),
    source: "lomadee" as const,
    title, store, storeLogoUrl: httpsUrl(brand?.logo), merchant_name: store,
    price: best.price, affiliateUrl: link, productUrl,
    imageUrl: images[0] ?? null, images,
    originalPrice,
    discountPercent: originalPrice ? Math.round(((originalPrice - best.price) / originalPrice) * 100) : null,
    category: rawCategories[0] ?? null,
    categoryName,
    brand: brandName,
    gtin: (product.metadata ?? []).filter((entry) => entry.key?.toLowerCase() === "ean").map((entry) => normalizeGtin(entry.value)).find(Boolean) ?? null,
    model: null,
    description: text(product.description),
    attributes: brandName ? [{ name: "Marca", value: brandName, source: "lomadee" }] : [],
    freeShipping: false,
    inStock: !unavailable,
    status: unavailable ? ("unavailable" as const) : ("active" as const),
    sellerCount: 1, qa: [], last_synced_at: syncedAt,
  };
}

export type NormalizedLomadeeProduct = NonNullable<ReturnType<typeof normalizeLomadeeProduct>>;
