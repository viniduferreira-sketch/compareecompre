import {ChevronLeft,ChevronRight,SlidersHorizontal} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {OfferCard} from './OfferCard';
import {categoryHref,categoryByName,categorySlug} from '@/lib/category-pages';
import type {Offer,OfferFilter,OfferSort} from '@/lib/search-offers';
import type {ReactNode} from 'react';
export type ActiveFilter = { id: string; value: string };

function FilterSidebar({
  filters,
  isLoading,
  active = [],
  onToggle,
}: {
  filters: OfferFilter[];
  isLoading: boolean;
  active?: ActiveFilter[];
  onToggle?: (filter: ActiveFilter) => void;
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
            {(filter.id === "store" ? filter.values : filter.values.slice(0, 8)).map((value) => (
              <li key={value.id}>
                {filter.id === 'categoryName' ? <a href={categoryHref(categoryByName(value.id)?.slug??categorySlug(value.id))} className="flex items-center justify-between text-sm"><span>{value.name}</span><span className="text-xs text-muted-foreground">({value.results})</span></a> : <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={active.some((item) => item.id === filter.id && item.value === value.id)}
                    onChange={() => onToggle?.({ id: filter.id, value: value.id })}
                  />
                  <span className="min-w-0 flex-1 truncate">{value.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">({value.results})</span>
                </label>}
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
  pageHref,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  pageHref?: ((page:number)=>string)|undefined;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  if(pageHref)return <nav className="mt-10 flex flex-wrap justify-center gap-2" aria-label="Paginação">{[...new Set([1,page-1,page,page+1,totalPages])].filter(p=>p>=1&&p<=totalPages).map(p=><Button key={p} asChild size="sm" variant={p===page?'default':'outline'}><a href={pageHref(p)} aria-current={p===page?'page':undefined}>{p}</a></Button>)}</nav>;
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

export function SearchResults({
  term,
  introduction,
  categoryMode=false,
  pageHref,
  offers,
  filters,
  sort,
  page,
  total,
  pageSize,
  isLoading,
  onSort,
  onPage,
  activeFilters,
  onToggleFilter,
  headingLabel,
  sortOptions,
  showStore=false,
  emptyContent,
}: {
  activeFilters: ActiveFilter[];
  onToggleFilter: (filter: ActiveFilter) => void;
  term: string;
  introduction?:ReactNode;
  categoryMode?:boolean;
  pageHref?:((page:number)=>string)|undefined;
  offers: Offer[];
  filters: OfferFilter[];
  sort: OfferSort;
  page: number;
  total: number;
  pageSize: number;
  isLoading: boolean;
  onSort: (sort: OfferSort) => void;
  onPage: (page: number) => void;
  headingLabel?:string;
  sortOptions?:Array<{value:string;label:string}>;
  showStore?:boolean;
  emptyContent?:ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      {categoryMode&&<nav aria-label="Você está em" className="mb-5 flex gap-2 text-sm text-muted-foreground"><a href="/">Início</a><span>›</span><span>{term}</span></nav>}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">{headingLabel??(categoryMode?'Categoria':'Resultados da busca')}</p>
          <h1 className="font-display text-2xl font-bold">{term}</h1>
          {introduction}
          <p className="mt-1 text-sm text-muted-foreground">{total.toLocaleString("pt-BR")} produtos encontrados</p>
        </div>
        <div className="flex items-center gap-2 self-end">
          <span className="whitespace-nowrap text-sm text-muted-foreground">Ordenar por:</span>
          <Select value={sort} onValueChange={(value) => onSort(value as OfferSort)}>
            <SelectTrigger className="w-44 bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(sortOptions??[{value:'relevance',label:'Mais populares'},{value:'price_asc',label:'Menor preço'},{value:'price_desc',label:'Maior preço'}]).map(option=><SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid items-start gap-7 md:grid-cols-[210px_minmax(0,1fr)] lg:grid-cols-[230px_minmax(0,1fr)]">
        <FilterSidebar filters={filters} isLoading={isLoading} active={activeFilters} onToggle={onToggleFilter} />
        <div className="min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 9 }).map((_, index) => <Skeleton key={index} className="h-80 rounded-lg" />)}
            </div>
          ) : offers.length === 0 ? (
            emptyContent ?? <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
              <h2 className="font-display text-lg font-bold">Nenhum resultado encontrado</h2>
              <p className="mt-1 text-sm text-muted-foreground">{categoryMode?"Ainda não há ofertas nesta seleção. Confira outros produtos na busca.":"Tente buscar outro termo ou remover os filtros."}</p>{categoryMode&&<Button asChild variant="outline" className="mt-4"><a href="/?q=">Buscar produtos</a></Button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {offers.map((offer) => <OfferCard key={`${offer.store}-${offer.id}`} offer={offer} showStore={showStore} />)}
            </div>
          )}
          {!isLoading && offers.length > 0 ? (
            <Pagination page={page} total={total} pageSize={pageSize} onChange={onPage} pageHref={pageHref} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

