import { useEffect, useState } from "react";
import { ArrowRight, BadgeDollarSign, Clock3, SearchCheck, Sparkles, Tag } from "lucide-react";

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
import heroSavingsCutout from "@/assets/hero-savings-cutout.png";
import heroUrgencyCutout from "@/assets/hero-urgency-cutout.png";

const SLIDE_COUNT = 5;

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
            <div className="relative min-h-[560px] overflow-hidden rounded-xl bg-hero-gradient px-6 py-11 md:min-h-[440px] md:px-14 md:py-16">
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
                className="pointer-events-none absolute -bottom-5 right-0 h-auto w-[92%] object-contain drop-shadow-2xl md:-bottom-10 md:-right-20 md:w-[54%] lg:-bottom-14 lg:-right-16"
              />
            </div>
          </CarouselItem>

          <CarouselItem>
            <div className="relative min-h-[560px] overflow-hidden rounded-xl bg-primary-gradient px-6 py-10 md:min-h-[440px] md:px-14 md:py-16">
              <div className="relative z-10 max-w-2xl md:max-w-[58%]">
                <span className="inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase text-ink-foreground shadow-card">
                  <Clock3 className="size-3.5" /> Oferta por tempo limitado
                </span>
                <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink md:text-5xl">
                  Os menores preços não esperam.
                </h2>
                <p className="mt-3 max-w-xl text-sm font-medium text-ink/80 md:text-base">
                  Preços mudam o tempo todo. Compare agora e garanta a melhor oferta antes que ela suma.
                </p>
                <Button variant="ink" className="mt-6 rounded-full px-6" onClick={() => onSearch("ofertas do dia")}>
                  Ver ofertas agora <ArrowRight className="size-4" />
                </Button>
              </div>
              <div className="pointer-events-none absolute -bottom-2 right-0 w-[82%] md:-bottom-10 md:-right-10 md:w-[47%]">
                <span className="absolute right-5 top-4 z-10 inline-flex rotate-3 items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-bold uppercase text-primary shadow-lift md:right-10 md:top-8">
                  <Clock3 className="size-3.5" /> Preços podem mudar
                </span>
                <img
                  src={heroUrgencyCutout}
                  alt="Fone de ouvido e relógio inteligente em destaque"
                  loading="lazy"
                  width={1200}
                  height={912}
                  className="h-auto w-full object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </CarouselItem>

          <CarouselItem>
            <div className="relative min-h-[570px] overflow-hidden rounded-xl bg-background px-6 py-10 ring-1 ring-border md:min-h-[440px] md:px-14 md:py-16">
              <div className="relative z-10 max-w-2xl md:max-w-[57%]">
                <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase text-accent-foreground">
                  <SearchCheck className="size-3.5 text-primary" /> Quem compara, escolhe melhor
                </span>
                <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink md:text-5xl">
                  Comprar bem começa por comparar.
                </h2>
                <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
                  Confira ofertas de lojas confiáveis e escolha com mais informação, segurança e economia.
                </p>
                <Button variant="hero" className="mt-6 rounded-full px-6" onClick={() => onSearch("mais buscados")}>
                  Comparar e economizar <ArrowRight className="size-4" />
                </Button>
              </div>
              <img
                src={heroProductCutout}
                alt="Celular, tênis e fone de ouvido entre produtos populares"
                loading="lazy"
                width={1400}
                height={900}
                className="pointer-events-none absolute -bottom-4 right-0 h-auto w-[90%] object-contain drop-shadow-2xl md:-bottom-10 md:-right-14 md:w-[50%]"
              />
            </div>
          </CarouselItem>

          <CarouselItem>
            <div className="relative min-h-[570px] overflow-hidden rounded-xl bg-ink px-6 py-10 md:min-h-[440px] md:px-14 md:py-16">
              <div className="relative z-10 max-w-2xl md:max-w-[58%]">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase text-primary-foreground">
                  <BadgeDollarSign className="size-3.5" /> Mesmo produto, preço diferente
                </span>
                <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink-foreground md:text-5xl">
                  Por que pagar mais pelo mesmo produto?
                </h2>
                <p className="mt-3 max-w-xl text-sm text-ink-foreground/80 md:text-base">
                  Encontramos o mesmo item por um preço menor em outra loja confiável. Vale a pena checar.
                </p>
                <Button className="mt-6 rounded-full px-6" onClick={() => onSearch("menor preço")}>
                  Encontrar o menor preço <ArrowRight className="size-4" />
                </Button>
              </div>
              <div className="pointer-events-none absolute -bottom-3 right-0 w-[77%] md:-bottom-16 md:right-0 md:w-[43%]">
                <div className="absolute left-0 top-8 z-10 rounded-lg bg-card px-3 py-2 shadow-lift md:left-1 md:top-16">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">Compare antes</p>
                  <p className="text-sm font-bold text-foreground line-through decoration-primary">Preço maior</p>
                  <p className="text-base font-extrabold text-primary">Menor preço</p>
                </div>
                <img
                  src={heroSavingsCutout}
                  alt="Air fryer em destaque para comparação de preços"
                  loading="lazy"
                  width={1104}
                  height={912}
                  className="h-auto w-full object-contain drop-shadow-2xl"
                />
              </div>
            </div>
          </CarouselItem>
        </CarouselContent>

        <CarouselPrevious className="left-3 hidden md:flex" />
        <CarouselNext className="right-3 hidden md:flex" />
      </Carousel>

      <div className="mt-3 flex justify-center gap-2">
        {Array.from({ length: SLIDE_COUNT }, (_, index) => index).map((index) => (
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
