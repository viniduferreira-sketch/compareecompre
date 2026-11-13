import { normalizeGtin, normalizeModel } from './product-identifiers';
import { storefrontIdentity, type StorefrontRecord } from './storefront-record';

export const COMPARISON_CACHE_MS = 5 * 60_000;
const normalized = (value: unknown) => normalizeModel(value)?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() ?? '';
type Evidence = { gtin?: unknown; ean?: unknown; brand?: unknown; model?: unknown; comparison_variant?: unknown };

/** Only structured, complete variant evidence permits the no-GTIN fallback. Never infer from titles. */
export function comparisonKey(record: Evidence): string | null {
  const gtin = normalizeGtin(record.gtin) ?? normalizeGtin(record.ean);
  if (gtin) return `gtin:${gtin}`;
  const brand = normalized(record.brand), model = normalized(record.model);
  if (!brand || !model || !/\d/.test(model) || model.length < 3) return null;
  const variant = record.comparison_variant;
  if (!variant || typeof variant !== 'object' || Array.isArray(variant)) return null;
  const fields = variant as Record<string, unknown>;
  const type = normalized(fields['type']);
  const requirements: Record<string, string[]> = {
    smartphone: ['storage', 'ram', 'colour', 'network'],
    ssd: ['capacity', 'interface', 'form_factor'],
    air_fryer: ['capacity', 'voltage', 'colour'],
  };
  const required = requirements[type];
  if (!required) return null;
  const values = required.map(field => normalized(fields[field]));
  if (values.some(value => !value || ['na', 'n/a', 'unknown', 'nao informado'].includes(value))) return null;
  return `model:${JSON.stringify([brand, model, type, ...values])}`;
}

/** Explicit partner attributes only; unsupported or incomplete devices stay ungrouped. */
export function comparisonVariant(attributes: Array<{ id?: string; name?: string; value?: string; value_name?: string }> = []) {
  const aliases: Record<string, string[]> = {
    type: ['DEVICE_TYPE', 'PRODUCT_TYPE'], storage: ['INTERNAL_MEMORY'], ram: ['RAM'],
    colour: ['COLOR', 'COLOUR', 'COR'], network: ['MOBILE_NETWORK'], capacity: ['CAPACITY', 'CAPACIDADE'],
    interface: ['INTERFACE'], form_factor: ['FORM_FACTOR'], voltage: ['VOLTAGE', 'VOLTAGEM'],
  };
  const values: Record<string, string> = {};
  for (const [field, names] of Object.entries(aliases)) {
    const attr = attributes.find(attr => names.includes((attr.id ?? attr.name ?? '').toUpperCase()));
    const value = attr?.value_name ?? attr?.value;
    if (value) values[field] = value;
  }
  return values;
}

export type ComparedOffer = {
  id: string; store: string; storeLogoUrl?: string | null; price: number; affiliateUrl: string;
  source?: string | undefined; last_synced_at?: string | undefined; shippingCost?: number | null; freeShipping?: boolean | undefined; sellerName?: string | null;
};
export type ComparisonRecord = Evidence & StorefrontRecord & {
  objectID: string; price?: unknown; status?: string; quality_status?: string; site_hidden?: boolean;
  inStock?: boolean; price_review_status?: string; shippingCost?: unknown; freeShipping?: boolean;
  sellerName?: string | null; seller_nickname?: string | null; last_synced_at?: string;
};

export function groupComparedOffers(base: Evidence, records: ComparisonRecord[]): ComparedOffer[] {
  const key = comparisonKey(base);
  if (!key) return [];
  const best = new Map<string, ComparedOffer>();
  for (const record of records) {
    if (comparisonKey(record) !== key || typeof record.price !== 'number' || !Number.isFinite(record.price) || record.price <= 0
      || record.status === 'unavailable' || record.inStock === false || record.site_hidden
      || record.quality_status === 'rejected' || record.price_review_status === 'pending') continue;
    const identity = storefrontIdentity(record);
    if (!/^https?:\/\//.test(identity.affiliateUrl)) continue;
    const offer: ComparedOffer = { id: record.objectID, ...identity, price: record.price, source: record.source,
      last_synced_at: record.last_synced_at, freeShipping: record.freeShipping,
      shippingCost: typeof record.shippingCost === 'number' && record.shippingCost >= 0 ? record.shippingCost : null,
      sellerName: record.sellerName ?? record.seller_nickname ?? null };
    const storeKey = normalized(identity.store);
    const old = best.get(storeKey);
    if (!old || offer.price < old.price) best.set(storeKey, offer);
  }
  return [...best.values()].sort((a, b) => a.price - b.price);
}

export function isSameProduct(base: Evidence, other: Evidence): boolean {
  const key = comparisonKey(base);
  return key !== null && key === comparisonKey(other);
}