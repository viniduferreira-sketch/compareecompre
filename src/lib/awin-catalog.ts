import { z } from "zod";
import { toSiteCategory } from "./storefront-mix";
import { normalizeGtin, normalizeModel } from "./product-identifiers";
import { ADULT_CONTENT_REASON, MERCHANT_NOT_ALLOWED_REASON, getAdultContentMatch } from "./content-policy";
import { isAwinMerchantAllowed } from "./awin-allowlist";

export const awinRowSchema = z.record(z.string().max(30000));
export type AwinRow = z.infer<typeof awinRowSchema>;

function amount(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const cleaned = value.trim().replace(/R\$\s*/g, "");
  const number = Number(cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned);
  return Number.isFinite(number) ? number : null;
}

function httpUrl(value: string | undefined): string | null {
  try {
    const url = new URL(value ?? "");
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

function text(value: string | undefined, max = 5000) {
  return (value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** Same acceptance rules as the importer, with one stable reason per discarded row. */
export function awinDiscardReason(row: AwinRow, allowedMerchants?: readonly string[]): string | null {
  const externalId = (row["aw_product_id"] || row["merchant_product_id"] || "").trim();
  const merchantId = (row["merchant_id"] || "").trim();
  if (!externalId) return "missing_product_id";
  if (!merchantId) return "missing_merchant_id";
  if (!text(row["product_name"], 500)) return "missing_title";
  if (!text(row["merchant_name"], 200)) return "missing_store";
  if (allowedMerchants && !isAwinMerchantAllowed(row["merchant_name"] ?? "", allowedMerchants)) return MERCHANT_NOT_ALLOWED_REASON;
  if (getAdultContentMatch({
    store: row["merchant_name"],
    category: [row["category_name"], row["merchant_category"]],
    title: row["product_name"],
  })) return ADULT_CONTENT_REASON;
  if (!httpUrl(row["aw_deep_link"])) return "invalid_affiliate_url";
  const price = amount(row["search_price"]);
  if (!price || price <= 0 || price > 1e9) return "invalid_price";
  if (row["currency"] && row["currency"].toUpperCase() !== "BRL") return "unsupported_currency";
  if (!/^[\w.-]{1,80}$/.test(externalId) || !/^[\w.-]{1,40}$/.test(merchantId)) return "invalid_id";
  return null;
}

export function normalizeAwinProduct(row: AwinRow, syncedAt: string, allowedMerchants?: readonly string[]) {
  const externalId = (row["aw_product_id"] || row["merchant_product_id"] || "").trim();
  const merchantId = (row["merchant_id"] || "").trim();
  const price = amount(row["search_price"]);
  const title = text(row["product_name"], 500);
  const store = text(row["merchant_name"], 200);
  const affiliateUrl = httpUrl(row["aw_deep_link"]);
  if (awinDiscardReason(row, allowedMerchants) || !affiliateUrl || !price) return null;
  const stock = (row["in_stock"] ?? "").trim().toLowerCase();
  const sale = (row["is_for_sale"] ?? "").trim().toLowerCase();
  const stockStatus = (row["stock_status"] ?? "").trim().toLowerCase();
  const unavailable = ["0", "false", "no", "n", "out of stock", "out_of_stock"].includes(stock)
    || ["0", "false", "no", "n"].includes(sale)
    || ["out of stock", "out_of_stock", "unavailable"].includes(stockStatus)
    || (Boolean(row["valid_to"]) && Date.parse(row["valid_to"] ?? "") < Date.parse(syncedAt));
  const old = amount(row["product_price_old"]) ?? amount(row["rrp_price"]);
  const originalPrice = old && old > price ? old : null;
  return {
    objectID: `awin-${merchantId}-${externalId}`,
    externalId, merchantId, source: "awin" as const,
    parent_product_id: text(row["parent_product_id"], 200) || null,
    colour: text(row["colour"], 100) || null,
    size: text(row["Fashion:size"], 100) || null,
    title, store, price, affiliateUrl,
    imageUrl: httpUrl(row["merchant_image_url"]) ?? httpUrl(row["aw_image_url"]),
    images: [row["merchant_image_url"], row["large_image"], row["alternate_image"], row["alternate_image_two"]]
      .flatMap((value) => { const url = httpUrl(value); return url ? [url] : []; }),
    originalPrice,
    discountPercent: originalPrice ? Math.round((originalPrice - price) / originalPrice * 100) : null,
    category: text(row["category_name"] || row["merchant_category"], 300) || null,
    categoryName: toSiteCategory(text(row["category_name"] || row["merchant_category"], 300))
      ?? toSiteCategory(text(row["merchant_category"], 300)),
    brand: text(row["brand_name"], 200) || null,
    gtin: normalizeGtin(row["ean"]) ?? normalizeGtin(row["product_GTIN"]),
    model: normalizeModel(row["product_model"]) ?? normalizeModel(row["model_number"]),
    description: text(row["description"] || row["product_short_description"]),
    attributes: [["Marca", row["brand_name"]], ["Modelo", row["product_model"]], ["Cor", row["colour"]], ["Dimensões", row["dimensions"]], ["Especificações", row["specifications"]]]
      .flatMap(([name, value]) => value && name ? [{ name, value: text(value), source: "awin" }] : []),
    freeShipping: amount(row["delivery_cost"]) === 0,
    inStock: !unavailable,
    status: unavailable ? "unavailable" as const : "active" as const,
    sellerCount: 1, qa: [], last_synced_at: syncedAt,
  };
}

export type AwinProduct = NonNullable<ReturnType<typeof normalizeAwinProduct>>;

export function authorizedAwinWorkflow(claims: Record<string, unknown>, repository: string) {
  return claims["repository"] === repository
    && claims["ref"] === "refs/heads/main"
    && claims["workflow_ref"] === `${repository}/.github/workflows/awin-import.yml@refs/heads/main`
    && ["workflow_dispatch", "schedule"].includes(String(claims["event_name"]));
}