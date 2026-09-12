import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CompareDialog } from "@/components/marketplace/CompareDialog";
import { Header } from "@/components/marketplace/Header";
import { HeroCarousel } from "@/components/marketplace/HeroCarousel";
import { OfferCard } from "@/components/marketplace/OfferCard";
import { PopularCategories } from "@/components/marketplace/PopularCategories";
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
  type Offer,
  type OfferFilter,
  type OfferSort,
} from "@/lib/search-offers.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Compare e Compre | Melhores ofertas das maiores lojas do Brasil" },
      {
        name: "description",
        content:
          "Compare preços de iPhone, Smart TV, Air Fryer e milhares de produtos entre as maiores lojas do Brasil e compre pela melhor oferta.",
      },
      { property: "og:title", content: "Compare e Compre | Melhores ofertas do Brasil" },
      {
        property: "og:description",
        content:
          "Busque um produto e veja na hora qual loja tem o menor preço. Ofertas atualizadas do Mercado Livre.",
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
  selected,
  isLoading,
  onToggle,
}: {
  filters: OfferFilter[];
  selected: Array<{ id: string; value: string }>;
  isLoading: boolean;
  onToggle: (id: string, value: string) => void;
}) {
  if (isLoading && filters.length === 0) {
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
            {filter.values.slice(0, 8).map((value) => {
              const checked = selected.some((item) => item.id === filter.id && item.value === value.id);
              return (
                <li key={value.id}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground transition-colors hover:text-primary">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(filter.id, value.id)}
                      className="size-4 rounded border-input accent-primary"
                    />
                    <span className="min-w-0 flex-1 truncate">{value.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">({value.results})</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </aside>
  );
}

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
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
          {index > 0 && value - pages[index - 1] > 1 ? <span className="px-1 text-muted-foreground">…</span> : null}
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
  selectedFilters,
  sort,
  page,
  total,
  isLoading,
  onCompare,
  onSort,
  onFilter,
  onClearFilters,
  onPage,
}: {
  term: string;
  offers: Offer[];
  filters: OfferFilter[];
  selectedFilters: Array<{ id: string; value: string }>;
  sort: OfferSort;
  page: number;
  total: number;
  isLoading: boolean;
  onCompare: (offer: Offer) => void;
  onSort: (sort: OfferSort) => void;
  onFilter: (id: string, value: string) => void;
  onClearFilters: () => void;
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

      {selectedFilters.length > 0 ? (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Filtros ativos: {selectedFilters.length}</span>
          <Button variant="ghost" size="sm" onClick={onClearFilters}>Limpar filtros <X /></Button>
        </div>
      ) : null}

      <div className="grid items-start gap-7 md:grid-cols-[210px_minmax(0,1fr)] lg:grid-cols-[230px_minmax(0,1fr)]">
        <FilterSidebar filters={filters} selected={selectedFilters} isLoading={isLoading} onToggle={onFilter} />
        <div className="min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => <Skeleton key={index} className="h-80 rounded-xl" />)}
            </div>
          ) : offers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
              <h2 className="font-display text-lg font-bold">Nenhum resultado encontrado</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tente buscar outro termo ou remover os filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {offers.map((offer) => <OfferCard key={`${offer.store}-${offer.id}`} offer={offer} onCompare={onCompare} />)}
            </div>
          )}
          {!isLoading && offers.length > 0 ? <Pagination page={page} total={total} onChange={onPage} /> : null}
        </div>
      </div>
    </section>
  );
}

function Home() {
  const run = useServerFn(searchOffers);
  const { q } = Route.useSearch();
  const [term, setTerm] = useState(q ?? "");
  const [selected, setSelected] = useState<Offer | null>(null);
  const [sort, setSort] = useState<OfferSort>("relevance");
  const [page, setPage] = useState(1);
  const [selectedFilters, setSelectedFilters] = useState<Array<{ id: string; value: string }>>([]);

  const startSearch = (nextTerm: string) => {
    setTerm(nextTerm);
    setPage(1);
    setSelectedFilters([]);
  };

  const search = useQuery({
    queryKey: ["offers", "search", term, sort, page, selectedFilters],
    enabled: term.length > 0,
    placeholderData: (previous) => previous,
    queryFn: () => run({
      data: { query: term, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, sort, filters: selectedFilters },
    }),
  });

  const persistenceErrors = [
    search.data?.persistence.ok === false ? search.data.persistence.message : null,
  ].filter((message): message is string => Boolean(message));
  const persistenceErrorKey = [...new Set(persistenceErrors)].join("\n");

  useEffect(() => {
    if (!persistenceErrorKey) return;
    console.error("[Supabase] Falha de persistência:", persistenceErrorKey);
    toast.error("Erro ao salvar ofertas", {
      id: `persistence-${persistenceErrorKey}`,
      description: persistenceErrorKey,
      duration: 15_000,
    });
  }, [persistenceErrorKey]);

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={startSearch} initialTerm={term} />

      <main>
        {term ? (
          <SearchResults
            term={term}
            offers={search.data?.offers ?? []}
            filters={search.data?.availableFilters ?? []}
            selectedFilters={selectedFilters}
            sort={sort}
            page={page}
            total={search.data?.paging.total ?? 0}
            isLoading={search.isFetching}
            onCompare={setSelected}
            onSort={(value) => { setSort(value); setPage(1); }}
            onFilter={(id, value) => {
              setSelectedFilters((current) => {
                const exists = current.some((item) => item.id === id && item.value === value);
                return exists ? current.filter((item) => !(item.id === id && item.value === value)) : [...current.filter((item) => item.id !== id), { id, value }];
              });
              setPage(1);
            }}
            onClearFilters={() => { setSelectedFilters([]); setPage(1); }}
            onPage={(value) => { setPage(value); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          />
        ) : (
          <>
            <HeroCarousel onSearch={startSearch} />
            <PopularCategories onSearch={startSearch} />
          </>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Compare e Compre · Preços e disponibilidade podem mudar na loja parceira. Podemos receber
        comissão pelas compras realizadas.
      </footer>

      <CompareDialog offer={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
