import { queryOptions } from '@tanstack/react-query';
import { liteClient } from 'algoliasearch/lite';
import { getPublicStores } from './partner-stores.functions';
import { monitoredStores } from './monitored-stores';

export const monitoredStoresQuery = () => queryOptions({
  queryKey: ['monitored-stores-directory'], staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000,
  queryFn: async () => {
    const appId = import.meta.env['VITE_LOVABLE_CONNECTOR_ALGOLIA_APPLICATION_ID'];
    const key = import.meta.env['VITE_LOVABLE_CONNECTOR_ALGOLIA_PUBLIC_API_KEY'];
    if (!appId || !key) throw new Error('A contagem de produtos está indisponível.');
    const [identities, response] = await Promise.all([
      getPublicStores(),
      liteClient(appId, key).searchForHits({ requests: [{
        indexName: 'produtos_mercado_livre', query: '', hitsPerPage: 0, distinct: false,
        facets: ['store'], maxValuesPerFacet: 1000,
        filters: 'price > 0 AND NOT status:"unavailable" AND NOT quality_status:"rejected" AND NOT site_hidden:true AND NOT price_review_status:"pending"',
      }] }),
    ]);
    const result = response.results[0];
    if (!result) throw new Error('Não foi possível contar os produtos das lojas.');
    return monitoredStores(identities, result.facets?.['store'] ?? {});
  },
});