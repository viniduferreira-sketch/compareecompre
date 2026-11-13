import type { Offer } from './search-offers.functions';
import { storefrontIdentity, type StorefrontRecord } from './storefront-record';

export type RelatedHit = StorefrontRecord & {
  objectID: string; title: string; price: number; imageUrl?: string | null;
  originalPrice?: number | null; discountPercent?: number | null; freeShipping?: boolean;
  categoryName?: string | null; category?: string | null; group_key?: string | null;
  productType?: string | null; audience?: string[] | null;
  merchant_category?: string | null; category_name?: string | null; product_type?: string | null;
  category_path?: string | null; merchant_category_path?: string | null;
  brand?: string | null; popularity_score?: number; status?: string; quality_status?: string;
  site_hidden?: boolean; price_review_status?: string; last_synced_at?: string;
};
export const RELATED_CONFIG = { alternativeCount: 4, categoryCount: 8, maxPerBrand: 2, priceRanges: [[0.7, 1.3], [0.5, 1.5], [0, Infinity]] } as const;
export const RELATED_VISIBILITY = 'price > 0 AND NOT status:"unavailable" AND NOT quality_status:"rejected" AND NOT site_hidden:true AND NOT price_review_status:"pending"';
const normalize = (text: string) => text.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function selectRelated(hits: RelatedHit[], current: RelatedHit, options: { limit: number; brandLimit?: number; min?: number; max?: number; exclude?: string[]; excludeGroups?: string[] }) {
  const seen = new Set([current.objectID, ...(options.exclude ?? [])]);
  const groups = new Set([...(current.group_key ? [current.group_key] : []), ...(options.excludeGroups ?? [])]);
  const brands = new Map<string, number>();
  const result: RelatedHit[] = [];
  for (const hit of [...hits].sort((a,b) => (b.popularity_score ?? 0) - (a.popularity_score ?? 0))) {
    if (seen.has(hit.objectID) || (hit.group_key && groups.has(hit.group_key))) continue;
    if ((hit.categoryName ?? hit.category) !== (current.categoryName ?? current.category)) continue;
    if (!Number.isFinite(hit.price) || hit.price <= 0 || hit.status === 'unavailable' || hit.quality_status === 'rejected' || hit.site_hidden || hit.price_review_status === 'pending') continue;
    if (hit.price < (options.min ?? 0) || hit.price > (options.max ?? Infinity)) continue;
    const brand = normalize(hit.brand ?? '');
    if (brand && options.brandLimit && (brands.get(brand) ?? 0) >= options.brandLimit) continue;
    result.push(hit); seen.add(hit.objectID);
    if (hit.group_key) groups.add(hit.group_key);
    if (brand) brands.set(brand, (brands.get(brand) ?? 0) + 1);
    if (result.length === options.limit) break;
  }
  return result;
}

export function relatedOffer(hit: RelatedHit): Offer {
  return { id: hit.objectID, title: hit.title, price: hit.price, imageUrl: hit.imageUrl ?? null,
    ...storefrontIdentity(hit), originalPrice: hit.originalPrice ?? null, discountPercent: hit.discountPercent ?? null,
    freeShipping: hit.freeShipping ?? false, category: hit.categoryName ?? hit.category ?? null,
    sellerCount: 0, source: hit.source, status: hit.status, last_synced_at: hit.last_synced_at };
}