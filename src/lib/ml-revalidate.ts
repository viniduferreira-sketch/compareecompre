// Pure classification rules for the Mercado Livre revalidation routine.
// Kept free of server-only imports so the rules stay unit-testable.

export type MeliItemVerdict = "active" | "unavailable" | "unknown";

export type MeliMultigetBody = {
  id?: string;
  status?: string;
  available_quantity?: number;
  message?: string;
} | null;

/**
 * Decides what to do with one item based on its multiget envelope.
 * Only an explicit API answer marks an item unavailable: confirmed 404/410,
 * a status other than "active", or zero stock. Any API error (429, 5xx,
 * timeout, unexpected payload) means "unknown" and the record is left alone.
 */
export function classifyMeliItem(code: number, body: MeliMultigetBody): MeliItemVerdict {
  if (code === 404 || code === 410) return "unavailable";
  if (code < 200 || code >= 300 || !body) return "unknown";
  if (body.status !== "active") return "unavailable";
  if (typeof body.available_quantity === "number" && body.available_quantity <= 0) return "unavailable";
  return "active";
}

/** Catalog product level: only an explicit answer marks the product unavailable. */
export function classifyMeliProduct(code: number, body: { status?: string } | null): MeliItemVerdict {
  if (code === 404 || code === 410) return "unavailable";
  if (code < 200 || code >= 300 || !body) return "unknown";
  return body.status === "active" ? "active" : "unavailable";
}

/** Items list level: 404 or an explicit empty list means no active offer exists. */
export function classifyMeliItemsList(code: number, results: unknown[] | null): MeliItemVerdict {
  if (code === 404 || code === 410) return "unavailable";
  if (code < 200 || code >= 300 || !Array.isArray(results)) return "unknown";
  return results.length === 0 ? "unavailable" : "active";
}

/** Circuit breaker: above this share of unavailable items, nothing is written. */
export const ML_REVALIDATION_MAX_UNAVAILABLE_RATIO = 0.3;

export function shouldAbortRevalidation(verified: number, unavailable: number): boolean {
  return verified > 0 && unavailable / verified > ML_REVALIDATION_MAX_UNAVAILABLE_RATIO;
}

/** Extracts the item id from a multiget error body ("Item with id MLB123 not found"). */
export function itemIdFromErrorBody(body: MeliMultigetBody): string | null {
  const match = body?.message?.match(/MLB\d+/i);
  return match ? match[0].toUpperCase() : null;
}
