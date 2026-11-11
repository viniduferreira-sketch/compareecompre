import { queryOptions } from '@tanstack/react-query';
import { liteClient } from 'algoliasearch/lite';
import { publicShowcases } from './home-showcases.functions';
import { categoryBySlug } from './category-pages';
import { selectShowcase } from './home-showcases';
import { RELATED_VISIBILITY, type RelatedHit } from './related-products';
import { selectVisibleOffers } from './offer-freshness';
import { getPublicStores } from './partner-stores.functions';
export const homeShowcasesQuery = () => queryOptions({
  queryKey:['home-showcases'], staleTime:300000,
  queryFn:async () => {
    const [showcases,stores]=await Promise.all([publicShowcases(),getPublicStores()]);
    if(!showcases.length)return [];
    const app=import.meta.env['VITE_LOVABLE_CONNECTOR_ALGOLIA_APPLICATION_ID'];
    const key=import.meta.env['VITE_LOVABLE_CONNECTOR_ALGOLIA_PUBLIC_API_KEY'];
    if(!app || !key)return [];
    const queries=showcases.flatMap(showcase=>(showcase.terms.length ? showcase.terms : ['']).map(query=>({showcase,query})));
    try {
      const response=await liteClient(app,key).searchForHits<RelatedHit>({requests:queries.map(({showcase,query})=>({
        indexName:'produtos_mercado_livre',query,hitsPerPage:200,distinct:1,
        facetFilters:[`categoryName:${categoryBySlug(showcase.category_slug)?.name ?? ''}`],
        filters:RELATED_VISIBILITY, typoTolerance:false,
        attributesToRetrieve:['objectID','title','imageUrl','store','merchant_name','loja','price','originalPrice','discountPercent','freeShipping','affiliateUrl','aw_deep_link','categoryName','category','source','status','last_synced_at','group_key','popularity_score','storeLogoUrl'],
      }))});
      return showcases.map(showcase=>{
        const hits=response.results.flatMap((result,index)=>queries[index]?.showcase.id===showcase.id ? result.hits : []);
        const publicHits=hits.filter(hit=>Object.hasOwn(stores,hit.store ?? hit.merchant_name ?? hit.loja ?? '') || hit.store==='Mercado Livre');
        return {...showcase,hits:selectShowcase(selectVisibleOffers(publicHits),categoryBySlug(showcase.category_slug)?.name ?? '')};
      }).filter(showcase=>showcase.hits.length>=4);
    }catch(error){console.error('Vitrines indisponíveis',error);return [];}
  },
});