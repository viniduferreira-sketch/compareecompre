import { normalizeGtin } from "./product-identifiers";
import { normalizePolicyText } from "./content-policy";

// All ranking weights, thresholds and high-demand categories live here.
export const POPULARITY_CONFIG = {
  weights: { gtin: 15, stock: 20, image: 15, discount: 20, category: 30 },
  highDemandCategories: ["celular", "smartphone", "notebook", "tv", "televisor", "tênis", "placa de vídeo", "ssd", "monitor", "console"],
  fullDiscountPercent: 30,
  maxClickWeight: 0.6,
  clicksForHalfWeight: 100,
  productClicksForHalfScore: 10,
  windowDays: 30,
} as const;

export type PopularityRecord = {
  objectID: string; title?: string; store?: string; merchantId?: string;
  source?: string; gtin?: string | null; imageUrl?: string | null;
  status?: string; inStock?: boolean; price?: number; originalPrice?: number | null;
  category?: string | null; categoryName?: string | null;
  parent_product_id?: string | null; colour?: string | null; size?: string | null;
  attributes?: Array<{ name?: string; value?: string }>;
};

export function calculatePopularity(record: PopularityRecord, clicks = 0, totalClicks = 0): number {
  const c = POPULARITY_CONFIG;
  const words = ` ${normalizePolicyText([record.category, record.categoryName, record.title].filter(Boolean).join(" "))} `;
  const demand = c.highDemandCategories.some((term) => words.includes(` ${normalizePolicyText(term)} `));
  const realDiscount = record.price && record.originalPrice && record.originalPrice > record.price
    ? Math.min(1, ((record.originalPrice - record.price) / record.originalPrice * 100) / c.fullDiscountPercent) : 0;
  const base = (normalizeGtin(record.gtin) ? c.weights.gtin : 0)
    + (record.status === "active" && record.inStock !== false ? c.weights.stock : 0)
    + (/^https?:\/\//i.test(record.imageUrl ?? "") ? c.weights.image : 0)
    + realDiscount * c.weights.discount + (demand ? c.weights.category : 0);
  const total = Math.max(0, totalClicks);
  const weight = c.maxClickWeight * total / (total + c.clicksForHalfWeight);
  const count = Math.max(0, clicks);
  const behavioral = 100 * count / (count + c.productClicksForHalfScore);
  return Math.max(0, Math.min(100, Math.round(base * (1 - weight) + behavioral * weight)));
}

/** Same-store variants only. ML offers are already catalog products; never infer their variants. */
export function productGroupId(record: PopularityRecord): string {
  const store = normalizePolicyText(record.store ?? record.merchantId ?? record.objectID);
  if (record.source === "mercadolivre" || !record.source) return `${store}|id:${record.objectID}`;
  const parent = record.parent_product_id?.trim();
  if (parent) return `${store}|parent:${parent}`;
  // Only Nike's feed has demonstrated meaningful size/color variants. Other stores
  // stay singleton unless they provide an explicit parent; equal titles are not proof.
  if (store !== "nike" && store !== "nike br") return `${store}|id:${record.objectID}`;
  let title = normalizePolicyText(record.title ?? "");
  const attributes = record.attributes ?? [];
  const variants = [record.colour, record.size, ...attributes.filter((a) => /^(cor|tamanho)$/i.test(a.name ?? "")).map((a) => a.value)];
  for (const value of variants) {
    const term = normalizePolicyText(value ?? "");
    if (!term) continue;
    // Never strip arbitrary numbers such as SSD capacity; only explicit variant values.
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    title = title.replace(new RegExp(`(?:^| )${escaped}(?= |$)`, "g"), " ");
  }
  title = title.replace(/\b(?:tamanho|tam|cor)\s+[a-z0-9]+\b/g, " ").replace(/\s+/g, " ").trim();
  return `${store}|title:${title || record.objectID}`;
}

export const POPULARITY_INDEX_SETTINGS = {
  customRanking: ["desc(popularity_score)"],
  attributeForDistinct: "group_key",
  distinct: 1,
};