// Pure quality rules for Mercado Livre offers. No I/O — fully unit-testable.
// All thresholds live in ML_QUALITY_CONFIG so they are easy to tune.

export const ML_QUALITY_CONFIG = {
  // Price coherence vs. the group median
  maxPriceToMedian: 1.6,
  minPriceToMedian: 0.5,
  minGroupSize: 3,
  // Demand signal (sold_quantity is NOT present in any ML payload, so demand
  // = category best-seller OR buy box winner OR several sellers competing)
  minSoldQuantity: 10, // kept for reference only
  minSellersForDemand: 3,
  // Seller reputation
  minSellerSales: 200,
  minPositiveRatio: 0.9,
  powerSellerStatuses: ["gold", "platinum"] as readonly string[],
  reputationLevelPrefixes: ["4", "5"] as readonly string[],
  sellerCacheHours: 24,
  // Execution
  sampleLimit: 400,
  concurrency: 4,
} as const;

export type SellerInfo = {
  officialStoreId?: number | null;
  powerSellerStatus?: string | null;
  levelId?: string | null;
  completedSales?: number | null;
  positiveRatio?: number | null; // null when the API does not return ratings
};

/** (a) Trusted seller: official store, Mercado Líder (gold/platinum), or green reputation with sales history. */
export function isTrustedSeller(s: SellerInfo): boolean {
  if (s.officialStoreId) return true;
  if (s.powerSellerStatus && ML_QUALITY_CONFIG.powerSellerStatuses.includes(s.powerSellerStatus)) return true;
  const levelOk = !!s.levelId && ML_QUALITY_CONFIG.reputationLevelPrefixes.some((p) => s.levelId!.startsWith(p));
  const salesOk = (s.completedSales ?? 0) >= ML_QUALITY_CONFIG.minSellerSales;
  // When the API omits ratings, the green level_id already encodes reputation.
  const ratioOk = s.positiveRatio == null || s.positiveRatio >= ML_QUALITY_CONFIG.minPositiveRatio;
  return levelOk && salesOk && ratioOk;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Model tokens: title words containing a digit ("a23", "55", "256gb"), normalized. */
export function normalizeModelTokens(title: string): string[] {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2 && /\d/.test(token))
    .sort();
}

/**
 * Group key for price coherence and duplicity: same category + brand + model.
 * Returns "" when there is not enough signal (falls back to singleton groups).
 */
export function groupKeyOf(r: { categoryName?: string | null | undefined; brand?: string | null | undefined; title: string }): string {
  const category = (r.categoryName ?? "").trim().toLowerCase();
  const brand = (r.brand ?? "").trim().toLowerCase();
  const model = normalizeModelTokens(r.title).join("-");
  if (!category || !brand || !model) return "";
  return `${category}|${brand}|${model}`;
}

export type PriceVerdict = "ok" | "preço fora da faixa" | "grupo pequeno exige vendedor confiável";

/** (c) Price coherence against the group median. */
export function priceVerdict(price: number, groupPrices: number[], trusted: boolean): PriceVerdict {
  if (groupPrices.length >= ML_QUALITY_CONFIG.minGroupSize) {
    const med = median(groupPrices);
    if (med > 0 && (price > med * ML_QUALITY_CONFIG.maxPriceToMedian || price < med * ML_QUALITY_CONFIG.minPriceToMedian)) {
      return "preço fora da faixa";
    }
    return "ok";
  }
  return trusted ? "ok" : "grupo pequeno exige vendedor confiável";
}

export type GroupCandidate = { id: string; price: number; isBuyBoxWinner: boolean };

/** (e) Within a group, keep the buy box winner when approved, otherwise the cheapest approved. */
export function pickGroupWinner(candidates: GroupCandidate[]): string | null {
  if (candidates.length === 0) return null;
  const winner = candidates.find((c) => c.isBuyBoxWinner);
  if (winner) return winner.id;
  return [...candidates].sort((a, b) => a.price - b.price)[0]!.id;
}

export type QualityStatus = "approved" | "rejected" | "unknown";

export type QualityVerdict = { status: QualityStatus; reason: string };
