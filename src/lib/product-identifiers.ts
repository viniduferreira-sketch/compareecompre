/** Partner identifiers are evidence, not values inferred from product titles. */
export function normalizeGtin(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const digits = String(value).replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 14 ? digits.padStart(14, "0") : null;
}

export function normalizeModel(value: unknown): string | null {
  return typeof value === "string" ? value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300) || null : null;
}

export type CatalogAttribute = { id?: string; value_name?: string; values?: Array<{ name?: string }> };
export function mercadoLivreIdentifiers(attributes: CatalogAttribute[] = []) {
  const value = (id: string) => attributes.find((a) => a.id === id)?.value_name
    ?? attributes.find((a) => a.id === id)?.values?.[0]?.name;
  return { gtin: normalizeGtin(value("GTIN")), model: normalizeModel(value("MODEL")) };
}

export type IdentifierCounts = Record<string, { total: number; gtin: number; brand: number; model: number }>;
export function countIdentifiers(records: Array<Record<string, unknown>>): IdentifierCounts {
  const counts: IdentifierCounts = {};
  for (const record of records) {
    const source = typeof record["source"] === "string" && record["source"] ? record["source"] : "unknown";
    const row = counts[source] ?? (counts[source] = { total: 0, gtin: 0, brand: 0, model: 0 });
    row.total += 1;
    if (normalizeGtin(record["gtin"])) row.gtin += 1;
    if (normalizeModel(record["brand"])) row.brand += 1;
    if (normalizeModel(record["model"])) row.model += 1;
  }
  return counts;
}