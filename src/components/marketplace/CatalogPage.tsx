import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { Header } from './Header';
import { SiteFooter } from './SiteFooter';
import { SearchResults, type ActiveFilter } from './OfferResults';
import { OfferCard } from './OfferCard';
import { Button } from '@/components/ui/button';
import { catalogSourceQuery, catalogResult } from '@/lib/catalog-pages.queries';
import { catalogHref, type CatalogSearch } from '@/lib/catalog-pages';
import { PRODUCT_CATEGORIES, categorySlug } from '@/lib/category-pages';
import { relatedOffer } from '@/lib/related-products';
import { orderCatalog } from '@/lib/catalog-pages';
import type { OfferSort } from '@/lib/search-offers';

export function CatalogError() { const router = useRouter(); return <main className="mx-auto max-w-3xl px-5 py-20"><h1 className="text-2xl font-bold">Não foi possível carregar os produtos</h1><Button className="mt-5" onClick={() => { void router.invalidate(); }}>Tentar novamente</Button></main>; }
export function CatalogPage({ search, deals, guidePublished=false }: { search: CatalogSearch; deals: boolean; guidePublished?: boolean }) {
  const navigate = useNavigate();
  const path = deals ? '/ofertas' : '/busca';
  const { data: hits } = useSuspenseQuery(catalogSourceQuery(deals ? '' : search.q ?? '', deals));
  const { data: popular } = useSuspenseQuery(catalogSourceQuery());
  const initial = catalogResult(hits, search, deals);
  const fallback = deals && initial.paging.total === 0;
  const data = fallback ? catalogResult(popular, { pagina: 1, ordem: 'mais-populares' }, false) : initial;
  const update = (patch: Partial<CatalogSearch>) => { void navigate({ to: path, search: { ...search, ...patch } }); };
  const active: ActiveFilter[] = ['loja', 'marca', 'frete'].flatMap(key => { const value = search[key as keyof CatalogSearch]; return typeof value === 'string' ? [{id:key==='loja'?'store':key==='marca'?'brand':'freeShipping',value:data.availableFilters.find(f=>f.id===(key==='loja'?'store':'brand'))?.values.find(v=>categorySlug(v.id).replace(/-br$/,'')===categorySlug(value))?.id??value}] : []; });
  const sort = search.ordem === 'menor-preco' ? 'price_asc' : search.ordem === 'maior-desconto' || (deals && !search.ordem) ? 'discount' : 'relevance';
  return <div className="min-h-screen bg-background"><Header initialTerm={search.q ?? ''} onSearch={q=>{void navigate({to:'/busca',search:{q}});}}/><main>
    <nav aria-label="Você está em" className="mx-auto flex max-w-7xl gap-2 px-5 pt-7 text-sm text-muted-foreground lg:px-8"><Link to="/">Início</Link><span>›</span><span>{deals?'Ofertas':'Busca'}</span></nav>
    {deals && <nav aria-label="Categorias de ofertas" className="mx-auto flex max-w-7xl flex-wrap gap-2 px-5 pt-5 lg:px-8"><Button asChild size="sm" variant={!search.categoria?'default':'outline'}><Link to="/ofertas" search={{...search,categoria:undefined,pagina:1}}>Todas</Link></Button>{PRODUCT_CATEGORIES.map(category=><Button asChild key={category.slug} size="sm" variant={search.categoria===category.slug?'default':'outline'}><Link to="/ofertas" search={{...search,categoria:category.slug,pagina:1}}>{category.name}</Link></Button>)}</nav>}
    <SearchResults headingLabel={deals?'Ofertas':'Resultados da busca'} term={deals?'Ofertas do dia':search.q?`Resultados para “${search.q}”`:'Buscar produtos'} introduction={deals?<><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Produtos com desconto em várias lojas, para você comparar e ir direto à que sair mais barata.</p>{fallback&&<p role="status" className="mt-3 text-sm">Não há ofertas com desconto nesta seleção. Veja produtos populares das lojas parceiras.</p>}</>:undefined} offers={data.offers} filters={data.availableFilters} sort={sort as OfferSort} sortOptions={deals?[{value:'discount',label:'Maior desconto'},{value:'relevance',label:'Mais populares'},{value:'price_asc',label:'Menor preço'}]:[{value:'relevance',label:'Mais populares'},{value:'price_asc',label:'Menor preço'}]} page={fallback?1:search.pagina??1} total={data.paging.total} pageSize={24} showStore isLoading={false} activeFilters={active} onToggleFilter={filter=>{const key=filter.id==='store'?'loja':filter.id==='brand'?'marca':'frete';update({[key]:active.some(f=>f.id===filter.id&&f.value===filter.value)?undefined:categorySlug(filter.value),pagina:1});}} onSort={value=>update({ordem:value==='price_asc'?'menor-preco':String(value)==='discount'?'maior-desconto':'mais-populares',pagina:1})} onPage={pagina=>update({pagina})} pageHref={pagina=>catalogHref(path,{...(fallback?{ordem:'mais-populares'}:search),pagina})} emptyContent={<div><h2 className="text-lg font-bold">Nenhum resultado encontrado</h2><p className="mt-2 text-sm text-muted-foreground">Tente outro termo ou remova os filtros.</p><Button asChild className="mt-5"><Link to="/ofertas">Ver ofertas do dia</Link></Button><nav aria-label="Explorar categorias" className="my-6 flex flex-wrap gap-3">{PRODUCT_CATEGORIES.map(c=><Link key={c.slug} to="/categoria/$slug" params={{slug:c.slug}} className="text-sm font-semibold text-primary underline">{c.name}</Link>)}</nav><h2 className="mb-4 text-lg font-bold">Produtos populares</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{orderCatalog(popular).slice(0,8).map(hit=><OfferCard key={hit.objectID} offer={relatedOffer(hit)} showStore/>)}</div></div>}/>
    {deals&&(search.pagina??1)===1&&<p className="mx-auto max-w-7xl px-5 pb-5 text-sm leading-7 text-muted-foreground lg:px-8">Mostramos o desconto sobre o preço anterior informado pela loja. Para saber se a oferta é boa de verdade, veja o histórico de preço na página do produto e leia nosso {guidePublished?<Link to="/blog/$slug" params={{slug:'desconto-real'}} className="text-primary underline">guia sobre desconto real</Link>:'guia sobre desconto real'}. <Link to="/como-comparamos" className="text-primary underline">Como comparamos</Link>.</p>}
  </main><SiteFooter/></div>;
}