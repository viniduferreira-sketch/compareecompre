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
import heroImage from "@/assets/home-commerce-hero.jpg";
import heroProductCutout from "@/assets/hero-product-cutout.png";

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
    <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
      <Carousel setApi={setApi} opts={{ loop: true }}>
        <CarouselContent>
          <CarouselItem>
            <div className="relative min-h-[390px] overflow-hidden rounded-xl bg-card px-6 py-11 md:min-h-[440px] md:px-14 md:py-16">
              <img src={heroImage} alt="Produtos de tecnologia e casa comparados pelo Compare e Compre" width={1600} height={900} className="absolute inset-0 h-full w-full object-cover object-center" />
              <div className="absolute inset-0 bg-hero-scrim" />
              <div className="relative max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-md bg-card/90 px-3 py-1.5 text-xs font-bold uppercase text-foreground shadow-card">
                <Sparkles className="size-3.5 text-primary" /> Escolha inteligente
              </span>
              <h1 className="mt-5 max-w-2xl font-display text-3xl font-extrabold leading-tight text-foreground md:text-5xl">
                Não compre antes de comparar.
              </h1>
              <p className="mt-4 max-w-xl text-base font-medium leading-7 text-foreground/75 md:text-lg">
                Encontramos o menor preço nas melhores lojas do Brasil.
              </p>
              <Button
                variant="hero"
                className="mt-6 rounded-full px-6"
                onClick={() => onSearch("ofertas do dia")}
              >
                Comparar preços <ArrowRight className="size-4" />
              </Button>
              </div>
            </div>
          </CarouselItem>

          {/*
            Padrão para novos banners: sempre incluir recorte de produtos reais, manter a
            tipografia do título e a cor de destaque do botão. O fundo pode variar entre
            gradiente ou cor sólida, desde que preserve contraste com o texto branco.
            Copy: tag curta + título com urgência/facilidade verdadeira (sem prova social
            ou números não comprovados) + benefício concreto + botão com verbo de ação.
          */}
          <CarouselItem>
            <div className="relative min-h-[390px] overflow-hidden rounded-xl bg-hero-gradient px-6 py-11 md:min-h-[440px] md:px-14 md:py-16">
              <div className="relative z-10 max-w-2xl md:max-w-[58%]">
                <span className="inline-flex items-center gap-2 rounded-full bg-ink-foreground/15 px-3 py-1 text-xs font-semibold uppercase text-ink-foreground">
                  <Tag className="size-3.5" /> Compare e Compre
                </span>
                <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink-foreground md:text-5xl">
                  Buscamos em grandes lojas. Você escolhe a melhor oferta.
                </h2>
                <p className="mt-3 max-w-xl text-sm text-ink-foreground/80 md:text-base">
                  Menos tempo procurando, mais confiança para decidir e economia para aproveitar.
                </p>
                <Button
                  className="mt-6 rounded-full bg-ink px-6 text-ink-foreground hover:bg-ink/90"
                  onClick={() => onSearch("Smart TV")}
                >
                  Encontrar menor preço <ArrowRight className="size-4" />
                </Button>
              </div>
              <img
                src={heroProductCutout}
                alt="Celular, tênis e fone de ouvido em destaque"
                width={1400}
                height={900}
                className="pointer-events-none absolute -bottom-10 -right-20 hidden h-auto w-[54%] object-contain drop-shadow-2xl md:block lg:-bottom-14 lg:-right-16"
              />
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
