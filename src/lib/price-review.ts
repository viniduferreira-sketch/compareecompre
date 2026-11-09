import { normalizePolicyText } from "./content-policy";

export const PRICE_REVIEW_CONFIG = {
  absoluteMinimum: 5,
  medianRatio: 0.2,
} as const;

export type PriceReviewRecord = {
  objectID: string;
  title?: string;
  price?: number;
  category?: string | null;
  categoryName?: string | null;
  source?: string;
  store?: string;
  price_review_status?: "pending" | "approved" | undefined;
};

export type PriceDetection = {
  reason: "below_minimum" | "below_median";
  median: number | null;
  peerCount: number;
};

export function pricePeerKey(record: Pick<PriceReviewRecord, "title" | "category" | "categoryName">): string | null {
  const family = normalizePolicyText(record.title ?? "").split(" ")[0] ?? "";
  if (!family) return null;
  const category = normalizePolicyText(record.categoryName ?? record.category ?? "") || "sem categoria";
  return `${category}|${family}`;
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

/** Peers share the site/partner category and the first normalized title word (SSD, tênis, iPhone etc.). */
export function detectSuspiciousPrices(records: PriceReviewRecord[]): Map<string, PriceDetection> {
  const peers = new Map<string, number[]>();
  for (const record of records) {
    const key = pricePeerKey(record);
    if (key && typeof record.price === "number" && Number.isFinite(record.price) && record.price > 0) {
      peers.set(key, [...(peers.get(key) ?? []), record.price]);
    }
  }
  const medians = new Map([...peers].map(([key, prices]) => [key, median(prices)]));
  const result = new Map<string, PriceDetection>();
  for (const record of records) {
    if (typeof record.price !== "number" || !Number.isFinite(record.price) || record.price <= 0) continue;
    const key = pricePeerKey(record);
    const peerPrices = key ? peers.get(key) ?? [] : [];
    const reference = key ? medians.get(key) ?? null : null;
    if (record.price < PRICE_REVIEW_CONFIG.absoluteMinimum) {
      result.set(record.objectID, { reason: "below_minimum", median: reference, peerCount: peerPrices.length });
    } else if (reference !== null && peerPrices.length > 1 && record.price < reference * PRICE_REVIEW_CONFIG.medianRatio) {
      result.set(record.objectID, { reason: "below_median", median: reference, peerCount: peerPrices.length });
    }
  }
  return result;
}
