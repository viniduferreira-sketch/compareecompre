import { queryOptions } from '@tanstack/react-query';
import { liteClient } from 'algoliasearch/lite';
import { publicShowcases } from './home-showcases.functions';
import { categoryBySlug } from './category-pages';
import { selectShowcase } from './home-showcases';
import { RELATED_VISIBILITY, type RelatedHit } from './related-products';
import { selectVisibleOffers } from './offer-freshness';
import { getPublicStores } from './partner-stores.functions';
import { normalizeRailText } from './rail-products';
export const homeShowcasesQuery = () => queryOptions({
  queryKey:['home-showcases'], staleTime:300000,
  queryFn:async () => {
    const [showcases,stores]=await Promise.all([publicShowcases(),getPublicStores()]);
    if(!showcases.length)return [];
    const app=import.meta.env['VITE_LOVABLE_CONNECTOR_ALGOLIA_APPLICATION_ID'];
    const key=import.meta.env['VITE_LOVABLE_CONNECTOR_ALGOLIA_PUBLIC_API_KEY'];
    if(!app || !key)return [];
    const queries=showcases.flatMap(showcase=>{
      const priority=showcase.category_slug==='casa'?['Mercado Livre','Friopeças','NutriBullet','Brinox']:showcase.category_slug==='games'?['Mercado Livre','Kabum BR','Shopinfo','PCYES']:['Mercado Livre','Kabum BR','Nike BR','adidas BR','Friopeças','NutriBullet','Shopinfo','Brinox'];
      const merchants=showcase.stores.length ? Object.keys(stores).filter(name=>showcase.stores.some(store=>normalizeRailText(store)===normalizeRailText(name))) : [...new Set([...priority.filter(name=>name==='Mercado Livre'||Object.hasOwn(stores,name)),...Object.keys(stores)])].slice(0,showcase.terms.length?4:12);
      return merchants.flatMap(store=>(showcase.terms.length ? showcase.terms : ['']).map(query=>({showcase,query,store})));
    });
    if(!queries.length)return [];
    try {
      const response=await liteClient(app,key).searchForHits<RelatedHit>({requests:queries.map(({showcase,query,store})=>({
        indexName:'produtos_mercado_livre',query,hitsPerPage:60,distinct:1,
        facetFilters:[`store:${store}`,...(showcase.category_slug==='all'?[]:[`categoryName:${categoryBySlug(showcase.category_slug)?.name ?? ''}`])],
        filters:RELATED_VISIBILITY+(showcase.min_price!==null?` AND price >= ${showcase.min_price}`:'')+(showcase.max_price!==null?` AND price <= ${showcase.max_price}`:''), typoTolerance:false,
        attributesToRetrieve:['objectID','title','imageUrl','store','merchant_name','loja','price','originalPrice','discountPercent','freeShipping','affiliateUrl','aw_deep_link','categoryName','category','source','status','last_synced_at','group_key','popularity_score','storeLogoUrl'],
      }))});
      return showcases.map(showcase=>{
        const hits=response.results.flatMap((result,index)=>queries[index]?.showcase.id===showcase.id ? selectVisibleOffers(result.hits) : []);
        const publicHits=hits.filter(hit=>Object.hasOwn(stores,hit.store ?? hit.merchant_name ?? hit.loja ?? '') || hit.store==='Mercado Livre');
        return {...showcase,hits:selectShowcase(publicHits,categoryBySlug(showcase.category_slug)?.name ?? '',showcase)};
      }).filter(showcase=>showcase.hits.length>=4);
    }catch(error){console.error('Vitrines indisponíveis',error);return [];}
  },
});