import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { Header } from '@/components/marketplace/Header';
import { SiteFooter } from '@/components/marketplace/SiteFooter';
import { StoreLogo } from '@/components/marketplace/StoreLogo';
import { SearchResults, type ActiveFilter } from '@/components/marketplace/OfferResults';
import { Button } from '@/components/ui/button';
import { storePageQuery } from '@/lib/store-pages.queries';
import { storePageSearch, storeCanonical, storeHref, storeDescription } from '@/lib/store-pages';
import { categorySlug } from '@/lib/category-pages';
import { CategoryEditorial } from '@/components/marketplace/CategoryEditorial';
import { showCategoryContent } from '@/lib/category-content';
import { storeHasProducts } from '@/lib/monitored-stores';

export const Route=createFileRoute('/loja/$slug')({
 staticData:{sitemap:true},validateSearch:storePageSearch,loaderDeps:({search})=>search,
 loader:({context,params,deps})=>context.queryClient.ensureQueryData(storePageQuery(context.queryClient,params.slug,deps)),
 head:({params,match,loaderData})=>{
  if(!loaderData)return {meta:[{title:'Loja não encontrada | Compare e Compre'},{name:'description',content:'Esta loja não está disponível.'},{property:'og:title',content:'Loja não encontrada | Compare e Compre'},{property:'og:description',content:'Esta loja não está disponível.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'},{name:'robots',content:'noindex'}]};
  const {store,count,result}=loaderData;let title=`${store.name}: ofertas e preços | Compare e Compre`;if(title.length>60)title=`${store.name}: ofertas e preços`;
  let description=`Compare preços e ofertas de ${store.name} com outras lojas. ${count} produtos monitorados, com filtros por categoria e marca. Vá direto ao site da loja para comprar.`;
  if(description.length>160)description=`Compare ofertas de ${store.name}. ${count} produtos monitorados, com filtros por categoria e marca. Compre direto na loja.`;
  const url=storeCanonical(params.slug,match.search),origin='https://compareecompre.com';
  return {meta:[{title},{name:'description',content:description.slice(0,160)},{property:'og:title',content:title},{property:'og:description',content:description.slice(0,160)},{property:'og:type',content:'website'},{property:'og:url',content:url},{name:'twitter:card',content:'summary_large_image'},...(!storeHasProducts(count)||(match.search.pagina??1)>1?[{name:'robots',content:'noindex, follow'}]:[])],links:[{rel:'canonical',href:url}],scripts:[{type:'application/ld+json',children:JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{name:'Início',item:origin},{name:'Lojas monitoradas',item:origin+'/lojas-monitoradas'},{name:store.name,item:origin+storeHref(params.slug)}].map((item,i)=>({'@type':'ListItem',position:i+1,...item}))})},{type:'application/ld+json',children:JSON.stringify({'@context':'https://schema.org','@type':'ItemList',itemListElement:result.offers.map((o,i)=>({'@type':'ListItem',position:((match.search.pagina??1)-1)*24+i+1,name:o.title,url:origin+'/produto/'+encodeURIComponent(o.id)}))})}]};
 },
 component:StorePage,
 errorComponent:()=>{const router=useRouter();return <main className="mx-auto max-w-3xl px-5 py-20"><h1 className="text-2xl font-bold">Não foi possível carregar a loja</h1><Button className="mt-5" onClick={()=>{void router.invalidate();}}>Tentar novamente</Button></main>;},
 notFoundComponent:()=> <div><Header initialTerm="" onSearch={()=>{}}/><main className="mx-auto max-w-3xl px-5 py-20"><h1 className="text-2xl font-bold">Loja não encontrada</h1><p className="mt-3 text-muted-foreground">Esta loja não existe ou não está disponível no site.</p><Button asChild className="mt-5"><Link to="/lojas-monitoradas">Ver lojas monitoradas</Link></Button></main><SiteFooter/></div>,
});
function StorePage(){
 const {slug}=Route.useParams(),search=Route.useSearch(),navigate=useNavigate({from:'/loja/$slug'}),client=useQueryClient();
 const {data:{store,result,count,guides}}=useSuspenseQuery(storePageQuery(client,slug,search));
 const active:ActiveFilter[]=[['productType',search.tipo],['audience',search.publico],['brand',search.marca]].flatMap(([id,value])=>id&&value?[{id,value:result.availableFilters.find(f=>f.id===id)?.values.find(v=>categorySlug(v.id)===value)?.id??value}]:[]);
 const update=(patch:Partial<typeof search>)=>{void navigate({params:{slug},search:prev=>({...prev,...patch})});};
 return <div className="min-h-screen bg-background"><Header initialTerm="" onSearch={()=>{}}/><main>
 <section className="mx-auto max-w-7xl px-5 pt-7 lg:px-8"><nav aria-label="Você está em" className="mb-6 flex flex-wrap gap-2 text-sm text-muted-foreground"><Link to="/">Início</Link><span>›</span><Link to="/lojas-monitoradas">Lojas monitoradas</Link><span>›</span><span>{store.name}</span></nav><div className="flex flex-wrap items-center gap-5 border-b border-border pb-6"><StoreLogo store={store.name} logoUrl={store.logo_url} className="h-20 w-32 text-xl"/><div className="min-w-0 flex-1"><p className="mb-2 text-xs font-semibold text-primary">Loja parceira</p><h1 className="font-display text-3xl font-bold">{store.name}</h1><p className="mt-2 text-sm text-muted-foreground">{count.toLocaleString('pt-BR')} produtos monitorados</p></div><p className="w-full max-w-3xl text-sm leading-7 text-muted-foreground">{storeDescription(store)}</p></div></section>
 <SearchResults headingLabel="Loja" headingLevel={2} term={`Produtos da ${store.name}`} offers={result.offers} filters={result.availableFilters} sort={search.ordem==='menor-preco'?'price_asc':search.ordem==='maior-preco'?'price_desc':'relevance'} page={search.pagina??1} total={result.paging.total} pageSize={24} isLoading={false} showStore collapsibleFilters filtersLabel="Filtrar produtos" activeFilters={active} categoryFilterHref={name=>storeHref(slug,{...search,categoria:search.categoria===categorySlug(name)?undefined:categorySlug(name),pagina:1})} onToggleFilter={f=>update({[f.id==='productType'?'tipo':f.id==='audience'?'publico':'marca']:active.some(a=>a.id===f.id&&a.value===f.value)?undefined:categorySlug(f.value),pagina:1})} onSort={sort=>update({ordem:sort==='price_asc'?'menor-preco':sort==='price_desc'?'maior-preco':'mais-populares',pagina:1})} onPage={pagina=>update({pagina})} pageHref={pagina=>storeHref(slug,{...search,pagina})} extraFilters={<form key={`${slug}-${search.min}-${search.max}`} className="space-y-3" onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);update({min:String(data.get('min')??'')||undefined,max:String(data.get('max')??'')||undefined,pagina:1});}}><h3 className="text-sm font-bold">Faixa de preço</h3><label className="block text-xs">De (R$)<input className="mt-1 w-full rounded-md border border-border bg-card p-2" type="number" name="min" min="0" step="0.01" defaultValue={search.min}/></label><label className="block text-xs">Até (R$)<input className="mt-1 w-full rounded-md border border-border bg-card p-2" type="number" name="max" min="0" step="0.01" defaultValue={search.max}/></label><Button type="submit" size="sm">Aplicar preço</Button></form>} emptyContent={<div className="py-10"><h2 className="text-lg font-bold">Nenhum produto nesta seleção</h2><p className="mt-2 text-sm text-muted-foreground">Remova os filtros ou confira outras lojas parceiras.</p><Button asChild variant="outline" className="mt-5"><Link to="/loja/$slug" params={{slug}}>Limpar filtros</Link></Button></div>}/>
 {showCategoryContent(search.pagina)&&guides.length>0&&<CategoryEditorial name={store.name} content={null} guides={guides}/>}
 </main><SiteFooter/></div>;
}