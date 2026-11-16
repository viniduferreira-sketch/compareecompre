import { afterEach, expect, it, vi } from 'vitest';
import { dealsPageQuery } from './deals-page.queries';
import { popularSearchProductsQuery } from './search-page.queries';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
function setup() {
  vi.stubEnv('VITE_LOVABLE_CONNECTOR_ALGOLIA_APPLICATION_ID', 'test-app');
  vi.stubEnv('VITE_LOVABLE_CONNECTOR_ALGOLIA_PUBLIC_API_KEY', 'search-only');
  const fetch = vi.fn(async () => new Response(JSON.stringify({ results: [{ hits: [], nbHits: 75393, facets: { store: { 'KaBuM BR': 200 }, brand: { 'São José': 100 } } }] }), { status: 200 }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}
it('loads 24 offers on page two even with 75,393 matches, without catalog recursion', async () => {
  const fetch = setup();
  const result = await dealsPageQuery({ pagina: 2 }).queryFn?.({} as never);
  expect(result?.paging).toEqual({ total: 75393, limit: 24, offset: 24 });
  expect(fetch).toHaveBeenCalledOnce();
  const request = JSON.parse((fetch.mock.calls[0] as unknown as [string, { body: string }])[1].body).requests[0];
  expect(request).toMatchObject({ page: 1, hitsPerPage: 24, distinct: 1 });
  expect(request.filters).toContain('price >= 30 AND discountPercent >= 10');
});
it('resolves store and brand slugs with zero product hits and applies category before pagination', async () => {
  const fetch = setup();
  await dealsPageQuery({ loja: 'kabum', marca: 'sao-jose', categoria: 'eletronicos', ordem: 'menor-preco', pagina: 3 }).queryFn?.({} as never);
  const requests = fetch.mock.calls.map(call => JSON.parse((call as unknown as [string, { body: string }])[1].body).requests[0]);
  expect(requests).toHaveLength(2);
  expect(requests[0].hitsPerPage).toBe(0);
  expect(requests[1]).toMatchObject({ hitsPerPage: 24, page: 2, indexName: 'produtos_mercado_livre_price_asc' });
  expect(requests[1].facetFilters).toEqual([['categoryName:Eletrônicos'], ['store:KaBuM BR'], ['brand:São José']]);
});
it('popular fallback loads only eight products', async () => {
  const fetch = setup();
  await popularSearchProductsQuery().queryFn?.({} as never);
  expect(fetch).toHaveBeenCalledOnce();
  expect(JSON.parse((fetch.mock.calls[0] as unknown as [string, { body: string }])[1].body).requests[0].hitsPerPage).toBe(8);
});