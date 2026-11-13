import { categorySlug } from './category-pages';
import { CATEGORY_BLOG_SLUGS } from './category-content';
import { selectCatalog, uniqueCatalog } from './catalog-pages';
import type { RelatedHit } from './related-products';

export function storeBuyingCategories(hits: RelatedHit[], stores: string[]) {
  const counts = new Map<string, number>();
  for (const hit of uniqueCatalog(selectCatalog(hits.filter(h => stores.includes(h.store ?? h.merchant_name ?? '')), false))) {
    const slug = categorySlug(hit.categoryName ?? '');
    if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  // Select the two most represented categories before mapping; unknown categories
  // must not accidentally fall back to a minor unrelated category with guides.
  return [...new Set([...counts].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).slice(0,2).flatMap(([slug]) => CATEGORY_BLOG_SLUGS[slug] ?? []))];
}