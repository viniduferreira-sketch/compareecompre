import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export function HeroCarousel({ onSearch }: { onSearch: (term: string) => void }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    const timer = setInterval(() => api.scrollNext(), 6000);
    return () => {
      clearInterval(timer);
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <Carousel setApi={setApi} opts={{ loop: true }}>
        <CarouselContent>
          <CarouselItem>
            <div className="relative min-h-[300px] overflow-hidden rounded-2xl bg-store px-6 py-10 md:min-h-[360px] md:px-14 md:py-16">
              <span className="inline-flex items-center gap-2 rounded-full bg-card/70 px-3 py-1 text-xs font-semibold uppercase text-store-foreground">
                <Sparkles className="size-3.5" /> Parceiro oficial
              </span>
              <h1 className="mt-4 max-w-2xl font-display text-3xl font-extrabold leading-tight text-store-foreground md:text-5xl">
                As melhores ofertas do Mercado Livre estão aqui!
              </h1>
              <p className="mt-3 max-w-xl text-sm text-store-foreground/80 md:text-base">
                Encontre produtos selecionados, descontos e opções com frete grátis.
              </p>
              <Button
                variant="hero"
                className="mt-6 rounded-full px-6"
                onClick={() => onSearch("ofertas")}
              >
                Explorar ofertas <ArrowRight className="size-4" />
              </Button>
            </div>
          </CarouselItem>

          <CarouselItem>
            <div className="relative min-h-[300px] overflow-hidden rounded-2xl bg-hero-gradient px-6 py-10 md:min-h-[360px] md:px-14 md:py-16">
              <span className="inline-flex items-center gap-2 rounded-full bg-ink-foreground/15 px-3 py-1 text-xs font-semibold uppercase text-ink-foreground">
                <Tag className="size-3.5" /> Compare e Compre
              </span>
              <h2 className="mt-4 max-w-2xl font-display text-3xl font-extrabold leading-tight text-ink-foreground md:text-5xl">
                As melhores ofertas estão no Compare e Compre
              </h2>
              <p className="mt-3 max-w-xl text-sm text-ink-foreground/80 md:text-base">
                Busque o que precisa e encontre preços que cabem no seu bolso.
              </p>
              <Button
                className="mt-6 rounded-full bg-ink px-6 text-ink-foreground hover:bg-ink/90"
                onClick={() => onSearch("Smart TV")}
              >
                Aproveitar agora <ArrowRight className="size-4" />
              </Button>
            </div>
          </CarouselItem>
        </CarouselContent>

        <CarouselPrevious className="left-3 hidden md:flex" />
        <CarouselNext className="right-3 hidden md:flex" />
      </Carousel>

      <div className="mt-3 flex justify-center gap-2">
        {[0, 1].map((index) => (
          <button
            key={index}
            type="button"
            aria-label={`Ir para o banner ${index + 1}`}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "h-2 rounded-full transition-all",
              current === index ? "w-6 bg-primary" : "w-2 bg-border",
            )}
          />
        ))}
      </div>
    </section>
  );
}
