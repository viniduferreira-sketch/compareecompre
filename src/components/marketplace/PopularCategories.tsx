import { Button } from "@/components/ui/button";
import { CATEGORY_ITEMS } from "@/components/category-icons/categories";
import type { CategoryCover } from "@/lib/search-offers.functions";

export function PopularCategories({
  onSearch,
  covers: _covers,
  isLoading: _isLoading,
}: {
  onSearch: (term: string) => void;
  covers: Record<string, CategoryCover>;
  isLoading: boolean;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-9 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase text-primary">Atalhos para economizar</p>
      <h2 className="mb-5 mt-1 font-display text-2xl font-extrabold">O que você está procurando?</h2>

      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-7 lg:gap-4 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
        {CATEGORY_ITEMS.map(({ name, slug, term, icon: Icon, imageSrc }) => {
          return (
          <li key={slug} className="w-[8.75rem] shrink-0 snap-start lg:w-auto">
            <Button
              variant="softInk"
              type="button"
              onClick={() => onSearch(term)}
              aria-label={`Buscar ofertas de ${name}`}
              className="category-card h-auto w-full flex-col gap-0 overflow-hidden rounded-xl p-0 text-center [&_svg]:size-auto"
            >
              <span className="category-icon-stage">
                  {imageSrc ? (
                    <img src={imageSrc} alt={`Objeto representativo da categoria ${name}, com fundo transparente`} loading="lazy" decoding="async" width={256} height={256} className="category-icon-art" />
                  ) : Icon ? (
                    <span className="category-icon-placeholder" aria-hidden="true">
                      <Icon size={40} strokeWidth={1.75} />
                    </span>
                  ) : null}
              </span>
              <span className="flex min-h-12 w-full items-center justify-center bg-muted px-2 py-3 text-xs font-semibold leading-tight text-foreground">
                {name}
              </span>
            </Button>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
