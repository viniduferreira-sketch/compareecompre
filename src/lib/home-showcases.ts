import { z } from 'zod';
import { categoryBySlug } from './category-pages';
import { storefrontIdentity } from './storefront-record';
import type { RelatedHit } from './related-products';
import { normalizeRailText, validProductImage, sameRailProduct } from './rail-products';

export const HOME_PRODUCT_RAIL_LIMIT = 12;
export const MAX_HOME_PRODUCT_RAILS = 3;
export const FIXED_HOME_PRODUCT_RAILS = 1;
export const MAX_THEMATIC_SHOWCASES = MAX_HOME_PRODUCT_RAILS - FIXED_HOME_PRODUCT_RAILS;
export const SHOWCASE_ACTIVE_LIMIT_MESSAGE = 'A home já tem 3 vitrines ativas. Desative outra antes de ativar esta.';
export const GAMES_EXCLUDED_TERMS = ['capa', 'suporte', 'película', 'skin', 'adesivo', 'cabo', 'mousepad', 'cadeira'];

export const showcaseSchema = z.object({
  id: z.string().uuid().optional(), title: z.string().trim().min(1).max(160),
  subtitle: z.string().trim().max(250), category_slug: z.string().refine(value => value === 'all' || Boolean(categoryBySlug(value))),
  label: z.string().trim().max(60).default(''), stores: z.array(z.string().trim().min(1).max(120)).max(10).default([]),
  min_price: z.number().min(0).nullable().default(null), max_price: z.number().min(0).nullable().default(null), store_quota: z.number().int().min(1).max(4).nullable().default(null),
  terms: z.array(z.string().trim().min(1).max(80)).max(12),
  sort_order: z.number().int().min(0).max(1000), active: z.boolean(),
});
export type Showcase = z.infer<typeof showcaseSchema> & { id: string };
export type ShowcaseSelectionOptions = {
  min_price?: number | null; max_price?: number | null; stores?: string[];
  store_quota?: number | null; terms?: string[]; exclude_terms?: string[];
};

export function canActivateShowcase(activeThematicCount: number, wasActive: boolean, nextActive: boolean) {
  return !nextActive || wasActive || activeThematicCount < MAX_THEMATIC_SHOWCASES;
}

function containsWholeTerm(title: string, term: string) {
  const escaped = normalizeRailText(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(normalizeRailText(title));
}

export function selectShowcase(hits: RelatedHit[], category: string, options: ShowcaseSelectionOptions = {}) {
  const stores = new Map<string, number>(); const groups = new Set<string>(); const ids = new Set<string>();
  const selected: RelatedHit[] = [];
  for (const hit of [...hits].sort((a, b) => (b.popularity_score ?? 0) - (a.popularity_score ?? 0))) {
    if ((category && (hit.categoryName ?? hit.category) !== category) || !validProductImage(hit.imageUrl) || !hit.title || !Number.isFinite(hit.price) || hit.price <= 0) continue;
    if (hit.price < (options.min_price ?? 0) || hit.price > (options.max_price ?? Infinity)) continue;
    if (options.terms?.length && !options.terms.some(term => normalizeRailText(hit.title).includes(normalizeRailText(term)))) continue;
    if (options.exclude_terms?.some(term => containsWholeTerm(hit.title, term))) continue;
    if (hit.status === 'unavailable' || hit.quality_status === 'rejected' || hit.site_hidden || hit.price_review_status === 'pending') continue;
    const store = storefrontIdentity(hit).store;
    if (options.stores?.length && !options.stores.some(name => normalizeRailText(name) === normalizeRailText(store))) continue;
    const group = `${store}:${hit.group_key ?? hit.objectID}`;
    if (ids.has(hit.objectID) || groups.has(group) || (stores.get(store) ?? 0) >= (options.store_quota ?? HOME_PRODUCT_RAIL_LIMIT) || selected.some(item => sameRailProduct(item, hit))) continue;
    selected.push(hit); ids.add(hit.objectID); groups.add(group); stores.set(store, (stores.get(store) ?? 0) + 1);
    if (selected.length === HOME_PRODUCT_RAIL_LIMIT) break;
  }
  const quota = options.store_quota;
  if (quota && options.stores?.some(name => ([...stores].find(([store]) => normalizeRailText(store) === normalizeRailText(name))?.[1] ?? 0) < quota)) return [];
  if (selected.length < 4) return [];
  if (quota && options.stores?.length) {
    const buckets = options.stores.map(name => selected.filter(hit => normalizeRailText(storefrontIdentity(hit).store) === normalizeRailText(name)));
    return Array.from({ length: quota }, (_, i) => buckets.flatMap(bucket => bucket[i] ? [bucket[i]] : [])).flat();
  }
  return selected;
}
