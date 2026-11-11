import { createFileRoute, useNavigate, useRouter,redirect } from '@tanstack/react-router';
import {storeSlug} from '@/lib/store-pages';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { Store, Package, RefreshCw, ShieldCheck, Building2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoreLogo } from '@/components/marketplace/StoreLogo';
import { PartnerInformationPage, InformationIcon, informationCard, contactHref } from '@/components/marketplace/PartnerInformationPage';
import { SearchResults, type ActiveFilter } from '@/components/marketplace/OfferResults';
import { monitoredStoresQuery } from '@/lib/monitored-stores.queries';
import { informationHead } from '@/lib/partner-information';
import { searchOffers, type OfferSort } from '@/lib/search-offers';

type StoreSearch = { loja?: string | undefined; marca?: string | undefined; frete?: string | undefined; ordem?: OfferSort | undefined; pagina?: number | undefined };
const storeOffersQuery = (search: StoreSearch) => queryOptions({ queryKey: ['directory-store-offers', search], staleTime: 60000, queryFn: () => searchOffers({ data: { query: '', sort: search.ordem ?? 'relevance', offset: ((search.pagina ?? 1) - 1) * 40, filters: [{ id: 'store', value: search.loja ?? '' }, ...(search.marca ? [{ id: 'brand' as const, value: search.marca }] : []), ...(search.frete ? [{ id: 'freeShipping' as const, value: search.frete }] : [])] } }) });

