import { queryOptions } from '@tanstack/react-query';
import { notFound } from '@tanstack/react-router';
import { getPublicStores } from './partner-stores.functions';
import { resolveStore, type StorePageSearch } from './store-pages';
import type { QueryClient } from '@tanstack/react-query';
import { pagedStoreCatalogQuery, storeCatalogMetadataQuery, storeGuideCategories } from './store-catalog.queries';
import { storeBuyingGuidesQuery } from './store-buying-guides.functions';
import { showCategoryContent } from './category-content';
export const publicStorePagesQuery=()=>queryOptions({queryKey:['public-store-pages'],queryFn:()=>getPublicStores(),staleTime:60000});
export const storePageQuery=(client:QueryClient,slug:string,search:StorePageSearch)=>queryOptions({
 queryKey:['store-page-paged-v2',slug,search],staleTime:300000,
 queryFn:async()=>{
  const identities=await client.ensureQueryData(publicStorePagesQuery());
  const store=resolveStore(identities,slug);if(!store)throw notFound();
  const metadata=await client.ensureQueryData(storeCatalogMetadataQuery(store.searchNames));
  const [result,guides]=await Promise.all([
   client.ensureQueryData(pagedStoreCatalogQuery(client,store.searchNames,search)),
   showCategoryContent(search.pagina)?client.ensureQueryData(storeBuyingGuidesQuery(storeGuideCategories(metadata.facets))):Promise.resolve([]),
  ]);
  return {store,result,guides,count:metadata.nbHits??0};
 }
});