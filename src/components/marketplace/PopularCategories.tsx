import { ImageIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryCover } from "@/lib/search-offers.functions";

const CATEGORIES = [
  { name: "Eletrônicos", term: "Eletrônicos" },
  { name: "Moda", term: "Moda" },
  { name: "Casa", term: "Casa" },
  { name: "Celulares", term: "Celulares" },
  { name: "Games", term: "Games" },
  { name: "Beleza", term: "Beleza" },
  { name: "Esportes", term: "Esportes" },
];

export function PopularCategories({
  onSearch,
  covers,
  isLoading,
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
        {CATEGORIES.map(({ name, term }) => {
          const cover = covers[name];
          return (
          <li key={name} className="w-36 shrink-0 snap-start md:w-auto">
            <button
              type="button"
              onClick={() => onSearch(term)}
              className="group flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-center shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift"
            >
              <span className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-muted">
                {isLoading ? (
                  <Skeleton className="h-full w-full rounded-none" />
                ) : cover ? (
                  <img
                    src={cover.imageUrl}
                    alt={`Produto em destaque de ${name}: ${cover.title}`}
                    loading="lazy"
                    className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <ImageIcon className="size-7 text-muted-foreground" aria-hidden="true" />
                )}
              </span>
              <span className="flex min-h-12 items-center justify-center px-2 py-3 text-xs font-semibold leading-tight text-foreground">
                {name}
              </span>
            </button>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
