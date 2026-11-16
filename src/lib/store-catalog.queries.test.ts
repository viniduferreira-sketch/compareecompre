import { afterEach, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { pagedStoreCatalogQuery, storeGuideCategories } from './store-catalog.queries';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
function setup() {
  vi.stubEnv('VITE_LOVABLE_CONNECTOR_ALGOLIA_APPLICATION_ID', 'store-test');
  vi.stubEnv('VITE_LOVABLE_CONNECTOR_ALGOLIA_PUBLIC_API_KEY', 'public');
  const fetch = vi.fn(async () => new Response(JSON.stringify({ results: [{ hits: [], nbHits: 50000,
    facets: { productType: { 'Tênis': 3000, Camisetas: 1000 }, audience: { Feminino: 2000 }, brand: { Nike: 50000 }, categoryName: { Moda: 49000, Games: 1000 } } }] }), { status: 200 }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}
it('requests page 2 with only 24 store hits and zero metadata hits even for 50000 products', async () => {
  const fetch = setup();
  const result = await pagedStoreCatalogQuery(new QueryClient(), ['Nike BR'], { pagina: 2 }).queryFn?.({} as never);
  expect(result?.paging).toEqual({ total: 50000, limit: 24, offset: 24 });
  const requests = fetch.mock.calls.map(call => JSON.parse((call as unknown as [string, { body: string }])[1].body).requests[0]);
  expect(requests.map(r => r.hitsPerPage)).toEqual([0, 24]);
  expect(requests[1]).toMatchObject({ page: 1, distinct: 1, facetFilters: [['store:Nike BR']] });
  expect(result?.availableFilters.some(f => f.id === 'brand')).toBe(false);
});
it('filters by exact indexed type/audience and prices before pagination; disjunctive facets retrieve no hits', async () => {
  const fetch = setup();
  await pagedStoreCatalogQuery(new QueryClient(), ['Nike BR'], { tipo: 'tenis', publico: 'feminino', min: '150', max: '600', ordem: 'maior-preco' }).queryFn?.({} as never);
  const requests = fetch.mock.calls.map(call => JSON.parse((call as unknown as [string, { body: string }])[1].body).requests[0]);
  expect(requests.map(r => r.hitsPerPage)).toEqual([0, 24, 0, 0]);
  expect(requests[1].facetFilters).toEqual([['store:Nike BR'], ['productType:Tênis'], ['audience:Feminino']]);
  expect(requests[1].filters).toContain('price >= 150 AND price <= 600');
  expect(requests[1].indexName).toBe('produtos_mercado_livre_price_desc');
  expect(requests[2].facetFilters).toEqual([['store:Nike BR'], ['audience:Feminino']]);
});
it('uses the two predominant store category counts, not the current page, for guides', () => {
  expect(storeGuideCategories({ categoryName: { Moda: 3055, Games: 12, Casa: 2 } })).toEqual(['moda-e-esporte', 'games']);
  expect(storeGuideCategories({ categoryName: { Brinquedos: 800 } })).toEqual([]);
});