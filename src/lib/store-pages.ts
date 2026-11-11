import { categorySlug, categorySearch, type CategorySearch } from './category-pages';
import type { PublicStoreIdentity } from './monitored-stores';
import { RELATED_VISIBILITY, type RelatedHit } from './related-products';
import { catalogResult } from './catalog-pages.queries';

export const storeSlug = (name: string) => categorySlug(name).replace(/-br$/, '');
export function storeDisplayName(name: string) { const clean = name.replace(/\s+BR$/i, ''); return storeSlug(clean) === 'kabum' ? 'KaBuM' : storeSlug(clean) === 'adidas' ? 'Adidas' : clean; }
export const STORE_DESCRIPTIONS: Record<string,string> = {
 'mercado-livre':'Um dos maiores marketplaces da América Latina, com produtos de vendedores de todo o Brasil. Aqui mostramos as ofertas que passam pelos nossos filtros de qualidade.',
 kabum:'Loja especializada em tecnologia e games, com foco em hardware, periféricos, notebooks e eletrônicos.',
 nike:'Loja oficial da Nike no Brasil, com tênis, roupas e acessórios esportivos.',
 adidas:'Loja oficial da Adidas no Brasil, com tênis, roupas e acessórios esportivos.',
};
export function storeDescription(store: PublicStoreIdentity) { const name=storeDisplayName(store.name); return store.description?.trim() || STORE_DESCRIPTIONS[storeSlug(store.name)] || `Compare os preços da ${name} com os de outras lojas e vá direto ao site da loja para comprar.`; }
export function resolveStore(identities:Record<string,PublicStoreIdentity>,slug:string) {
 const rows=Object.entries(identities).filter(([,s])=>storeSlug(s.name)===slug);
 if(!rows.length)return null;
 const first=rows[0];if(!first)return null;
 return {...first[1],name:storeDisplayName(first[1].name),slug,searchNames:rows.map(([name])=>name)};
}
export type StorePageSearch=CategorySearch & {categoria?:string|undefined;min?:string|undefined;max?:string|undefined};
export function storePageSearch(s:Record<string,unknown>):StorePageSearch{ return {...categorySearch(s),categoria:typeof s['categoria']==='string'?s['categoria']:undefined,min:typeof s['min']==='string'||typeof s['min']==='number'?String(s['min']):undefined,max:typeof s['max']==='string'||typeof s['max']==='number'?String(s['max']):undefined}; }
export function storeHref(slug:string,s:StorePageSearch={}) {const p=new URLSearchParams();for(const [k,v] of Object.entries(s))if(v!==undefined&&v!==''&&!(k==='pagina'&&v===1))p.set(k,String(v));return `/loja/${slug}${p.size?'?'+p:''}`;}
export function storeCanonical(slug:string,s:StorePageSearch){return 'https://compareecompre.com'+storeHref(slug,{pagina:s.pagina});}
export function storeCatalog(hits:RelatedHit[],searchNames:string[],search:StorePageSearch){
 const records=hits.filter(h=>searchNames.includes(h.store??h.merchant_name??''));
 const min=Number(search.min),max=Number(search.max);
 const priced=records.filter(h=>(!search.min||!Number.isFinite(min)||h.price>=Math.max(0,min))&&(!search.max||!Number.isFinite(max)||h.price<=Math.max(0,max)));
 const ordered=search.ordem==='maior-preco'?[...priced].sort((a,b)=>b.price-a.price):priced;
 const result=catalogResult(ordered,{...search,ordem:search.ordem==='maior-preco'?'mais-populares':search.ordem},false);
 if(search.ordem==='maior-preco'){
  const all=catalogResult(priced,{...search,pagina:1},false);
  // Reuse filtering and visibility before descending price, never reverse just a page.
  const selected=filterStoreRows(priced,search).sort((a,b)=>b.price-a.price||a.objectID.localeCompare(b.objectID));
  result.offers=selected.slice(((search.pagina??1)-1)*24,(search.pagina??1)*24).map(relatedOffer);
  result.paging.total=all.paging.total;
 }
 const categories=new Map<string,number>();for(const h of priced){if(h.categoryName)categories.set(h.categoryName,(categories.get(h.categoryName)??0)+1);}
 return {...result,availableFilters:[{id:'categoryName',name:'Categoria',values:[...categories].map(([name,results])=>({id:name,name,results}))},...result.availableFilters.filter(f=>f.id!=='store')]};
}
import { filterCatalog, selectCatalog, uniqueCatalog } from './catalog-pages';
import { relatedOffer } from './related-products';
function filterStoreRows(hits:RelatedHit[],search:StorePageSearch){return uniqueCatalog(filterCatalog(selectCatalog(hits,false),search));}
export { RELATED_VISIBILITY };