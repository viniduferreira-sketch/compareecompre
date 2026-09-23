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

      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-7 md:gap-4 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
        {CATEGORY_ITEMS.map(({ name, slug, term, icon: Icon, imageSrc, accentClass }) => {
          return (
          <li key={slug} className="w-[8.75rem] shrink-0 snap-start md:w-auto">
            <Button
              variant="softInk"
              type="button"
              onClick={() => onSearch(term)}
              aria-label={`Buscar ofertas de ${name}`}
              className="category-card group h-auto w-full flex-col gap-0 overflow-hidden rounded-xl p-0 text-center shadow-card transition-all duration-250 ease-out hover:-translate-y-1 hover:border-primary/40 hover:bg-card hover:text-foreground hover:shadow-lift active:scale-[0.97] [&_svg]:size-auto"
            >
              <span className={`category-icon-stage ${accentClass}`}>
                <span className="category-icon-float">
                  {imageSrc ? (
                    <img src={imageSrc} alt={`Ilustração 3D de ${name}`} loading="lazy" className="category-icon-art" />
                  ) : Icon ? (
                    <Icon className="category-icon-art" />
                  ) : null}
                </span>
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
