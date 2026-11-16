import { afterEach, expect, it, vi } from 'vitest';
import { publicSearchClient } from './algolia-public';

afterEach(() => vi.unstubAllGlobals());

it('searches with Fetch without XMLHttpRequest in the SSR runtime', async () => {
  vi.stubGlobal('XMLHttpRequest', undefined);
  const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [{ hits: [{ objectID: 'camera-1', price: 279.9 }], nbHits: 1 }] }), { status: 200 }));
  vi.stubGlobal('fetch', request);
  const result = await publicSearchClient('test-app', 'public-search-key').searchForHits({ requests: [{ indexName: 'produtos_mercado_livre', query: 'camera de seguranca' }] });
  expect(result.results[0]?.hits[0]?.objectID).toBe('camera-1');
  expect(request).toHaveBeenCalledOnce();
  expect(JSON.parse(request.mock.calls[0]?.[1].body).requests[0].query).toBe('camera de seguranca');
});