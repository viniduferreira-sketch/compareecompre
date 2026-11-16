import { afterEach, expect, it, vi } from 'vitest';
import { searchPublicProducts } from './public-product-search';
import { searchPageQuery } from './search-page.queries';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
function setup(results: unknown[]) {
  vi.stubEnv('VITE_LOVABLE_CONNECTOR_ALGOLIA_APPLICATION_ID', 'test-app');
  vi.stubEnv('VITE_LOVABLE_CONNECTOR_ALGOLIA_PUBLIC_API_KEY', 'search-only');
  const fetch = vi.fn().mockImplementation(async () => new Response(JSON.stringify({ results }), { status: 200 }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}
it('loads only the requested search page, not all matching records', async () => {
  const fetch = setup([{ hits: [], nbHits: 50000, facets: {} }]);
  const options = searchPageQuery({ q: 'air fryer', pagina: 2 });
  const result = await options.queryFn?.({} as never);
  expect(result?.paging).toEqual({ total: 50000, limit: 24, offset: 24 });
  expect(fetch).toHaveBeenCalledOnce();
  const request = JSON.parse(fetch.mock.calls[0]?.[1].body).requests[0];
  expect(request).toMatchObject({ query: 'air fryer', page: 1, hitsPerPage: 24, distinct: 1 });
});
it('limits blog candidates to 100 and preserves its exact price and category filters', async () => {
  const fetch = setup([{ hits: [], nbHits: 10000 }]);
  await searchPublicProducts({ query: 'monitor 27', limit: 1000, filters: 'price >= 700', facetFilters: [['categoryName:Eletrônicos']] });
  const request = JSON.parse(fetch.mock.calls[0]?.[1].body).requests[0];
  expect(request.hitsPerPage).toBe(100);
  expect(request.filters).toContain('price >= 700');
  expect(request.facetFilters).toEqual([['categoryName:Eletrônicos']]);
  expect(request.removeWordsIfNoResults).toBe('none');
  expect(fetch).toHaveBeenCalledOnce();
});
it('uses the existing price replica without changing ranking settings', async () => {
  const fetch = setup([{ hits: [], nbHits: 0 }]);
  await searchPublicProducts({ query: 'camera', priceOrder: true });
  expect(JSON.parse(fetch.mock.calls[0]?.[1].body).requests[0].indexName).toBe('produtos_mercado_livre_price_asc');
});