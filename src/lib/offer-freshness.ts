export type OfferAvailability = {
  last_synced_at?: string | null | undefined;
  status?: string | undefined;
};

export const OFFER_FRESHNESS_HOURS = 48;

export function isOfferExpired(offer: OfferAvailability, now = Date.now()): boolean {
  if (!offer.last_synced_at) return false;
  const timestamp = Date.parse(offer.last_synced_at);
  return Number.isFinite(timestamp) && now - timestamp > OFFER_FRESHNESS_HOURS * 60 * 60 * 1000;
}

export function selectVisibleOffers<T extends OfferAvailability & { price: number }>(offers: T[], now = Date.now()): T[] {
  const available = offers.filter((offer) => offer.status !== "unavailable" && Number.isFinite(offer.price) && offer.price > 0);
  const fresh = available.filter((offer) => !isOfferExpired(offer, now));
  return fresh.length > 0 ? fresh : available;
}