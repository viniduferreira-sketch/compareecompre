import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { categoryBySlug, categorySlug } from './category-pages';
import { CATEGORY_BLOG_SLUGS } from './category-content';
import { searchPublicProducts } from './public-product-search';
import { relatedOffer } from './related-products';
import { selectCatalog, uniqueCatalog } from './catalog-pages';
import type { StorePageSearch } from './store-pages';

const FACETS = ['productType', 'audience', 'brand', 'categoryName'];
const storeFacets = (names: string[]) => [names.map(name => `store:${name}`)];

/** Facets/counts contain no product records and are reusable across every page/filter. */
export const storeCatalogMetadataQuery = (names: string[]) => queryOptions({
  queryKey: ['store-catalog-metadata', names], staleTime: 300000,
  queryFn: () => searchPublicProducts({ limit: 0, facetFilters: storeFacets(names), facets: FACETS }),
});

export function storeGuideCategories(facets: Record<string, Record<string, number>> = {}) {
  return [...new Set(Object.entries(facets['categoryName'] ?? {})
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2).flatMap(([name]) => CATEGORY_BLOG_SLUGS[categorySlug(name)] ?? []))];
}

export const pagedStoreCatalogQuery = (client: QueryClient, names: string[], search: StorePageSearch) => queryOptions({
  queryKey: ['paged-store-catalog', names, search], staleTime: 300000,
  queryFn: async () => {
    const metadata = await client.ensureQueryData(storeCatalogMetadataQuery(names));
    const selected = (['productType', 'audience', 'brand'] as const).flatMap(id => {
      const slug = id === 'productType' ? search.tipo : id === 'audience' ? search.publico : search.marca;
      if (!slug) return [];
      const values = Object.keys(metadata.facets?.[id] ?? {}).filter(value => categorySlug(value) === categorySlug(slug));
      return [{ id, values: (values.length ? values : [slug]).map(value => `${id}:${value}`) }];
    });
    const filters = [search.min && Number.isFinite(Number(search.min)) ? `price >= ${Math.max(0, Number(search.min))}` : '',
      search.max && Number.isFinite(Number(search.max)) ? `price <= ${Math.max(0, Number(search.max))}` : ''].filter(Boolean).join(' AND ');
    const fixed = storeFacets(names);
    if (search.categoria) fixed.push([`categoryName:${categoryBySlug(search.categoria)?.name ?? search.categoria}`]);
    if (search.frete) fixed.push([`freeShipping:${search.frete}`]);
    const page = (search.pagina ?? 1) - 1;
    const result = await searchPublicProducts({ page, limit: 24, filters, facets: FACETS,
      priceOrder: search.ordem === 'menor-preco', priceDescending: search.ordem === 'maior-preco',
      facetFilters: [...fixed, ...selected.map(s => s.values)] });
    // Disjunctive facets keep alternatives visible when their own filter is selected.
    const alternatives = await Promise.all(selected.map(async s => [s.id, (await searchPublicProducts({
      limit: 0, filters, facets: [s.id], facetFilters: [...fixed, ...selected.filter(other => other.id !== s.id).map(other => other.values)],
    })).facets?.[s.id] ?? {}] as const));
    const facets = { ...result.facets, ...Object.fromEntries(alternatives) };
    return {
      offers: uniqueCatalog(selectCatalog(result.hits, false)).map(relatedOffer),
      availableFilters: (['productType', 'audience', 'brand'] as const).flatMap(id => {
        if (id === 'brand' && Object.keys(metadata.facets?.['brand'] ?? {}).length <= 1) return [];
        const values = Object.entries(facets[id] ?? {}).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
          .map(([value, results]) => ({ id: value, name: value, results }));
        return values.length ? [{ id, name: id === 'productType' ? 'Tipo de produto' : id === 'audience' ? 'Público' : 'Marca', values }] : [];
      }),
      paging: { total: result.nbHits ?? 0, limit: 24, offset: page * 24 },
    };
  },
});