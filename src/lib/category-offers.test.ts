import {describe,it,expect,vi} from 'vitest';
vi.mock('./search-offers',()=>({searchOffers:vi.fn()}));
import {searchOffers} from './search-offers';
import {categoryOffersQuery} from './category-offers.queries';
describe('Category catalog requests',()=>{
 it('resolves brand and store slugs while preserving category and page',async()=>{
  const result={offers:[],availableFilters:[{id:'brand',name:'Marca',values:[{id:'Mondial',name:'Mondial',results:4}]},{id:'store',name:'Loja',values:[{id:'Kabum BR',name:'Kabum BR',results:5}]}],paging:{total:5,offset:0,limit:40}};
  vi.mocked(searchOffers).mockResolvedValue(result);
  const options=categoryOffersQuery('casa',{marca:'mondial',loja:'kabum',ordem:'menor-preco',pagina:2});
  if(typeof options.queryFn!=='function')throw new Error('Missing category query');
  await options.queryFn({queryKey:options.queryKey,signal:new AbortController().signal,meta:undefined,client:{} as never});
  expect(searchOffers).toHaveBeenLastCalledWith({data:{query:'',filters:[{id:'categoryName',value:'Casa'},{id:'brand',value:'Mondial'},{id:'store',value:'Kabum BR'}],sort:'price_asc',offset:40}});
 });
});