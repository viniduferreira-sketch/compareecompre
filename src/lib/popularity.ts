import { normalizeGtin } from "./product-identifiers";
import { normalizePolicyText } from "./content-policy";

// All ranking weights, thresholds and high-demand categories live here.
export const POPULARITY_CONFIG = {
  weights: { gtin: 15, stock: 20, image: 15, discount: 20, category: 30 },
  highDemandCategories: ["celular", "smartphone", "notebook", "tv", "televisor", "tênis", "placa de vídeo", "ssd", "monitor", "console"],
  fullDiscountPercent: 30,
  maxDiscountBonusPercent: 70,
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
  const discountPercent = record.price && record.originalPrice && record.originalPrice > record.price
    ? (record.originalPrice - record.price) / record.originalPrice * 100 : 0;
  const realDiscount = discountPercent > 0 && discountPercent <= c.maxDiscountBonusPercent
    ? Math.min(1, discountPercent / c.fullDiscountPercent) : 0;
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

/** Only Awin Nike sizes of the same product and colour share a card. Every other record stays singleton. */
export function productGroupId(record: PopularityRecord): string {
  const store = normalizePolicyText(record.store ?? record.merchantId ?? record.objectID);
  if (record.source !== "awin" || (store !== "nike" && store !== "nike br")) return `single:${record.objectID}`;
  const attributes = record.attributes ?? [];
  const attributeValue = (name: RegExp) => attributes.find((a) => name.test(a.name ?? ""))?.value;
  const colour = normalizePolicyText(record.colour ?? attributeValue(/^cor$/i) ?? "");
  if (!colour) return `single:${record.objectID}`;
  let title = normalizePolicyText(record.title ?? "");
  // Remove only explicit size values. Colour remains a separate key component and
  // arbitrary numbers (capacity, model etc.) are never stripped from the product name.
  const sizes = [record.size, ...attributes.filter((a) => /^tamanho$/i.test(a.name ?? "")).map((a) => a.value)];
  for (const value of sizes) {
    const term = normalizePolicyText(value ?? "");
    if (!term) continue;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    title = title.replace(new RegExp(`(?:^| )${escaped}(?= |$)`, "g"), " ");
  }
  title = title.replace(/\b(?:tamanho|tam)\s+[a-z0-9]+\b/g, " ").replace(/\s+/g, " ").trim();
  const parent = normalizePolicyText(record.parent_product_id ?? "");
  const product = parent ? `parent:${parent}` : `title:${title}`;
  if (!parent && !title) return `single:${record.objectID}`;
  return `${store}|${product}|colour:${colour}`;
}

export const POPULARITY_INDEX_SETTINGS = {
  customRanking: ["desc(popularity_score)"],
  attributeForDistinct: "group_key",
  distinct: 1,
};