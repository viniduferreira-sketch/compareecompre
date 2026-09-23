import { useEffect, useState } from "react";
import { ArrowRight, Camera, Dumbbell, Gamepad2, House, Shirt, Smartphone, Sparkles } from "lucide-react";

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
import heroBeautyCutout from "@/assets/hero-beauty-cutout.png";
import heroElectronicsCutout from "@/assets/hero-electronics-cutout.png";
import heroFashionCutout from "@/assets/hero-fashion-cutout.png";
import heroGamingCutout from "@/assets/hero-gaming-cutout.png";
import heroKitchenCutout from "@/assets/hero-kitchen-cutout.png";
import heroPhonesCutout from "@/assets/hero-phones-cutout.png";
import heroSportsCutout from "@/assets/hero-sports-cutout.png";

const SLIDE_COUNT = 8;

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
            <div className="relative min-h-[570px] overflow-hidden rounded-xl bg-beauty-gradient px-6 py-10 md:min-h-[440px] md:px-14 md:py-16">
              <div className="relative z-10 max-w-2xl md:max-w-[64%]">
                <span className="inline-flex items-center gap-2 rounded-full bg-card/75 px-3 py-1 text-xs font-semibold uppercase text-ink shadow-card">
                  <Sparkles className="size-3.5 text-primary" /> Beleza sem pagar caro
                </span>
                <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink md:text-4xl">
                  O perfume que você quer, pelo preço que faz sentido.
                </h2>
                <p className="mt-3 max-w-xl text-sm text-ink/75 md:text-base">
                  Comparamos preços em dezenas de lojas de beleza pra você economizar sem abrir mão da qualidade.
                </p>
                <Button
                  variant="hero"
                  className="mt-6 rounded-full px-6"
                  onClick={() => onSearch("beleza")}
                >
                  Comparar produtos de beleza <ArrowRight className="size-4" />
                </Button>
              </div>
              <img
                src={heroBeautyCutout}
                alt="Perfume, sérum facial e paleta de maquiagem"
                loading="lazy"
                width={1408}
                height={912}
                className="pointer-events-none absolute -bottom-2 right-1 h-auto w-[83%] object-contain drop-shadow-2xl md:-bottom-5 md:-right-8 md:w-[43%] lg:right-2 lg:w-[40%]"
              />
            </div>
          </CarouselItem>

          <CarouselItem>
            <div className="relative min-h-[590px] overflow-hidden rounded-xl bg-kitchen-gradient px-6 py-10 md:min-h-[440px] md:px-14 md:py-16">
              <div className="relative z-10 max-w-2xl md:max-w-[64%]">
                <span className="inline-flex items-center gap-2 rounded-full bg-card/75 px-3 py-1 text-xs font-semibold uppercase text-ink shadow-card">
                  <House className="size-3.5 text-primary" /> Para sua cozinha
                </span>
                <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink md:text-4xl">
                  Equipar a cozinha custando menos? A gente compara por você.
                </h2>
                <p className="mt-3 max-w-xl text-sm font-medium text-ink/75 md:text-base">
                  Da cafeteira ao liquidificador: encontramos o menor preço nas lojas mais confiáveis do Brasil.
                </p>
                <Button variant="hero" className="mt-6 rounded-full px-6" onClick={() => onSearch("casa e cozinha")}>
                  Comparar preços de casa <ArrowRight className="size-4" />
                </Button>
              </div>
              <img
                src={heroKitchenCutout}
                alt="Cafeteira, liquidificador e torradeira"
                loading="lazy"
                width={1408}
                height={912}
                className="pointer-events-none absolute -bottom-1 right-1 h-auto w-[88%] object-contain drop-shadow-2xl md:-bottom-5 md:-right-8 md:w-[44%] lg:right-2 lg:w-[41%]"
              />
            </div>
          </CarouselItem>

          <CarouselItem>
            <div className="relative min-h-[570px] overflow-hidden rounded-xl bg-electronics-gradient px-6 py-10 md:min-h-[440px] md:px-14 md:py-16">
              <div className="relative z-10 max-w-2xl md:max-w-[61%]">
                <span className="inline-flex items-center gap-2 rounded-full bg-card/75 px-3 py-1 text-xs font-semibold uppercase text-ink shadow-card">
                  <Camera className="size-3.5 text-primary" /> Tecnologia em conta
                </span>
                <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink md:text-4xl">
                  Tecnologia boa não precisa custar caro.
                </h2>
                <p className="mt-3 max-w-xl text-sm text-ink/75 md:text-base">
                  Comparamos preço, loja e prazo pra você escolher o eletrônico certo sem gastar mais do que devia.
                </p>
                <Button variant="hero" className="mt-6 rounded-full px-6" onClick={() => onSearch("Eletrônicos")}>
                  Comparar eletrônicos <ArrowRight className="size-4" />
                </Button>
              </div>
              <img
                src={heroElectronicsCutout}
                alt="Caixa de som Bluetooth, tablet e câmera de ação"
                loading="lazy"
                width={1408}
                height={912}
                className="pointer-events-none absolute -bottom-1 right-0 h-auto w-[88%] object-contain drop-shadow-2xl md:-bottom-5 md:-right-8 md:w-[44%] lg:right-1 lg:w-[41%]"
              />
            </div>
          </CarouselItem>

          <CarouselItem>
            <div className="relative min-h-[590px] overflow-hidden rounded-xl bg-phones-gradient px-6 py-10 md:min-h-[440px] md:px-14 md:py-16">
              <div className="relative z-10 max-w-2xl md:max-w-[62%]">
                <span className="inline-flex items-center gap-2 rounded-full bg-card/75 px-3 py-1 text-xs font-semibold uppercase text-ink shadow-card">
                  <Smartphone className="size-3.5 text-primary" /> Seu próximo celular, mais barato
                </span>
                <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink md:text-4xl">
                  Antes de trocar de celular, compare o preço em segundos.
                </h2>
                <p className="mt-3 max-w-xl text-sm text-ink/75 md:text-base">
                  Reunimos as melhores ofertas de celulares e acessórios em lojas oficiais e verificadas.
                </p>
                <Button variant="ink" className="mt-6 rounded-full px-6" onClick={() => onSearch("Celulares")}>
                  Comparar celulares <ArrowRight className="size-4" />
                </Button>
              </div>
              <img
                src={heroPhonesCutout}
                alt="Smartphone, fones intra-auriculares e carregador portátil"
                loading="lazy"
                width={1408}
                height={912}
                className="pointer-events-none absolute -bottom-1 right-0 h-auto w-[86%] object-contain drop-shadow-2xl md:-bottom-6 md:-right-8 md:w-[43%] lg:right-1 lg:w-[40%]"
              />
            </div>
          </CarouselItem>

          <CarouselItem>
            <div className="relative min-h-[590px] overflow-hidden rounded-xl bg-gaming-gradient px-6 py-10 md:min-h-[440px] md:px-14 md:py-16">
              <div className="relative z-10 max-w-2xl md:max-w-[60%]">
                <span className="inline-flex items-center gap-2 rounded-full bg-card/75 px-3 py-1 text-xs font-semibold uppercase text-ink shadow-card">
                  <Gamepad2 className="size-3.5 text-primary" /> Para quem vive o jogo
                </span>
                <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink md:text-4xl">
                  Seu setup de gamer, pelo menor preço do Brasil.
                </h2>
                <p className="mt-3 max-w-xl text-sm text-ink/75 md:text-base">
                  De console a periférico: comparamos preços pra você jogar mais e gastar menos.
                </p>
                <Button variant="hero" className="mt-6 rounded-full px-6" onClick={() => onSearch("Games")}>
                  Comparar produtos gamer <ArrowRight className="size-4" />
                </Button>
              </div>
              <img
                src={heroGamingCutout}
                alt="Console de videogame, headset gamer e teclado mecânico"
                loading="lazy"
                width={1408}
                height={912}
                className="pointer-events-none absolute bottom-0 right-0 h-auto w-[90%] object-contain drop-shadow-2xl md:-bottom-4 md:-right-10 md:w-[47%] lg:right-0 lg:w-[43%]"
              />
            </div>
          </CarouselItem>

          <CarouselItem>
            <div className="relative min-h-[610px] overflow-hidden rounded-xl bg-sports-gradient px-6 py-10 md:min-h-[440px] md:px-14 md:py-16">
              <div className="relative z-10 max-w-2xl md:max-w-[65%]">
                <span className="inline-flex items-center gap-2 rounded-full bg-card/75 px-3 py-1 text-xs font-semibold uppercase text-ink shadow-card">
                  <Dumbbell className="size-3.5 text-primary" /> Para sua próxima meta
                </span>
                <h2 className="mt-4 font-display text-2xl font-extrabold leading-tight text-ink sm:text-3xl md:text-4xl">
                  Todo treino começa com o equipamento certo — e no preço certo.
                </h2>
                <p className="mt-3 max-w-xl text-sm text-ink/75 md:text-base">
                  Comparamos preços de tênis, roupas e acessórios esportivos nas melhores lojas do Brasil.
                </p>
                <Button variant="ink" className="mt-6 rounded-full px-6" onClick={() => onSearch("Esportes")}>
                  Comparar artigos esportivos <ArrowRight className="size-4" />
                </Button>
              </div>
              <img
                src={heroSportsCutout}
                alt="Tênis de corrida, garrafa térmica e relógio esportivo"
                loading="lazy"
                width={1408}
                height={912}
                className="pointer-events-none absolute bottom-0 right-0 h-auto w-[91%] object-contain drop-shadow-2xl md:-bottom-4 md:-right-8 md:w-[45%] lg:right-1 lg:w-[42%]"
              />
            </div>
          </CarouselItem>

          <CarouselItem>
            <div className="relative min-h-[590px] overflow-hidden rounded-xl bg-fashion-gradient px-6 py-10 md:min-h-[440px] md:px-14 md:py-16">
              <div className="relative z-10 max-w-2xl md:max-w-[61%]">
                <span className="inline-flex items-center gap-2 rounded-full bg-card/75 px-3 py-1 text-xs font-semibold uppercase text-ink shadow-card">
                  <Shirt className="size-3.5 text-primary" /> Estilo que cabe no bolso
                </span>
                <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink md:text-4xl">
                  A peça que você quer, na loja que cobra menos por ela.
                </h2>
                <p className="mt-3 max-w-xl text-sm text-ink/75 md:text-base">
                  Comparamos preços de roupas, calçados e acessórios pra você renovar o guarda-roupa sem gastar mais.
                </p>
                <Button variant="hero" className="mt-6 rounded-full px-6" onClick={() => onSearch("Moda")}>
                  Comparar moda <ArrowRight className="size-4" />
                </Button>
              </div>
              <img
                src={heroFashionCutout}
                alt="Jaqueta, bolsa e óculos de sol"
                loading="lazy"
                width={1408}
                height={912}
                className="pointer-events-none absolute bottom-0 right-0 h-auto w-[86%] object-contain drop-shadow-2xl md:-bottom-5 md:-right-7 md:w-[43%] lg:right-1 lg:w-[40%]"
              />
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
