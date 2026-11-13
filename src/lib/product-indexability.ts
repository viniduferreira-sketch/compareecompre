/** Only persisted partner evidence counts; generated charts/copy and star counts do not. */
export const PRODUCT_INDEXING_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const PRODUCT_SEO_ATTRIBUTES = ["objectID", "status", "inStock", "last_synced_at", "qa", "reviews", "price_history", "site_hidden", "quality_status", "price_review_status"];
type RecordData = Record<string, unknown>;
const rows = (value: unknown): RecordData[] => Array.isArray(value)
  ? value.filter((item): item is RecordData => !!item && typeof item === "object") : [];
const text = (value: unknown) => typeof value === "string" && value.trim().length > 0;

export function realPriceHistory(record: RecordData) {
  return rows(record["price_history"]).flatMap(point => {
    const date = typeof point["date"] === "string" ? point["date"] : "";
    const price = point["price"];
    return date && Number.isFinite(Date.parse(date)) && typeof price === "number" && price > 0
      ? [{ date, price }] : [];
  }).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

export function productIndexability(record: RecordData, now = Date.now()) {
  const updated = typeof record["last_synced_at"] === "string" ? Date.parse(record["last_synced_at"]) : NaN;
  const stale = Number.isFinite(updated) && now - updated > PRODUCT_INDEXING_MAX_AGE_MS;
  const unavailable = record["status"] === "unavailable" || record["inStock"] === false || stale;
  const history = realPriceHistory(record);
  const hasHistory = new Set(history.map(point => point.date.slice(0, 10))).size >= 2;
  const hasQuestions = rows(record["qa"]).some(item => text(item["source"]) && text(item["pergunta"]) && text(item["data"]));
  const hasReviews = rows(record["reviews"]).some(item => text(item["source"]) && text(item["text"]));
  const hidden = record["site_hidden"] === true || record["quality_status"] === "rejected" || record["price_review_status"] === "pending";
  return { indexable: !unavailable && !hidden && (hasHistory || hasQuestions || hasReviews), unavailable, stale, history };
}