import { categorySlug, categorySearch, type CategorySearch } from './category-pages';
import type { PublicStoreIdentity } from './monitored-stores';
import { RELATED_VISIBILITY, type RelatedHit } from './related-products';
import { classifyStoreProduct } from './store-product-filters';
import { filterCatalog, orderCatalog, selectCatalog, uniqueCatalog } from './catalog-pages';
import { relatedOffer } from './related-products';
import { categoryBySlug } from './category-pages';

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
export type StorePageSearch=CategorySearch & {categoria?:string|undefined;tipo?:string|undefined;publico?:string|undefined;min?:string|undefined;max?:string|undefined};
export function storePageSearch(s:Record<string,unknown>):StorePageSearch{ return {...categorySearch(s),tipo:typeof s['tipo']==='string'?s['tipo']:undefined,publico:typeof s['publico']==='string'?s['publico']:undefined,categoria:typeof s['categoria']==='string'?s['categoria']:undefined,min:typeof s['min']==='string'||typeof s['min']==='number'?String(s['min']):undefined,max:typeof s['max']==='string'||typeof s['max']==='number'?String(s['max']):undefined}; }
export function storeHref(slug:string,s:StorePageSearch={}) {const p=new URLSearchParams();for(const [k,v] of Object.entries(s))if(v!==undefined&&v!==''&&!(k==='pagina'&&v===1))p.set(k,String(v));return `/loja/${slug}${p.size?'?'+p:''}`;}
export function storeCanonical(slug:string,s:StorePageSearch){return 'https://compareecompre.com'+storeHref(slug,{pagina:s.pagina});}
export function storeCatalog(hits:RelatedHit[],searchNames:string[],search:StorePageSearch){
 const records=selectCatalog(hits.filter(h=>searchNames.includes(h.store??h.merchant_name??'')),false).map(h=>({...h,...classifyStoreProduct(h)}));
 const matches=(value:string|null|undefined,wanted:string|undefined)=>!wanted||categorySlug(value??'')===categorySlug(wanted);
 const select=(omit?:'productType'|'audience'|'brand')=>uniqueCatalog(filterCatalog(records,{...search,marca:omit==='brand'?undefined:search.marca,categoria:undefined}).filter(h=>
  (!search.categoria||h.categoryName===categoryBySlug(search.categoria)?.name)&&
  (omit==='productType'||matches(h.productType,search.tipo))&&
  (omit==='audience'||!search.publico||h.audience?.some(a=>matches(a,search.publico)))&&
  (!search.min||!Number.isFinite(Number(search.min))||h.price>=Math.max(0,Number(search.min)))&&
  (!search.max||!Number.isFinite(Number(search.max))||h.price<=Math.max(0,Number(search.max)))
 ));
 const selected=select();
 const ordered=search.ordem==='maior-preco'?[...selected].sort((a,b)=>b.price-a.price||a.objectID.localeCompare(b.objectID)):orderCatalog(selected,search.ordem);
 const page=search.pagina??1;
 const availableFilters=(['productType','audience','brand'] as const).flatMap(id=>{
  // A brand filter is useful only when the entire store has multiple real brands.
  if(id==='brand'&&new Set(records.map(h=>categorySlug(h.brand??'')).filter(Boolean)).size<=1)return [];
  const counts=new Map<string,number>();
  for(const h of select(id))for(const value of id==='audience'?(h.audience??[]):[h[id]])if(value)counts.set(value,(counts.get(value)??0)+1);
  return counts.size?[{id,name:id==='productType'?'Tipo de produto':id==='audience'?'Público':'Marca',values:[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'pt-BR')).map(([name,results])=>({id:name,name,results}))}]:[];
 });
 return {offers:ordered.slice((page-1)*24,page*24).map(relatedOffer),availableFilters,paging:{total:ordered.length,limit:24,offset:(page-1)*24}};
}
export { RELATED_VISIBILITY };
