import { createFileRoute } from '@tanstack/react-router';
import { catalogSearch, catalogHref } from '@/lib/catalog-pages';
import { popularSearchProductsQuery, searchPageQuery } from '@/lib/search-page.queries';
import { CatalogPage, CatalogError } from '@/components/marketplace/CatalogPage';
export const Route = createFileRoute('/busca')({
 staticData:{sitemap:false},validateSearch:catalogSearch,loaderDeps:({search})=>search,
 loader:async({context,deps})=>{await Promise.all([context.queryClient.ensureQueryData(searchPageQuery(deps)),context.queryClient.ensureQueryData(popularSearchProductsQuery())]);},
 head:({match})=>{const query=match.search.q?.trim().replace(/\s+/g,' ').slice(0,70),title=`${query?`Busca por ${query}`:'Buscar produtos e preços'} | Compare e Compre`,description=query?`Confira ofertas para “${query}” em lojas parceiras. Compare preços, filtre os resultados e acesse a loja de origem para comprar.`:'Pesquise um produto nas lojas parceiras do Compare e Compre. Compare preços, filtre as ofertas e acesse a loja escolhida para comprar.';return {meta:[{title},{name:'description',content:description},{property:'og:title',content:title},{property:'og:description',content:description},{property:'og:type',content:'website'},{property:'og:url',content:'https://compareecompre.com'+catalogHref('/busca',match.search)},{name:'twitter:card',content:'summary'},{name:'robots',content:'noindex,follow'}]};},
 component:SearchPage,errorComponent:CatalogError,notFoundComponent:CatalogError,
});
function SearchPage(){return <CatalogPage deals={false} search={Route.useSearch()}/>;}