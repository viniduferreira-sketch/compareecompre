import { queryOptions } from '@tanstack/react-query';
import { notFound } from '@tanstack/react-router';
import { getPublicStores } from './partner-stores.functions';
import { catalogSourceQuery } from './catalog-pages.queries';
import { resolveStore, storeCatalog, type StorePageSearch } from './store-pages';
import type { QueryClient } from '@tanstack/react-query';
import { storeBuyingCategories } from './store-buying-guides';
import { storeBuyingGuidesQuery } from './store-buying-guides.functions';
import { showCategoryContent } from './category-content';
export const publicStorePagesQuery=()=>queryOptions({queryKey:['public-store-pages'],queryFn:()=>getPublicStores(),staleTime:60000});
export const storePageQuery=(client:QueryClient,slug:string,search:StorePageSearch)=>queryOptions({
 queryKey:['store-page',slug,search],staleTime:60000,
 queryFn:async()=>{
  const identities=await client.ensureQueryData(publicStorePagesQuery());
  const store=resolveStore(identities,slug);if(!store)throw notFound();
  const hits=await client.ensureQueryData(catalogSourceQuery());
  const result=storeCatalog(hits,store.searchNames,search);
  const guides=showCategoryContent(search.pagina)?await client.ensureQueryData(storeBuyingGuidesQuery(storeBuyingCategories(hits,store.searchNames))):[];
  return {store,result,guides,count:storeCatalog(hits,store.searchNames,{}).paging.total};
 }
});