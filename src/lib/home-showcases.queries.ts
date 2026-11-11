import { queryOptions } from '@tanstack/react-query';
import { liteClient } from 'algoliasearch/lite';
import { publicShowcases } from './home-showcases.functions';
import { categoryBySlug } from './category-pages';
import { GAMES_EXCLUDED_TERMS, selectShowcase } from './home-showcases';
import { RELATED_VISIBILITY, type RelatedHit } from './related-products';
import { selectVisibleOffers } from './offer-freshness';
import { getPublicStores } from './partner-stores.functions';
import { normalizeRailText } from './rail-products';

const ATTRIBUTES = ['objectID', 'title', 'imageUrl', 'store', 'merchant_name', 'loja', 'price', 'originalPrice', 'discountPercent', 'freeShipping', 'affiliateUrl', 'aw_deep_link', 'categoryName', 'category', 'source', 'status', 'last_synced_at', 'group_key', 'popularity_score', 'storeLogoUrl'];

export const homeShowcasesQuery = () => queryOptions({
  queryKey: ['home-showcases'], staleTime: 300000,
  queryFn: async () => {
    const [showcases, stores] = await Promise.all([publicShowcases(), getPublicStores()]);
    if (!showcases.length) return [];
    const app = import.meta.env['VITE_LOVABLE_CONNECTOR_ALGOLIA_APPLICATION_ID'];
    const key = import.meta.env['VITE_LOVABLE_CONNECTOR_ALGOLIA_PUBLIC_API_KEY'];
    if (!app || !key) return [];
    const client = liteClient(app, key);
    const filtersFor = (showcase: (typeof showcases)[number]) => RELATED_VISIBILITY + (showcase.min_price !== null ? ` AND price >= ${showcase.min_price}` : '') + (showcase.max_price !== null ? ` AND price <= ${showcase.max_price}` : '');
    const categoriesFor = (showcase: (typeof showcases)[number]) => showcase.category_slug === 'all' ? [] : [`categoryName:${categoryBySlug(showcase.category_slug)?.name ?? ''}`];
    try {
      const discoveryQueries = showcases.flatMap(showcase => (showcase.terms.length ? showcase.terms : ['']).map(query => ({ showcase, query })));
      const discovery = await client.searchForHits<RelatedHit>({ requests: discoveryQueries.map(({ showcase, query }) => ({
        indexName: 'produtos_mercado_livre', query, hitsPerPage: 0, facets: ['store'], maxValuesPerFacet: 1000,
        facetFilters: categoriesFor(showcase), filters: filtersFor(showcase), typoTolerance: false,
      })) });
      const queries = discovery.results.flatMap((result, index) => {
        const current = discoveryQueries[index];
        if (!current) return [];
        const names = Object.keys(result.facets?.['store'] ?? {}).filter(name =>
          (name === 'Mercado Livre' || Object.hasOwn(stores, name)) &&
          (!current.showcase.stores.length || current.showcase.stores.some(store => normalizeRailText(store) === normalizeRailText(name))),
        );
        return names.map(store => ({ ...current, store }));
      });
      if (!queries.length) return [];
      const chunks = Array.from({ length: Math.ceil(queries.length / 40) }, (_, index) => queries.slice(index * 40, index * 40 + 40));
      const responses = await Promise.all(chunks.map(chunk => client.searchForHits<RelatedHit>({ requests: chunk.map(({ showcase, query, store }) => ({
        indexName: 'produtos_mercado_livre', query, hitsPerPage: 60, distinct: 1,
        facetFilters: [`store:${store}`, ...categoriesFor(showcase)], filters: filtersFor(showcase), typoTolerance: false,
        attributesToRetrieve: ATTRIBUTES,
      })) })));
      const results = responses.flatMap(response => response.results);
      return showcases.map(showcase => {
        const hits = results.flatMap((result, index) => queries[index]?.showcase.id === showcase.id ? selectVisibleOffers(result.hits) : []);
        const publicHits = hits.filter(hit => Object.hasOwn(stores, hit.store ?? hit.merchant_name ?? hit.loja ?? '') || hit.store === 'Mercado Livre');
        const exclude_terms = showcase.label === 'GAMES' ? GAMES_EXCLUDED_TERMS : [];
        return { ...showcase, hits: selectShowcase(publicHits, categoryBySlug(showcase.category_slug)?.name ?? '', { ...showcase, exclude_terms }) };
      }).filter(showcase => showcase.hits.length >= 4);
    } catch (error) { console.error('Vitrines indisponíveis', error); return []; }
  },
});
