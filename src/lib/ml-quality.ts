// Pure quality rules for Mercado Livre offers. No I/O — fully unit-testable.
// All thresholds live in ML_QUALITY_CONFIG so they are easy to tune.

export const ML_QUALITY_CONFIG = {
  // Price coherence vs. the group median
  maxPriceToMedian: 1.6,
  minPriceToMedian: 0.5,
  minGroupSize: 3,
  // Demand signal: sold_quantity is NOT present in any ML payload, and winning the
  // buy box alone does NOT count. Valid = category best-seller OR N+ sellers on the
  // same catalog product.
  minSellersForDemand: 3,
  buyBoxCountsAsDemand: false,
  // Seller reputation (sellers that are neither official store nor Mercado Líder)
  minSellerSales: 1000,
  minPositiveRatio: 0.95,
  requireRatingsForGreen: true,
  powerSellerStatuses: ["gold", "platinum"] as readonly string[],
  reputationLevelPrefixes: ["5"] as readonly string[], // "5_green" only
  // Sensitive categories: only official stores or Mercado Líder are accepted.
  // Matched as whole words (case/accent-insensitive) on site category, ML domain and title.
  sensitiveSiteCategories: ["beleza"] as readonly string[],
  sensitiveTerms: [
    "cosmetico", "cosmeticos", "maquiagem", "protetor solar", "filtro solar", "bloqueador solar",
    "sunscreen", "sunscreens", "skin care", "skincare", "serum", "hidratante", "creme", "cremes",
    "suplemento", "suplementos", "whey", "creatina", "vitamina", "vitaminas", "colageno", "termogenico",
    "supplements", "medicamento", "medicamentos", "remedio", "farmacia", "drugs", "medicines",
    "bebe", "bebes", "baby", "babies", "mamadeira", "fralda", "fraldas", "chupeta",
  ] as readonly string[],
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

export type SellerTrust = { tier: "official" | "leader" | "green" | null; label: string };

/** (b) Trust tier: official store, Mercado Líder (gold/platinum), or strict green reputation. */
export function sellerTrust(s: SellerInfo): SellerTrust {
  if (s.officialStoreId) return { tier: "official", label: `loja oficial (#${s.officialStoreId})` };
  if (s.powerSellerStatus && ML_QUALITY_CONFIG.powerSellerStatuses.includes(s.powerSellerStatus)) {
    return { tier: "leader", label: `Mercado Líder ${s.powerSellerStatus}` };
  }
  const levelOk = !!s.levelId && ML_QUALITY_CONFIG.reputationLevelPrefixes.some((p) => s.levelId!.startsWith(p));
  const sales = s.completedSales ?? 0;
  const ratioOk = s.positiveRatio == null ? !ML_QUALITY_CONFIG.requireRatingsForGreen : s.positiveRatio >= ML_QUALITY_CONFIG.minPositiveRatio;
  if (levelOk && sales >= ML_QUALITY_CONFIG.minSellerSales && ratioOk) {
    const pct = s.positiveRatio == null ? "?" : `${Math.round(s.positiveRatio * 1000) / 10}%`;
    return { tier: "green", label: `reputação verde, ${sales} vendas, ${pct} positivas` };
  }
  return { tier: null, label: "" };
}

export function isTrustedSeller(s: SellerInfo): boolean {
  return sellerTrust(s).tier !== null;
}

/** (a) Demand signal. Buy box alone never counts unless the config says so. */
export function demandSignal(input: { isBestSeller: boolean; sellerCount: number; isBuyBoxWinner: boolean }): string | null {
  if (input.isBestSeller) return "mais vendidos da categoria";
  if (input.sellerCount >= ML_QUALITY_CONFIG.minSellersForDemand) return `${input.sellerCount} vendedores no mesmo produto`;
  if (ML_QUALITY_CONFIG.buyBoxCountsAsDemand && input.isBuyBoxWinner) return "buy box";
  return null;
}

function normalizeText(v: string): string {
  return ` ${v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim()} `;
}

/** (c) Sensitive category check on site category, ML domain id and title (whole words). */
export function isSensitiveCategory(input: { siteCategory?: string | null; domainId?: string | null; title?: string | null }): boolean {
  const site = normalizeText(input.siteCategory ?? "").trim();
  if (site && ML_QUALITY_CONFIG.sensitiveSiteCategories.includes(site)) return true;
  const hay = normalizeText(`${(input.domainId ?? "").replace(/^MLB-/, "").replace(/_/g, " ")} ${input.title ?? ""}`);
  return ML_QUALITY_CONFIG.sensitiveTerms.some((t) => hay.includes(normalizeText(t)));
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
