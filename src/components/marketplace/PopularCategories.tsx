import { Button } from "@/components/ui/button";
import { CATEGORY_ITEMS } from "@/components/category-icons/categories";
import { CategoryBlob } from "@/components/category-icons/CategoryBlob";
import { useState } from "react";
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
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  return (
    <section className="mx-auto max-w-7xl px-4 pt-9 sm:px-6 lg:px-8">
      <p className="text-xs font-bold uppercase text-primary">Atalhos para economizar</p>
      <h2 className="mb-5 mt-1 font-display text-2xl font-extrabold">O que você está procurando?</h2>

      <ul className="category-shortcuts -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 pt-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-7 lg:gap-4 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
        {CATEGORY_ITEMS.map(({ name, slug, term, imageSrc, imageAlt, blobColor, blobVariant }) => {
          return (
          <li key={slug} className="category-shortcut-item min-w-0 shrink-0 snap-start lg:w-auto">
            <Button
              asChild
              variant="ghost"
              className="category-card h-auto w-full flex-col gap-0 p-0 text-center text-foreground [&_svg]:size-auto"
            >
              <a href={`/?q=${encodeURIComponent(term)}`} aria-label={`Ver ofertas de ${name}`} onClick={(event) => {
                if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                onSearch(term);
              }}>
                <span className="category-icon-stage">
                  <CategoryBlob color={blobColor} variant={blobVariant} />
                  {imageSrc && !failedImages.has(imageSrc) ? (
                    <img src={imageSrc} alt={imageAlt} loading="lazy" decoding="async" width={320} height={256} className="category-icon-art" onError={() => setFailedImages((previous) => new Set([...previous, imageSrc]))} />
                  ) : (
                    <span className="category-icon-placeholder" aria-hidden="true" />
                  )}
                </span>
                <span className="flex min-h-11 w-full items-center justify-center px-1 py-2 text-sm font-semibold leading-tight">
                  {name}
                </span>
              </a>
            </Button>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
