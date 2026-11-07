export type OfferAvailability = {
  last_synced_at?: string | null | undefined;
  status?: string | undefined;
  source?: string | undefined;
};

export const OFFER_FRESHNESS_HOURS = 48;

/**
 * When true, Mercado Livre offers without last_synced_at or older than 24h are
 * hidden with no fallback. Kept false until the revalidation routine proves stable.
 */
export const ML_STRICT_FRESHNESS = false;
export const ML_STRICT_FRESHNESS_HOURS = 24;

export function isOfferExpired(offer: OfferAvailability, now = Date.now()): boolean {
  if (!offer.last_synced_at) return false;
  const timestamp = Date.parse(offer.last_synced_at);
  return Number.isFinite(timestamp) && now - timestamp > OFFER_FRESHNESS_HOURS * 60 * 60 * 1000;
}

function isMlStale(offer: OfferAvailability, now: number): boolean {
  if (offer.source !== "mercadolivre") return false;
  if (!offer.last_synced_at) return true;
  const timestamp = Date.parse(offer.last_synced_at);
  return !Number.isFinite(timestamp) || now - timestamp > ML_STRICT_FRESHNESS_HOURS * 60 * 60 * 1000;
}

export function selectVisibleOffers<T extends OfferAvailability & { price: number }>(offers: T[], now = Date.now()): T[] {
  const available = offers.filter((offer) => offer.status !== "unavailable" && Number.isFinite(offer.price) && offer.price > 0);
  if (ML_STRICT_FRESHNESS) return available.filter((offer) => !isMlStale(offer, now));
  const fresh = available.filter((offer) => !isOfferExpired(offer, now));
  return fresh.length > 0 ? fresh : available;
}