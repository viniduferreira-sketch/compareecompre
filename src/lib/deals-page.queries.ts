import { queryOptions } from '@tanstack/react-query';
import { categoryBySlug, categorySlug } from './category-pages';
import { actualDiscount, DEALS_MIN_DISCOUNT, DEALS_MIN_PRICE, DEALS_PAGE_SIZE, orderCatalog, selectCatalog, uniqueCatalog, type CatalogSearch } from './catalog-pages';
import { relatedOffer } from './related-products';
import { searchPublicProducts } from './public-product-search';

/** One bounded page plus zero-hit facets; never scan the catalog on SSR. */
export const dealsPageQuery = (search: CatalogSearch) => queryOptions({
  queryKey: ['paged-public-deals', search], staleTime: 300000,
  queryFn: async () => {
    const base = {
      filters: `price >= ${DEALS_MIN_PRICE} AND discountPercent >= ${DEALS_MIN_DISCOUNT}`,
      priceOrder: search.ordem === 'menor-preco', facets: ['store', 'brand'],
    };
    const facetFilters: string[][] = [];
    if (search.categoria) facetFilters.push([`categoryName:${categoryBySlug(search.categoria)?.name ?? search.categoria}`]);
    if (search.frete) facetFilters.push([`freeShipping:${search.frete}`]);
    // Resolve URL slugs using real facet values without retrieving products.
    if (search.loja || search.marca) {
      const { facets } = await searchPublicProducts({ ...base, facetFilters, limit: 0 });
      for (const [id, slug] of [['store', search.loja], ['brand', search.marca]] as const) {
        if (!slug) continue;
        const values = Object.keys(facets?.[id] ?? {}).filter(value => categorySlug(value) === slug || categorySlug(value).replace(/-br$/, '') === slug);
        facetFilters.push((values.length ? values : [slug]).map(value => `${id}:${value}`));
      }
    }
    const page = (search.pagina ?? 1) - 1;
    const result = await searchPublicProducts({ ...base, facetFilters, page, limit: DEALS_PAGE_SIZE });
    return {
      offers: orderCatalog(uniqueCatalog(selectCatalog(result.hits, true)), search.ordem ?? 'maior-desconto')
        .map(hit => relatedOffer({ ...hit, discountPercent: Math.round(actualDiscount(hit)) })),
      availableFilters: (['store', 'brand'] as const).map(id => ({
        id, name: id === 'store' ? 'Loja' : 'Marca',
        values: Object.entries(result.facets?.[id] ?? {}).sort((a, b) => b[1] - a[1]).map(([value, results]) => ({ id: value, name: value, results })),
      })),
      paging: { total: result.nbHits ?? 0, limit: DEALS_PAGE_SIZE, offset: page * DEALS_PAGE_SIZE },
    };
  },
});