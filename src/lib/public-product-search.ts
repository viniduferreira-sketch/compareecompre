import { publicSearchClient } from './algolia-public';
import { RELATED_VISIBILITY, type RelatedHit } from './related-products';

export const PUBLIC_PRODUCT_INDEX = 'produtos_mercado_livre';
export const PUBLIC_PRODUCT_ATTRIBUTES = ['objectID','title','price','originalPrice','discountPercent','imageUrl','store','merchant_name','loja','source','categoryName','category','brand','productType','audience','popularity_score','group_key','last_synced_at','affiliateUrl','aw_deep_link','storeLogoUrl','merchant_logo','store_logo','freeShipping','status','quality_status','site_hidden','price_review_status'];

/** Bounded public-key requests: never recursively load or serialize the whole catalog. */
export async function searchPublicProducts(options: {
  query?: string; page?: number; limit?: number; priceOrder?: boolean; priceDescending?: boolean;
  filters?: string; facetFilters?: string[][]; facets?: string[];
}) {
  const app = import.meta.env['VITE_LOVABLE_CONNECTOR_ALGOLIA_APPLICATION_ID'];
  const key = import.meta.env['VITE_LOVABLE_CONNECTOR_ALGOLIA_PUBLIC_API_KEY'];
  if (!app || !key) throw new Error('A busca não está configurada.');
  const { results } = await publicSearchClient(app, key).searchForHits<RelatedHit>({ requests: [{
    indexName: PUBLIC_PRODUCT_INDEX + (options.priceDescending ? '_price_desc' : options.priceOrder ? '_price_asc' : ''),
    query: (options.query ?? '').trim().slice(0, 120),
    page: options.page ?? 0, hitsPerPage: Math.max(0, Math.min(100, options.limit ?? 24)),
    distinct: 1, facetingAfterDistinct: true,
    filters: [RELATED_VISIBILITY, options.filters].filter(Boolean).join(' AND '),
    ...(options.facetFilters?.length ? { facetFilters: options.facetFilters } : {}),
    facets: options.facets ?? [], maxValuesPerFacet: 1000,
    attributesToRetrieve: PUBLIC_PRODUCT_ATTRIBUTES,
    // Do not turn a missing phrase into unrelated products by dropping its words.
    removeWordsIfNoResults: 'none',
  }] });
  const result = results[0];
  if (!result) throw new Error('Não foi possível carregar os produtos.');
  return result;
}