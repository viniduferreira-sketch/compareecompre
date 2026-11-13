import { queryOptions } from '@tanstack/react-query';
import { liteClient } from 'algoliasearch/lite';
import { getPublicStores } from './partner-stores.functions';
import { selectVisibleOffers } from './offer-freshness';
import { RELATED_CONFIG, RELATED_VISIBILITY, selectRelated, type RelatedHit } from './related-products';

const indexName = 'produtos_mercado_livre';
function config() {
  const appId = import.meta.env['VITE_LOVABLE_CONNECTOR_ALGOLIA_APPLICATION_ID'];
  const key = import.meta.env['VITE_LOVABLE_CONNECTOR_ALGOLIA_PUBLIC_API_KEY'];
  if (!appId || !key) throw new Error('Produtos relacionados indisponíveis.');
  return { appId, key, client: liteClient(appId, key) };
}
export const relatedCurrentQuery = (id: string) => queryOptions({
  queryKey: ['related-current', id], staleTime: 300000,
  queryFn: async (): Promise<RelatedHit> => {
    const { appId, key } = config();
    const response = await fetch(`https://${appId}-dsn.algolia.net/1/indexes/${indexName}/${encodeURIComponent(id)}`, { headers: { 'X-Algolia-Application-Id': appId, 'X-Algolia-API-Key': key } });
    if (!response.ok) throw new Error('Produto relacionado indisponível.');
    return response.json();
  },
});

export async function candidates(current: RelatedHit, min = 0, max = Infinity, query = '') {
  const category = current.categoryName ?? current.category;
  if (!category) return [];
  const { client } = config();
  const [stores, response] = await Promise.all([getPublicStores(), client.searchForHits<RelatedHit>({ requests: [{
    indexName, query, hitsPerPage: 200, distinct: 1,
    facetFilters: [`${current.categoryName ? 'categoryName' : 'category'}:${category}`],
    filters: `${RELATED_VISIBILITY} AND price >= ${min}${Number.isFinite(max) ? ` AND price <= ${max}` : ''}`,
  }] })]);
  return selectVisibleOffers((response.results[0]?.hits ?? []).filter(hit => Object.hasOwn(stores, hit.store ?? hit.merchant_name ?? hit.loja ?? '')));
}
export const alternativesQuery = (current: RelatedHit) => queryOptions({
  queryKey: ['related-alternatives', current.objectID, current.price], staleTime: 300000,
  queryFn: async () => {
    for (const [lower, upper] of RELATED_CONFIG.priceRanges) {
      const min = current.price * lower, max = current.price * upper;
      const selected = selectRelated(await candidates(current, min, max), current, { limit: 4, brandLimit: 2, min, max });
      if (selected.length === 4) return selected;
    }
    return [];
  },
});
export const categoryRelatedQuery = (current: RelatedHit, exclude: string[], excludeGroups: string[]) => queryOptions({
  queryKey: ['related-category', current.objectID, exclude, excludeGroups], staleTime: 300000,
  queryFn: async () => {
    const selected = selectRelated(await candidates(current), current, { limit: 8, exclude, excludeGroups });
    return selected.length === 8 ? selected : [];
  },
});