import {createFileRoute,notFound,useNavigate,useRouter,type ErrorComponentProps} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Header} from '@/components/marketplace/Header';
import {SiteFooter} from '@/components/marketplace/SiteFooter';
import {SearchResults,type ActiveFilter} from '@/components/marketplace/OfferResults';
import {categoryOffersQuery} from '@/lib/category-offers.queries';
import {categoryBySlug,categoryHead,categorySearch,categorySlug,categorySort,categoryHref} from '@/lib/category-pages';
import {Button} from '@/components/ui/button';
import {categoryContentQuery} from '@/lib/category-content.functions';
import {categoryFaqHead,showCategoryContent} from '@/lib/category-content';
import {CategoryIntroduction,CategoryEditorial} from '@/components/marketplace/CategoryEditorial';

export const Route=createFileRoute('/categoria/$slug')({
 staticData:{sitemap:true},validateSearch:categorySearch,
 loaderDeps:({search})=>search,
 beforeLoad:({params})=>{if(!categoryBySlug(params.slug))throw notFound();},
 loader:async({params,deps,context})=>{const [,editorial]=await Promise.all([context.queryClient.ensureQueryData(categoryOffersQuery(params.slug,deps)),showCategoryContent(deps.pagina)?context.queryClient.ensureQueryData(categoryContentQuery(params.slug)):Promise.resolve(null)]);return {editorial};},
 head:({params,match,loaderData})=>{const category=categoryBySlug(params.slug);if(category){const head=categoryHead(category.name,category.slug,match.search.pagina);return {...head,scripts:[...head.scripts,...(showCategoryContent(match.search.pagina)?categoryFaqHead(loaderData?.editorial?.content??null):[])]};}return {meta:[{title:'Categoria não encontrada | Compare e Compre'},{name:'description',content:'Esta categoria não está disponível no Compare e Compre.'},{property:'og:title',content:'Categoria não encontrada | Compare e Compre'},{property:'og:description',content:'Esta categoria não está disponível.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'},{name:'robots',content:'noindex'}]};},
 errorComponent:CategoryError,
 notFoundComponent:()=> <main className="mx-auto max-w-3xl px-5 py-20"><h1 className="text-2xl font-bold">Página não encontrada</h1><p className="mt-3 text-muted-foreground">Esta categoria não existe.</p><Button asChild className="mt-5"><a href="/">Voltar ao início</a></Button></main>,
 component:CategoryPage,
});
function CategoryError({reset}:ErrorComponentProps){const router=useRouter();return <main className="mx-auto max-w-3xl px-5 py-20"><h1 className="text-2xl font-bold">Não foi possível carregar a categoria</h1><Button onClick={()=>{void router.invalidate();reset();}} className="mt-5">Tentar novamente</Button></main>;}
function CategoryPage(){
 const {slug}=Route.useParams(),search=Route.useSearch(),navigate=useNavigate();
 const {editorial}=Route.useLoaderData();
 const {data}=useSuspenseQuery(categoryOffersQuery(slug,search));
 const active:ActiveFilter[]=Object.entries(search).flatMap(([key,value])=>{const id=key==='marca'?'brand':key==='loja'?'store':key==='frete'?'freeShipping':undefined;if(!id||typeof value!=='string')return [];const facet=data.availableFilters.find(f=>f.id===id)?.values.find(v=>categorySlug(v.id)===categorySlug(value)||categorySlug(v.id).replace(/-br$/,'')===categorySlug(value));return [{id,value:facet?.id??value}];});
 const toggle=(filter:ActiveFilter)=>{if(filter.id==='categoryName')return;const key=filter.id==='brand'?'marca':filter.id==='store'?'loja':'frete';void navigate({to:'/categoria/$slug',params:{slug},search:prev=>({...prev,[key]:active.some(a=>a.id===filter.id&&a.value===filter.value)?undefined:categorySlug(filter.value),pagina:1})});};
 return <div className="min-h-screen bg-background"><Header initialTerm="" onSearch={q=>{void navigate({to:'/',search:{q}});}}/><main><SearchResults categoryMode introduction={showCategoryContent(search.pagina)&&editorial?<CategoryIntroduction key={slug} text={editorial.content?.introduction??''}/>:undefined} term={data.category.name} offers={data.offers} filters={data.availableFilters} sort={categorySort(search.ordem)} page={search.pagina??1} total={data.paging.total} pageSize={40} isLoading={false} activeFilters={active} onToggleFilter={toggle} onSort={sort=>{void navigate({to:'/categoria/$slug',params:{slug},search:prev=>({...prev,ordem:sort==='price_asc'?'menor-preco':sort==='price_desc'?'maior-preco':undefined,pagina:1})});}} onPage={page=>{void navigate({to:'/categoria/$slug',params:{slug},search:prev=>({...prev,pagina:page})});}} pageHref={page=>categoryHref(slug,{...search,pagina:page})}/>{showCategoryContent(search.pagina)&&editorial&&<CategoryEditorial name={data.category.name} content={editorial.content} guides={editorial.guides}/>}</main><SiteFooter/></div>;
}