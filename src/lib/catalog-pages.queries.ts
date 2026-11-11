import { queryOptions } from '@tanstack/react-query';
import { liteClient } from 'algoliasearch/lite';
import { RELATED_VISIBILITY, relatedOffer, type RelatedHit } from './related-products';
import { actualDiscount, filterCatalog, orderCatalog, selectCatalog, uniqueCatalog, DEALS_PAGE_SIZE, type CatalogSearch } from './catalog-pages';

const INDEX = 'produtos_mercado_livre';
// Search-only credentials; this module runs directly in the browser and SSR Query loader.
async function readCatalog(q: string, deals: boolean) {
  const app = import.meta.env['VITE_LOVABLE_CONNECTOR_ALGOLIA_APPLICATION_ID'];
  const key = import.meta.env['VITE_LOVABLE_CONNECTOR_ALGOLIA_PUBLIC_API_KEY'];
  if (!app || !key) throw new Error('A busca não está configurada.');
  const client = liteClient(app, key);
  const read = async (min: number, max: number, depth = 0): Promise<RelatedHit[]> => {
    const { results } = await client.searchForHits<RelatedHit>({ requests: [{ indexName: INDEX, query: q.slice(0, 120), distinct: 1, hitsPerPage: 1000, filters: `${RELATED_VISIBILITY} AND price >= ${min} AND price < ${max}${deals ? ' AND discountPercent >= 10' : ''}` }] });
    const result = results[0];
    if (!result) throw new Error('Não foi possível carregar as ofertas.');
    if ((result.nbHits ?? 0) > result.hits.length) {
      if (depth >= 32 || max - min < 0.001) {
        // Split equal-price catalogs by store, not by privileged browse access.
        const { results: facets } = await client.searchForHits<RelatedHit>({ requests: [{ indexName: INDEX, query: q.slice(0, 120), hitsPerPage: 0, facets: ['store'], maxValuesPerFacet: 1000, filters: `${RELATED_VISIBILITY} AND price >= ${min} AND price < ${max}${deals ? ' AND discountPercent >= 10' : ''}` }] });
        const stores = Object.keys(facets[0]?.facets?.['store'] ?? {});
        const records = await Promise.all(stores.map(async store => {
          const { results: rows } = await client.searchForHits<RelatedHit>({ requests: [{ indexName: INDEX, query: q.slice(0, 120), distinct: 1, hitsPerPage: 1000, filters: `${RELATED_VISIBILITY} AND price >= ${min} AND price < ${max}${deals ? ' AND discountPercent >= 10' : ''}`, facetFilters: [[`store:${store}`]] }] });
          const row = rows[0];
          if (!row || (row.nbHits ?? 0) > row.hits.length) throw new Error('Há muitas ofertas nesta seleção. Tente uma busca mais específica.');
          return row.hits;
        }));
        return records.flat();
      }
      const mid = Math.round((min + max) / 2 * 10000) / 10000;
      const left = await read(min, mid, depth + 1), right = await read(mid, max, depth + 1);
      return [...left, ...right];
    }
    return result.hits;
  };
  const boundaries = deals ? [30, 100, 300, 1000, 3000, 10000, 100000, 1e12] : [0, 100, 300, 1000, 3000, 10000, 100000, 1e12];
  const rows = [] as RelatedHit[];
  for (let i = 0; i < boundaries.length - 1; i++) rows.push(...await read(boundaries[i] ?? 0, boundaries[i + 1] ?? 1e12));
  return uniqueCatalog(selectCatalog(rows, deals));
}
export const catalogSourceQuery = (q = '', _deals = false) => queryOptions({ queryKey: ['public-catalog-source', q], queryFn: () => readCatalog(q, false), staleTime: 5 * 60 * 1000 });
export function catalogResult(hits: RelatedHit[], search: CatalogSearch, deals: boolean) {
  const eligible = selectCatalog(hits, deals);
  const selected = filterCatalog(eligible, search);
  const ordered = uniqueCatalog(orderCatalog(selected, search.ordem ?? (deals ? 'maior-desconto' : 'mais-populares')));
  const page = search.pagina ?? 1;
  const availableFilters = (['store', 'brand'] as const).map(id => {
    const counts = new Map<string, number>();
    for (const hit of filterCatalog(eligible, { ...search, loja: id === 'store' ? undefined : search.loja, marca: id === 'brand' ? undefined : search.marca })) { const value = hit[id]; if (value) counts.set(value, (counts.get(value) ?? 0) + 1); }
    return { id, name: id === 'store' ? 'Loja' : 'Marca', values: [...counts].sort((a, b) => b[1] - a[1]).map(([value, results]) => ({ id: value, name: value, results })) };
  });
  return { offers: ordered.slice((page - 1) * DEALS_PAGE_SIZE, page * DEALS_PAGE_SIZE).map(hit => relatedOffer({ ...hit, discountPercent: deals ? Math.round(actualDiscount(hit)) : hit.discountPercent ?? null })), availableFilters, paging: { total: ordered.length, limit: DEALS_PAGE_SIZE, offset: (page - 1) * DEALS_PAGE_SIZE } };
}