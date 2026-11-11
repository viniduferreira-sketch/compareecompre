import {queryOptions} from '@tanstack/react-query';
import {searchOffers} from './search-offers';
import {categoryBySlug,categorySlug,categorySort,type CategorySearch} from './category-pages';
import {notFound} from '@tanstack/react-router';
export const categoryOffersQuery=(slug:string,search:CategorySearch)=>queryOptions({
 queryKey:['category-offers',slug,search],staleTime:60000,
 queryFn:async()=>{
  const category=categoryBySlug(slug);if(!category)throw notFound();
  const baseFilter={id:'categoryName',value:category.name};
  const base=await searchOffers({data:{query:'',filters:[baseFilter],sort:categorySort(search.ordem),offset:!search.marca&&!search.loja&&!search.frete?((search.pagina??1)-1)*40:0}});
  const filters:Array<{id:string;value:string}>=[baseFilter];
  for(const [key,id] of [['marca','brand'],['loja','store']] as const){const value=search[key];if(value){const facet=base.availableFilters.find(f=>f.id===id)?.values.find(v=>categorySlug(v.id)===categorySlug(value)||categorySlug(v.id).replace(/-br$/,'')===categorySlug(value));filters.push({id,value:facet?.id??value});}}
  if(search.frete)filters.push({id:'freeShipping',value:search.frete});
  const result=filters.length>1?await searchOffers({data:{query:'',filters,sort:categorySort(search.ordem),offset:((search.pagina??1)-1)*40}}):base;
  return {...result,category};
 }
});