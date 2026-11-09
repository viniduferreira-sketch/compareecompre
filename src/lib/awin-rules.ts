// Per-merchant Awin import rules: partner-category terms and a per-import product limit.
// Pure functions; the importer, the simulation and the tests share them.
import { normalizePolicyText } from "./content-policy";
import { normalizeAwinMerchantName } from "./awin-allowlist";
import { normalizeGtin } from "./product-identifiers";

export const CATEGORY_NOT_ALLOWED_REASON = "categoria não permitida";
export const NO_MERCHANT_RULE_REASON = "loja sem regra de categoria";
export const MERCHANT_LIMIT_REASON = "limite da loja atingido";
export const AWIN_ALL_CATEGORIES = "*";
export const AWIN_GIFT_CARD_EXCLUDED_TERMS: readonly string[] = ["gift card", "cartão presente"];
const EMPTY_CATEGORIES_OPEN_MERCHANTS = new Set(["kabum", "nike"]);

function isOpenMerchant(rule: AwinMerchantRule): boolean {
  return EMPTY_CATEGORIES_OPEN_MERCHANTS.has(normalizeAwinMerchantName(rule.merchant));
}

export function allowsAllAwinCategories(rule: AwinMerchantRule): boolean {
  return rule.category_terms.includes(AWIN_ALL_CATEGORIES)
    || (rule.category_terms.length === 0 && isOpenMerchant(rule));
}

/** Partner-category terms that always exclude a row, even when an allowed term matches
 * (e.g. "Hardware > Placa de vídeo > Acessórios"). Edit here; matched like category terms. */
export const AWIN_CATEGORY_EXCLUDED_TERMS: readonly string[] = ["acessório", "peça de reposição", "peças de reposição", "refil"];

export type AwinMerchantRule = { merchant: string; category_terms: string[]; excluded_category_terms?: string[]; max_products: number };
type RowLike = Record<string, string | undefined>;

/** Rule for a feed row: matches merchant_id exactly or the normalized merchant name (KaBuM = Kabum BR). */
export function findAwinRule(row: RowLike, rules: readonly AwinMerchantRule[]): AwinMerchantRule | null {
  const id = (row["merchant_id"] ?? "").trim();
  const name = normalizeAwinMerchantName(row["merchant_name"] ?? "");
  return rules.find((r) => r.merchant.trim() === id || (name && normalizeAwinMerchantName(r.merchant) === name)) ?? null;
}

function termPattern(term: string): RegExp | null {
  const words = normalizePolicyText(term).split(" ").filter(Boolean);
  if (!words.length) return null;
  // Whole words; a plain plural ("placas de vídeo", "tvs") still counts as the same word.
  return new RegExp(`(?:^| )${words.map((w) => `${w}(?:e?s)?`).join(" ")}(?: |$)`);
}

/** Whole-word, case- and accent-insensitive match against merchant_category ONLY (never the title). */
export function matchCategoryTerm(merchantCategory: string, terms: readonly string[]): string | null {
  const hay = normalizePolicyText(merchantCategory);
  if (!hay) return null;
  for (const term of terms) {
    if (termPattern(term)?.test(hay)) return term;
  }
  return null;
}

/** Category step of the pipeline (runs after allowlist, adult content and currency). */
export function awinRuleDiscard(row: RowLike, rules: readonly AwinMerchantRule[]): string | null {
  const rule = findAwinRule(row, rules);
  if (!rule) return NO_MERCHANT_RULE_REASON;
  const category = row["merchant_category"] ?? "";
  const allCategories = allowsAllAwinCategories(rule);
  const exclusions = allCategories && isOpenMerchant(rule)
    ? [...new Set([...AWIN_GIFT_CARD_EXCLUDED_TERMS, ...(rule.excluded_category_terms ?? [])])]
    : (rule.excluded_category_terms ?? []);
  if (matchCategoryTerm(category, exclusions)) return CATEGORY_NOT_ALLOWED_REASON;
  // KaBuM/Nike may use either an explicit wildcard or an empty inclusion list.
  // Other merchants fail closed, and positive lists retain the shared exclusions.
  if (allCategories) return null;
  if (matchCategoryTerm(category, AWIN_CATEGORY_EXCLUDED_TERMS)) return CATEGORY_NOT_ALLOWED_REASON;
  return matchCategoryTerm(category, rule.category_terms) ? null : CATEGORY_NOT_ALLOWED_REASON;
}

/** Priority inside the limit: GTIN, then in stock, then image. Higher is better (0–7). */
export function awinRowPriority(row: RowLike): number {
  const gtin = normalizeGtin(row["ean"]) ?? normalizeGtin(row["product_GTIN"]);
  const stock = (row["in_stock"] ?? "").trim().toLowerCase();
  const status = (row["stock_status"] ?? "").trim().toLowerCase();
  const inStock = !["0", "false", "no", "n", "out of stock", "out_of_stock"].includes(stock)
    && !["out of stock", "out_of_stock", "unavailable"].includes(status);
  const image = /^https?:\/\//.test(row["merchant_image_url"] ?? "") || /^https?:\/\//.test(row["aw_image_url"] ?? "");
  return (gtin ? 4 : 0) + (inStock ? 2 : 0) + (image ? 1 : 0);
}
