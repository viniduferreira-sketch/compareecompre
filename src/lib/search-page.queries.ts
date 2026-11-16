import { queryOptions } from '@tanstack/react-query';
import { categorySlug } from './category-pages';
import { selectCatalog, uniqueCatalog, DEALS_PAGE_SIZE, type CatalogSearch } from './catalog-pages';
import { relatedOffer } from './related-products';
import { searchPublicProducts } from './public-product-search';

export const popularSearchProductsQuery = () => queryOptions({
  queryKey: ['search-popular-products'], staleTime: 300000,
  queryFn: async () => uniqueCatalog(selectCatalog((await searchPublicProducts({ limit: 8 })).hits, false)),
});

export const searchPageQuery = (search: CatalogSearch) => queryOptions({
  queryKey: ['paged-public-search', search], staleTime: 300000,
  queryFn: async () => {
    const base = { query: search.q ?? '', priceOrder: search.ordem === 'menor-preco', facets: ['store', 'brand'] };
    const facetFilters: string[][] = [];
    // URL slugs resolve to the real facet values, including accents and BR suffixes.
    if (search.loja || search.marca) {
      const facets = (await searchPublicProducts({ ...base, limit: 0 })).facets;
      for (const [id, slug] of [['store', search.loja], ['brand', search.marca]] as const) {
        if (!slug) continue;
        const values = Object.keys(facets?.[id] ?? {}).filter(value => categorySlug(value) === slug || categorySlug(value).replace(/-br$/, '') === slug);
        facetFilters.push((values.length ? values : [slug]).map(value => `${id}:${value}`));
      }
    }
    if (search.frete) facetFilters.push([`freeShipping:${search.frete}`]);
    const page = (search.pagina ?? 1) - 1;
    const result = await searchPublicProducts({ ...base, page, limit: DEALS_PAGE_SIZE, facetFilters });
    return {
      offers: uniqueCatalog(selectCatalog(result.hits, false)).map(relatedOffer),
      availableFilters: (['store', 'brand'] as const).map(id => ({
        id, name: id === 'store' ? 'Loja' : 'Marca',
        values: Object.entries(result.facets?.[id] ?? {}).sort((a, b) => b[1] - a[1]).map(([value, results]) => ({ id: value, name: value, results })),
      })),
      paging: { total: result.nbHits ?? 0, limit: DEALS_PAGE_SIZE, offset: page * DEALS_PAGE_SIZE },
    };
  },
});