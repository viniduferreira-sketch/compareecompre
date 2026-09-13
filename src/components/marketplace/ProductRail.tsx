import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

import { OfferCard } from "@/components/marketplace/OfferCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Offer } from "@/lib/search-offers.functions";

export function ProductRail({
  title,
  description,
  offers,
  isLoading,
}: {
  title: string;
  description: string;
  offers: Offer[];
  isLoading: boolean;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: -1 | 1) => {
    railRef.current?.scrollBy({
      left: direction * Math.min(860, railRef.current.clientWidth * 0.82),
      behavior: "smooth",
    });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <Button variant="outline" size="icon" onClick={() => scroll(-1)} aria-label={`Voltar em ${title}`}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" onClick={() => scroll(1)} aria-label={`Avançar em ${title}`}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div
        ref={railRef}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-5 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-[400px] w-[250px] shrink-0 rounded-lg sm:w-[270px]" />
            ))
          : offers.map((offer) => (
              <div key={offer.id} className="w-[250px] shrink-0 snap-start sm:w-[270px]">
                <OfferCard offer={offer} />
              </div>
            ))}
      </div>

      {!isLoading && offers.length === 0 ? (
        <p className="border-y border-border py-10 text-center text-sm text-muted-foreground">
          As ofertas desta seleção estão sendo atualizadas.
        </p>
      ) : null}
    </section>
  );
}