export const Route = createFileRoute('/lojas-monitoradas')({
  staticData: { sitemap: true },
  validateSearch: (s: Record<string, unknown>): StoreSearch => ({ loja: typeof s['loja'] === 'string' ? s['loja'] : undefined, marca: typeof s['marca'] === 'string' ? s['marca'] : undefined, frete: typeof s['frete'] === 'string' ? s['frete'] : undefined, ordem: s['ordem'] === 'price_asc' || s['ordem'] === 'price_desc' ? s['ordem'] : undefined, pagina: s['pagina']===undefined?undefined:Math.max(1, Math.floor(Number(s['pagina']) || 1)) }),
  loaderDeps: ({ search }) => search,
  beforeLoad:async({search,context})=>{if(search.loja){const stores=await context.queryClient.ensureQueryData(monitoredStoresQuery());const store=stores.find(s=>s.searchName===search.loja||storeSlug(s.name)===storeSlug(search.loja??''));if(store)throw redirect({to:'/loja/$slug',params:{slug:storeSlug(store.name)},search:{marca:search.marca,ordem:search.ordem==='price_asc'?'menor-preco':search.ordem==='price_desc'?'maior-preco':undefined,pagina:search.pagina},statusCode:301});}},
  loader: async ({ context, deps }) => {
    const stores = await context.queryClient.ensureQueryData(monitoredStoresQuery());
    if (deps.loja && stores.some(s => s.searchName === deps.loja)) await context.queryClient.ensureQueryData(storeOffersQuery(deps));
    return stores;
  },
  head: ({ loaderData }) => informationHead('/lojas-monitoradas', 'Lojas monitoradas: onde comparamos preços | Compare e Compre', 'Veja as lojas que o Compare e Compre monitora para encontrar o menor preço: parcerias oficiais, compra direto na loja e preços atualizados várias vezes ao dia.', 'Lojas monitoradas', [{ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: (loaderData ?? []).map((store, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Organization', name: store.name, url: `https://compareecompre.com${store.href}` } })) }]),
  component: MonitoredStoresPage,
  errorComponent: () => { const router = useRouter(); return <PartnerInformationPage title="Lojas monitoradas" breadcrumb="Lojas monitoradas" subtitle="Não foi possível carregar as lojas agora."><Button onClick={() => { void router.invalidate(); }}>Tentar novamente</Button></PartnerInformationPage>; },
  notFoundComponent: () => <p>Loja não encontrada. <a href="/lojas-monitoradas">Ver lojas monitoradas</a></p>,
});

function FilteredStoreOffers() {
  const search = Route.useSearch(), navigate = useNavigate({ from: '/lojas-monitoradas' });
  const { data } = useSuspenseQuery(storeOffersQuery(search));
  const active: ActiveFilter[] = [{ id: 'store', value: search.loja ?? '' }, ...(search.marca ? [{ id: 'brand', value: search.marca }] : []), ...(search.frete ? [{ id: 'freeShipping', value: search.frete }] : [])];
  return <SearchResults term={search.loja ?? ''} offers={data.offers} filters={data.availableFilters} sort={search.ordem ?? 'relevance'} page={search.pagina ?? 1} total={data.paging.total} pageSize={40} isLoading={false} activeFilters={active} onToggleFilter={filter => { const key = filter.id === 'brand' ? 'marca' : filter.id === 'store' ? 'loja' : 'frete'; void navigate({ search: prev => ({ ...prev, [key]: active.some(f => f.id === filter.id && f.value === filter.value) ? undefined : filter.value, pagina: 1 }) }); }} onSort={ordem => { void navigate({ search: prev => ({ ...prev, ordem, pagina: 1 }) }); }} onPage={pagina => { void navigate({ search: prev => ({ ...prev, pagina }) }); }} />;
}

function MonitoredStoresPage() {
  const { data: stores } = useSuspenseQuery(monitoredStoresQuery());
  const { loja } = Route.useSearch();
  const total = stores.reduce((n, store) => n + store.count, 0);
  return <PartnerInformationPage title="Lojas monitoradas" breadcrumb="Lojas monitoradas" subtitle="Comparamos preços em lojas conhecidas, todas com parceria oficial. Veja onde procuramos o menor preço para você.">
    {loja && stores.some(s => s.searchName === loja) ? <><a href="/lojas-monitoradas" className="font-semibold text-primary hover:underline">Voltar à lista de lojas</a><FilteredStoreOffers /></> : <>
      <section aria-label="Nossa cobertura" className="grid gap-6 border-b border-border pb-8 sm:grid-cols-3">{[{ icon: Store, value: stores.length.toLocaleString('pt-BR'), label: 'lojas ativas' }, { icon: Package, value: total.toLocaleString('pt-BR'), label: 'produtos monitorados' }, { icon: RefreshCw, value: 'Várias vezes ao dia', label: 'atualização dos preços' }].map(item => <div key={item.label} className="flex items-center gap-4"><InformationIcon icon={item.icon} /><div><p className="text-xl font-bold text-foreground">{item.value}</p><p className="mt-1 text-sm text-muted-foreground">{item.label}</p></div></div>)}</section>
      <section aria-label="Lojas parceiras"><p className="mb-5 text-sm leading-6 text-muted-foreground">As contagens incluem as variantes disponíveis no catálogo. Na lista de ofertas, tamanhos do mesmo produto e cor podem aparecer juntos em um cartão.</p><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{stores.map(store => <article key={store.searchName} className={`${informationCard} flex flex-col`}>
        <div className="flex h-24 items-center justify-center"><StoreLogo store={store.name} logoUrl={store.logoUrl} className="h-16 w-36 text-2xl" /></div><h2 className="mt-4 text-lg font-bold">{store.name}</h2><p className="mb-5 mt-2 text-sm text-muted-foreground">{store.count.toLocaleString('pt-BR')} produtos monitorados</p><Button asChild className="mt-auto w-full"><a href={store.href}>Ver produtos<ArrowRight className="size-4" /></a></Button>
      </article>)}</div>{stores.length === 0 && <p>Nenhuma loja disponível no momento. <a href="/" className="text-primary underline">Buscar produtos</a></p>}</section>
      <section><h2 className="mb-6 text-2xl font-bold">Como escolhemos as lojas</h2><div className="grid gap-5 md:grid-cols-3">{[{ icon: ShieldCheck, title: 'Parcerias oficiais', text: 'Só monitoramos lojas com as quais temos parceria oficial. Não copiamos dados de sites sem autorização.' }, { icon: Building2, title: 'Lojas conhecidas', text: 'Priorizamos lojas estabelecidas, com site seguro e checkout próprio.' }, { icon: ShoppingBag, title: 'Compra direto na loja', text: 'Você paga e recebe na loja escolhida. O Compare e Compre não vende produtos nem recebe pagamentos.' }].map(item => <article key={item.title} className={informationCard}><InformationIcon icon={item.icon} /><h3 className="mb-3 mt-5 text-lg font-bold">{item.title}</h3><p className="text-sm leading-7 text-muted-foreground">{item.text}</p></article>)}</div></section>
      <aside className="border-l-4 border-primary pl-5 text-sm leading-7 text-muted-foreground"><p>Podemos receber uma comissão quando você compra pelos nossos links, sem custo extra para você. Isso não altera o preço que você paga. Saiba mais em <a href="/como-comparamos" className="font-semibold text-primary underline">Como comparamos</a>.</p><p className="mt-2 text-xs">Marcas e logotipos pertencem às respectivas lojas.</p></aside>
      <section className="border-t border-border pt-8"><h2 className="mb-5 text-xl font-bold">Sentiu falta de alguma loja? Conte para a gente.</h2><Button asChild><a href={contactHref}>Fale conosco<ArrowRight className="size-4" /></a></Button></section>
    </>}
  </PartnerInformationPage>;
}