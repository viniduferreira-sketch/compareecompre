import { categorySearch, categorySlug, categoryBySlug, type CategorySearch } from './category-pages';
import { validProductImage, normalizeRailText } from './rail-products';
import { type RelatedHit } from './related-products';
import { selectVisibleOffers } from './offer-freshness';

export const DEALS_PAGE_SIZE = 24;
export const DEALS_MIN_PRICE = 30;
export const DEALS_MIN_DISCOUNT = 10;
export type CatalogSearch = CategorySearch & { q?: string | undefined; categoria?: string | undefined };
export function catalogSearch(input: Record<string, unknown>): CatalogSearch {
  return { ...categorySearch(input), q: typeof input['q'] === 'string' ? input['q'] : undefined, categoria: typeof input['categoria'] === 'string' ? input['categoria'] : undefined };
}
export function catalogHref(path: '/ofertas' | '/busca', search: CatalogSearch = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) if (value !== undefined && value !== '' && !(key === 'pagina' && value === 1)) params.set(key, String(value));
  return `${path}${params.size ? `?${params}` : ''}`;
}
export function dealsCanonical(search: CatalogSearch) {
  return 'https://compareecompre.com' + catalogHref('/ofertas', { pagina: search.pagina });
}
export function actualDiscount(hit: Pick<RelatedHit, 'price' | 'originalPrice'>) {
  return Number.isFinite(hit.originalPrice) && (hit.originalPrice ?? 0) > hit.price ? (1 - hit.price / Number(hit.originalPrice)) * 100 : 0;
}
export function selectCatalog(hits: RelatedHit[], deals: boolean) {
  const visible = hits.filter(hit => Number.isFinite(hit.price) && hit.price > 0 && hit.status !== 'unavailable' && hit.quality_status !== 'rejected' && !hit.site_hidden && hit.price_review_status !== 'pending' && validProductImage(hit.imageUrl));
  return selectVisibleOffers(visible).filter(hit => !deals || (hit.price >= DEALS_MIN_PRICE && actualDiscount(hit) + 1e-9 >= DEALS_MIN_DISCOUNT));
}
export function filterCatalog(hits: RelatedHit[], search: CatalogSearch) {
  const matches = (actual: string, wanted: string) => categorySlug(actual) === categorySlug(wanted) || categorySlug(actual).replace(/-br$/, '') === categorySlug(wanted);
  return hits.filter(hit => (!search.categoria || hit.categoryName === categoryBySlug(search.categoria)?.name) && (!search.loja || matches(hit.store ?? hit.merchant_name ?? '', search.loja)) && (!search.marca || matches(hit.brand ?? '', search.marca)) && (!search.frete || String(Boolean(hit.freeShipping)) === search.frete));
}
export function orderCatalog(hits: RelatedHit[], order?: string) {
  return [...hits].sort((a, b) => (order === 'menor-preco' ? a.price - b.price : order === 'maior-desconto' ? actualDiscount(b) - actualDiscount(a) : (b.popularity_score ?? 0) - (a.popularity_score ?? 0)) || a.objectID.localeCompare(b.objectID));
}
export function uniqueCatalog(hits: RelatedHit[]) {
  const seen = new Set<string>();
  return hits.filter(hit => {
    // Store identity always scopes deduplication: competing stores remain separate.
    const key = `${hit.source ?? ''}:${hit.store ?? hit.merchant_name}:${normalizeRailText(hit.title).replace(/\s+/g, ' ')}`;
    const group = hit.group_key ? `group:${hit.group_key}` : key;
    if (seen.has(key) || seen.has(group)) return false;
    seen.add(key); seen.add(group); return true;
  });
}