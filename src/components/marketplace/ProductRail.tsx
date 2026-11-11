import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef,useState } from "react";
import { validProductImage } from '@/lib/rail-products';
import { HOME_PRODUCT_RAIL_LIMIT } from '@/lib/home-showcases';

import { OfferCard } from "@/components/marketplace/OfferCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Offer } from "@/lib/search-offers.functions";

export function ProductRail({
  title,
  description,
  offers,
  isLoading,
  ranked = false,
  eyebrow,
  debugError,
  viewAllHref,
  showcase=false,
}: {
  debugError?: string | undefined;
  title: string;
  description: string;
  offers: Offer[];
  isLoading: boolean;
  ranked?: boolean;
  eyebrow?: string;
  viewAllHref?:string;
  showcase?:boolean;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [failed,setFailed]=useState<string[]>([]);
  const visible=offers.filter(offer=>validProductImage(offer.imageUrl)&&!failed.includes(offer.id)).slice(0,HOME_PRODUCT_RAIL_LIMIT);
  if(showcase && visible.length<4)return null;
  const scroll = (direction: -1 | 1) => {
    railRef.current?.scrollBy({
      left: direction * Math.min(860, railRef.current.clientWidth * 0.82),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',
    });
  };

  return (
    <section aria-label={title} className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 basis-64">
          {eyebrow ? <p className="mb-1 text-xs font-bold uppercase text-primary">{eyebrow}</p> : null}
          <h2 className="font-display text-2xl font-extrabold text-foreground md:text-3xl">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {viewAllHref && <Button asChild variant="link" className="px-2"><a href={viewAllHref}>Ver todos</a></Button>}
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
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-5 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-[290px] w-[160px] shrink-0 rounded-lg sm:w-[192px]" />
            ))
          : visible.map((offer, index) => (
              <div key={offer.id} className={showcase?"w-[calc((100%-24px)/2.5)] shrink-0 snap-start sm:w-[calc((100%-36px)/4)] md:w-[calc((100%-48px)/5)] lg:w-[calc((100%-60px)/6)]":"w-[160px] shrink-0 snap-start sm:w-[192px]"}>
                <OfferCard offer={offer} showStore onImageUnavailable={()=>setFailed(current=>current.includes(offer.id)?current:[...current,offer.id])} {...(ranked ? { rank: index + 1 } : {})} />
              </div>
            ))}
      </div>

      {!isLoading && visible.length === 0 ? (
        <p className="border-y border-border py-10 text-center text-sm text-muted-foreground">
          {debugError ?? "As ofertas desta seleção estão sendo atualizadas."}
        </p>
      ) : null}
    </section>
  );
}