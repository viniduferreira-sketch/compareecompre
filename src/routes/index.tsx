import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { useState } from "react";

import { Header } from "@/components/marketplace/Header";
import { HeroCarousel } from "@/components/marketplace/HeroCarousel";
import { SearchResults, type ActiveFilter } from "@/components/marketplace/OfferResults";
import {categoryByName,categoryHref} from "@/lib/category-pages";
import {storeSlug} from '@/lib/store-pages';
import { PopularCategories } from "@/components/marketplace/PopularCategories";
import { ProductRail } from "@/components/marketplace/ProductRail";
import { SiteFooter } from "@/components/marketplace/SiteFooter";
import { BlogPromotions } from "@/components/marketplace/BlogPromotions";
import { HomeShowcases } from "@/components/marketplace/HomeShowcases";
import { homeShowcasesQuery } from "@/lib/home-showcases.queries";
import { MonitoredStores, PriceAlertSignup, TrustBanner } from "@/components/marketplace/HomeExperience";
import { homeBlogPromotionsQuery } from "@/lib/blog-promotions.queries";
import { SITE_CATEGORIES } from "@/lib/storefront-mix";


import {
  searchOffers,
  getHomeOffers,
  type OfferSort,
} from "@/lib/search-offers";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  beforeLoad: ({search})=>{if(search.loja)throw redirect({to:'/loja/$slug',params:{slug:storeSlug(search.loja)},statusCode:301});const category=categoryByName(search.categoria??search.category??search.q??'');if(category)throw redirect({href:categoryHref(category.slug),statusCode:301});if(search.q!==undefined)throw redirect({to:'/busca',search:{q:search.q},statusCode:301});},
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(homeBlogPromotionsQuery()),context.queryClient.ensureQueryData(homeShowcasesQuery())]),
  errorComponent: HomeError,
  notFoundComponent: HomeError,
  head: () => ({
    meta: [
      { title: "Compare e Compre | Compare preços e ofertas no Brasil" },
      {
        name: "description",
        content:
          "Compare ofertas de eletrônicos, casa, moda e outras categorias em lojas parceiras no Brasil. Escolha um produto e vá à loja de origem para comprar.",
      },
      { property: "og:title", content: "Compare e Compre | Compare preços e ofertas no Brasil" },
      {
        property: "og:description",
        content:
          "Compare ofertas de eletrônicos, casa, moda e outras categorias em lojas parceiras no Brasil. Escolha um produto e vá à loja de origem para comprar.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://compareecompre.com/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://compareecompre.com/" }],
  }),
  validateSearch: (search: Record<string, unknown>): { q?: string|undefined;categoria?:string|undefined;category?:string|undefined;loja?:string|undefined } => ({loja:typeof search['loja']==='string'?search['loja']:undefined,q:typeof search['q']==='string'?search['q']:undefined,categoria:typeof search['categoria']==='string'?search['categoria']:undefined,category:typeof search['category']==='string'?search['category']:undefined}),
  component: Home,
});

const PAGE_SIZE = 40;
function HomeError(){return <main className="mx-auto max-w-3xl px-5 py-24 text-center"><h1 className="font-display text-2xl font-bold">Não foi possível carregar a página</h1><a href="/" className="mt-5 inline-block font-semibold text-primary underline">Tentar novamente</a></main>;}

function Home() {
  const run = searchOffers;
  const loadHome = getHomeOffers;
  const { data: blogPosts } = useSuspenseQuery(homeBlogPromotionsQuery());
  const { q } = Route.useSearch();
  const initialCategory = SITE_CATEGORIES.find((name) => name.localeCompare(q ?? "", "pt-BR", { sensitivity: "base" }) === 0);
  const [term, setTerm] = useState(initialCategory ? "" : q ?? "");
  const [sort, setSort] = useState<OfferSort>("relevance");
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>(initialCategory ? [{ id: "categoryName", value: initialCategory }] : []);
  const toggleFilter = (filter: ActiveFilter) => {
    setPage(1);
    setActiveFilters((current) => current.some((item) => item.id === filter.id && item.value === filter.value)
      ? current.filter((item) => !(item.id === filter.id && item.value === filter.value))
      : [...current, filter]);
  };
  const isSearching = term.length > 0 || activeFilters.length > 0 || q === '';

  const startSearch = (nextTerm: string) => {
    // Category tabs filter strictly by the category field instead of free-text matching.
    const category = SITE_CATEGORIES.find((name) => name.localeCompare(nextTerm, "pt-BR", { sensitivity: "base" }) === 0);
    if(category){window.location.assign(categoryHref(categoryByName(category)?.slug??''));return;}
    setTerm(category ? "" : nextTerm);
    setActiveFilters(category ? [{ id: "categoryName", value: category }] : []);
    setPage(1);
  };

  const search = useQuery({
    queryKey: ["offers", "search", term, sort, page, activeFilters],
    enabled: isSearching,
    queryFn: () => run({
      data: { query: term, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, sort, filters: activeFilters as Array<{ id: "store" | "categoryName" | "brand" | "freeShipping"; value: string }> },
    }),
  });
  const homeOffers = useQuery({
    queryKey: ["offers", "home"],
    queryFn: () => loadHome(),
    enabled: !isSearching,
    staleTime: 15 * 60 * 1000,
  });
  const validOffers = (search.data?.offers ?? []).filter(
    (offer) => Number.isFinite(offer.price) && offer.price > 0,
  );
  const isSearchLoading = search.isPending || search.isFetching;
  const selectStore = (store: string) => {
    setTerm("");
    setPage(1);
    setActiveFilters([{ id: "store", value: store }]);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={startSearch} initialTerm={term} />

      <main>
        {isSearching ? (
          <SearchResults
            activeFilters={activeFilters}
            onToggleFilter={toggleFilter}
            term={term || activeFilters.map((item) => item.value).join(", ")}
            offers={validOffers}
            filters={search.data?.availableFilters ?? []}
            sort={sort}
            page={page}
            total={search.data?.paging.total ?? 0}
            pageSize={search.data?.paging.limit ?? PAGE_SIZE}
            isLoading={isSearchLoading}
            onSort={(value) => { setSort(value); setPage(1); }}
            onPage={(value) => { setPage(value); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          />
        ) : (
          <>
            <HeroCarousel onSearch={startSearch} onSelectStore={selectStore} />
            <MonitoredStores
              stores={homeOffers.data?.stores ?? []}
              onSelect={selectStore}
            />
            <HomeShowcases categorySlug="casa" />
            <PopularCategories
              onSearch={startSearch}
              covers={homeOffers.data?.categoryCovers ?? {}}
              isLoading={homeOffers.isPending}
            />
            <ProductRail
              eyebrow="Escolha de quem pesquisa"
              title="Os mais buscados da semana"
              description="Produtos que estão concentrando a atenção dos consumidores"
              offers={homeOffers.data?.popular ?? []}
              isLoading={homeOffers.isPending}
              debugError={homeOffers.data?.debugError}
              ranked
              showcase
            />
            <TrustBanner />
            <HomeShowcases excludeCategorySlug="casa" />
            <PriceAlertSignup />
            <BlogPromotions posts={blogPosts} variant="home" />
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
