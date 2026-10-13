import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { Header } from "@/components/marketplace/Header";
import { HeroCarousel } from "@/components/marketplace/HeroCarousel";
import { OfferCard } from "@/components/marketplace/OfferCard";
import { PopularCategories } from "@/components/marketplace/PopularCategories";
import { ProductRail } from "@/components/marketplace/ProductRail";
import { SiteFooter } from "@/components/marketplace/SiteFooter";
import { MonitoredStores, PriceAlertSignup, TrustBanner } from "@/components/marketplace/HomeExperience";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  searchOffers,
  getHomeOffers,
  type Offer,
  type OfferFilter,
  type OfferSort,
} from "@/lib/search-offers.functions";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Compare e Compre | Compare preços online" },
      {
        name: "description",
        content:
          "Compare preços de iPhone, Smart TV, Air Fryer e milhares de produtos entre as maiores lojas do Brasil e compre pela melhor oferta.",
      },
      { property: "og:title", content: "Compare e Compre | O menor preço nas melhores lojas" },
      {
        property: "og:description",
        content:
          "Buscamos nas melhores lojas da internet para você encontrar o menor preço com rapidez e segurança.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" ? { q: search["q"] as string } : {},
  component: Home,
});

const PAGE_SIZE = 40;

function FilterSidebar({
  filters,
  isLoading,
}: {
  filters: OfferFilter[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <aside className="space-y-5" aria-label="Carregando filtros">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3 border-b border-border pb-5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        ))}
      </aside>
    );
  }

  return (
    <aside className="space-y-5" aria-label="Filtros de resultados">
      <div className="flex items-center gap-2 border-b border-border pb-4">
        <SlidersHorizontal className="size-4 text-primary" />
        <h2 className="font-display text-base font-bold">Filtros</h2>
      </div>
      {filters.slice(0, 8).map((filter) => (
        <section key={filter.id} className="border-b border-border pb-5">
          <h3 className="mb-2.5 text-sm font-bold">{filter.name}</h3>
          <ul className="space-y-2">
            {filter.values.slice(0, 8).map((value) => (
              <li key={value.id} className="text-sm text-foreground">
                {value.name} <span className="text-xs tabular-nums text-muted-foreground">({value.results})</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </aside>
  );
}

function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])].filter(
    (value) => value >= 1 && value <= totalPages,
  );

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5" aria-label="Paginação">
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Página anterior">
        <ChevronLeft />
      </Button>
      {pages.map((value, index) => (
        <div key={value} className="flex items-center gap-1.5">
          {index > 0 && value - (pages[index - 1] ?? value) > 1 ? <span className="px-1 text-muted-foreground">…</span> : null}
          <Button
            variant={value === page ? "default" : "outline"}
            size="sm"
            className="min-w-8 px-2"
            onClick={() => onChange(value)}
            aria-current={value === page ? "page" : undefined}
          >
            {value}
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        Seguinte <ChevronRight />
      </Button>
    </nav>
  );
}

function SearchResults({
  term,
  offers,
  filters,
  sort,
  page,
  total,
  pageSize,
  isLoading,
  onSort,
  onPage,
}: {
  term: string;
  offers: Offer[];
  filters: OfferFilter[];
  sort: OfferSort;
  page: number;
  total: number;
  pageSize: number;
  isLoading: boolean;
  onSort: (sort: OfferSort) => void;
  onPage: (page: number) => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">Resultados da busca</p>
          <h1 className="font-display text-2xl font-bold">{term}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total.toLocaleString("pt-BR")} produtos encontrados</p>
        </div>
        <div className="flex items-center gap-2 self-end">
          <span className="whitespace-nowrap text-sm text-muted-foreground">Ordenar por:</span>
          <Select value={sort} onValueChange={(value) => onSort(value as OfferSort)}>
            <SelectTrigger className="w-44 bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Mais relevantes</SelectItem>
              <SelectItem value="price_asc">Menor preço</SelectItem>
              <SelectItem value="price_desc">Maior preço</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid items-start gap-7 md:grid-cols-[210px_minmax(0,1fr)] lg:grid-cols-[230px_minmax(0,1fr)]">
        <FilterSidebar filters={filters} isLoading={isLoading} />
        <div className="min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => <Skeleton key={index} className="h-80 rounded-lg" />)}
            </div>
          ) : offers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
              <h2 className="font-display text-lg font-bold">Nenhum resultado encontrado</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tente buscar outro termo ou remover os filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {offers.map((offer) => <OfferCard key={`${offer.store}-${offer.id}`} offer={offer} />)}
            </div>
          )}
          {!isLoading && offers.length > 0 ? (
            <Pagination page={page} total={total} pageSize={pageSize} onChange={onPage} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Home() {
  const run = searchOffers;
  const loadHome = getHomeOffers;
  const { q } = Route.useSearch();
  const [term, setTerm] = useState(q ?? "");
  const [sort, setSort] = useState<OfferSort>("relevance");
  const [page, setPage] = useState(1);

  const startSearch = (nextTerm: string) => {
    setTerm(nextTerm);
    setPage(1);
  };

  const search = useQuery({
    queryKey: ["offers", "search", term, sort, page],
    enabled: term.length > 0,
    refetchInterval: 60 * 1000,
    queryFn: () => run({
      data: { query: term, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, sort },
    }),
  });
  const homeOffers = useQuery({
    queryKey: ["offers", "home"],
    queryFn: () => loadHome(),
    enabled: term.length === 0,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
  const validOffers = (search.data?.offers ?? []).filter(
    (offer) => Number.isFinite(offer.price) && offer.price > 0,
  );
  const isSearchLoading = search.isPending || search.isFetching;

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={startSearch} initialTerm={term} />

      <main>
        {term ? (
          <SearchResults
            term={term}
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
            <HeroCarousel onSearch={startSearch} />
            <PopularCategories
              onSearch={startSearch}
              covers={homeOffers.data?.categoryCovers ?? {}}
              isLoading={homeOffers.isPending}
            />
            <ProductRail
              eyebrow="Urgência"
              title="Ofertas que acabam rápido"
              description="Descontos em destaque para decidir antes que o preço mude"
              offers={homeOffers.data?.urgent ?? []}
              isLoading={homeOffers.isPending}
            />
            <ProductRail
              eyebrow="Oportunidade do dia"
              title="Baixaram de preço hoje"
              description="Veja a diferença entre o preço anterior e a melhor oferta atual"
              offers={homeOffers.data?.priceDrops ?? []}
              isLoading={homeOffers.isPending}
            />
            <TrustBanner />
            <MonitoredStores />
            <ProductRail
              eyebrow="Escolha de quem pesquisa"
              title="Os mais buscados da semana"
              description="Produtos que estão concentrando a atenção dos consumidores"
              offers={homeOffers.data?.popular ?? []}
              isLoading={homeOffers.isPending}
              ranked
            />
            <PriceAlertSignup />
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
