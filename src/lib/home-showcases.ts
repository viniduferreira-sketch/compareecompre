import { z } from 'zod';
import { categoryBySlug } from './category-pages';
import { storefrontIdentity } from './storefront-record';
import type { RelatedHit } from './related-products';
export const showcaseSchema = z.object({
  id: z.string().uuid().optional(), title: z.string().trim().min(1).max(160),
  subtitle: z.string().trim().max(250), category_slug: z.string().refine(value => Boolean(categoryBySlug(value))),
  terms: z.array(z.string().trim().min(1).max(80)).max(12),
  sort_order: z.number().int().min(0).max(1000), active: z.boolean(),
});
export type Showcase = z.infer<typeof showcaseSchema> & { id: string };
export function selectShowcase(hits: RelatedHit[], category: string) {
  const stores = new Map<string, number>(); const groups = new Set<string>(); const ids = new Set<string>();
  const selected: RelatedHit[] = [];
  for (const hit of [...hits].sort((a,b) => (b.popularity_score ?? 0) - (a.popularity_score ?? 0))) {
    if ((hit.categoryName ?? hit.category) !== category || !hit.imageUrl || !hit.title || !Number.isFinite(hit.price) || hit.price <= 0) continue;
    if (hit.status === 'unavailable' || hit.quality_status === 'rejected' || hit.site_hidden || hit.price_review_status === 'pending') continue;
    const store = storefrontIdentity(hit).store;
    const group = `${store}:${hit.group_key ?? hit.objectID}`;
    if (ids.has(hit.objectID) || groups.has(group) || (stores.get(store) ?? 0) >= 3) continue;
    selected.push(hit); ids.add(hit.objectID); groups.add(group); stores.set(store,(stores.get(store) ?? 0)+1);
    if (selected.length === 8) break;
  }
  return selected.length >= 4 ? selected : [];
}