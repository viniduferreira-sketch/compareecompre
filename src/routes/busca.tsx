import { createFileRoute } from '@tanstack/react-router';
import { catalogSearch, catalogHref } from '@/lib/catalog-pages';
import { catalogSourceQuery } from '@/lib/catalog-pages.queries';
import { CatalogPage, CatalogError } from '@/components/marketplace/CatalogPage';
export const Route = createFileRoute('/busca')({
 staticData:{sitemap:false},validateSearch:catalogSearch,loaderDeps:({search})=>({q:search.q}),
 loader:({context,deps})=>Promise.all([context.queryClient.ensureQueryData(catalogSourceQuery(deps.q??'')),context.queryClient.ensureQueryData(catalogSourceQuery())]),
 head:({match})=>{const title=`${match.search.q?`Busca por ${match.search.q}`:'Buscar produtos'} | Compare e Compre`,description='Busque produtos e compare preços em lojas parceiras.';return {meta:[{title},{name:'description',content:description},{property:'og:title',content:title},{property:'og:description',content:description},{property:'og:type',content:'website'},{property:'og:url',content:'https://compareecompre.com'+catalogHref('/busca',match.search)},{name:'twitter:card',content:'summary'},{name:'robots',content:'noindex,follow'}]};},
 component:SearchPage,errorComponent:CatalogError,notFoundComponent:CatalogError,
});
function SearchPage(){return <CatalogPage deals={false} search={Route.useSearch()}/>;}