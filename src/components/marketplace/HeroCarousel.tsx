import { useEffect, useState, type ComponentType } from "react";
import {
  ArrowRight,
  Dumbbell,
  ExternalLink,
  Scale,
  Search,
  SearchCheck,
  Store,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link } from '@tanstack/react-router';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import heroKabumDesktopAsset from "@/assets/banners/hero-kabum-desktop.webp.asset.json";
import heroKabumMobileAsset from "@/assets/banners/hero-kabum-mobile.webp.asset.json";
import heroNikeDesktopAsset from "@/assets/banners/hero-nike-desktop.webp.asset.json";
import heroNikeMobileAsset from "@/assets/banners/hero-nike-mobile.webp.asset.json";

type BannerAction =
  | { type: "page"; value: '/ofertas' }
  | { type: "store"; value: "Kabum BR" | "Nike BR" };

type BannerImage = {
  desktop: string;
  mobile: string;
  alt: string;
  width: number;
  height: number;
};

type HomeBanner = {
  id: string;
  active: boolean;
  eyebrow: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  buttonLabel: string;
  action: BannerAction;
  backgroundClass: string;
  image?: BannerImage;
  primary?: boolean;
  partner?: boolean;
  steps?: Array<{ title: string; description: string; icon: ComponentType<{ className?: string }> }>;
};

export const HOME_BANNERS: HomeBanner[] = [
  {
    id: "kabum",
    active: true,
    partner: true,
    eyebrow: "Tecnologia KaBuM",
    icon: Store,
    title: "Notebooks, monitores e placas de vídeo na KaBuM",
    description: "Veja produtos populares da KaBuM e compare preços antes de escolher.",
    buttonLabel: "Ver ofertas da KaBuM",
    action: { type: "store", value: "Kabum BR" },
    backgroundClass: "bg-electronics-gradient",
    image: {
      desktop: heroKabumDesktopAsset.url,
      mobile: heroKabumMobileAsset.url,
      alt: "Notebook Lenovo, monitor ASUS e placas de vídeo Gigabyte RTX 5070 Ti e RTX 5060 Ti",
      width: 1408,
      height: 912,
    },
  },
  {
    id: "nike",
    active: true,
    partner: true,
    eyebrow: "Esporte e estilo Nike",
    icon: Dumbbell,
    title: "Tênis e roupas esportivas Nike",
    description: "Descubra produtos populares da Nike e compare ofertas antes de escolher.",
    buttonLabel: "Ver ofertas da Nike",
    action: { type: "store", value: "Nike BR" },
    backgroundClass: "bg-sports-gradient",
    image: {
      desktop: heroNikeDesktopAsset.url,
      mobile: heroNikeMobileAsset.url,
      alt: "Tênis Nike Downshifter 12, Journey Run SE, Dunk Low e Total 90",
      width: 1408,
      height: 912,
    },
  },
  {
    id: "como-funciona",
    active: true,
    eyebrow: "Como funciona",
    icon: SearchCheck,
    title: "Busque, compare e vá à loja",
    description: "Pesquise ofertas de lojas parceiras em um só lugar e finalize a compra no site da loja.",
    buttonLabel: "Explorar ofertas",
    action: { type: "page", value: '/ofertas' },
    backgroundClass: "bg-beauty-gradient",
    steps: [
      { title: "Busque o produto", description: "Digite o que você procura.", icon: Search },
      { title: "Compare as ofertas", description: "Veja preços e condições disponíveis.", icon: Scale },
      { title: "Vá até a loja", description: "Finalize a compra no site parceiro.", icon: ExternalLink },
    ],
  },];

const ACTIVE_BANNERS = HOME_BANNERS.filter((banner) => banner.active);

function BannerPicture({ image, eager = false }: { image: BannerImage; eager?: boolean }) {
  return (
    <picture>
      <source media="(max-width: 767px)" srcSet={image.mobile} />
      <img
        src={image.desktop}
        alt={image.alt}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        width={image.width}
        height={image.height}
        onError={(event) => { event.currentTarget.style.visibility = "hidden"; }}
        className="category-scene-image"
      />
    </picture>
  );
}

export function HeroCarousel({
  onSearch,
  onSelectStore,
}: {
  onSearch: (term: string) => void;
  onSelectStore: (store: string) => void;
}) {
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
    <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8" aria-label="Destaques">
      <Carousel setApi={setApi} opts={{ loop: true }}>
        <CarouselContent>
          {ACTIVE_BANNERS.map((banner, index) => {
            const EyebrowIcon = banner.icon;
            const Heading = index === 0 ? "h1" : "h2";
            return (
              <CarouselItem key={banner.id} data-banner-id={banner.id}>
                <div
                  className={cn(
                    "relative overflow-hidden rounded-xl px-6 py-10 md:min-h-[440px] md:px-14 md:py-16",
                    banner.primary ? "min-h-[390px] py-11" : banner.partner ? "min-h-[680px]" : "min-h-[570px]",
                    banner.steps && "min-h-[590px]",
                    banner.backgroundClass,
                  )}
                >
                  {banner.image ? <BannerPicture image={banner.image} eager={index === 0} /> : null}
                  {banner.primary ? <div className="absolute inset-0 bg-hero-scrim" /> : null}
                  <div
                    className={cn(
                      "relative z-10",
                      banner.steps ? "mx-auto max-w-4xl text-center" : "max-w-2xl md:max-w-[58%]",
                    )}
                  >
                    <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1.5 text-xs font-semibold uppercase text-ink shadow-card">
                      <EyebrowIcon className="size-3.5 text-primary" /> {banner.eyebrow}
                    </span>
                    <Heading
                      className={cn(
                        "mt-4 font-display text-3xl font-extrabold leading-tight text-ink",
                        banner.primary ? "md:text-5xl" : "md:text-4xl",
                      )}
                    >
                      {banner.title}
                    </Heading>
                    <p className={cn("mt-3 text-sm font-medium leading-6 text-ink/75 md:text-base", banner.steps && "mx-auto max-w-2xl")}>
                      {banner.description}
                    </p>
                    {banner.steps ? (
                      <ol className="mt-6 grid gap-3 text-left sm:grid-cols-3">
                        {banner.steps.map((step, stepIndex) => {
                          const StepIcon = step.icon;
                          return (
                            <li key={step.title} className="flex items-start gap-3 rounded-lg bg-card/80 p-4 shadow-card sm:block sm:text-center">
                              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground sm:mx-auto">
                                <StepIcon className="size-5" />
                              </span>
                              <div className="sm:mt-3">
                                <p className="text-sm font-bold text-ink">{stepIndex + 1}. {step.title}</p>
                                <p className="mt-1 text-xs leading-5 text-ink/70">{step.description}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    ) : null}
                    <Button
                      variant="hero"
                      className="mt-6 rounded-full px-6"
                      asChild
                    >
                      {banner.action.type==='store'?<Link to="/lojas-monitoradas" search={{loja:banner.action.value}}>{banner.buttonLabel} <ArrowRight className="size-4" /></Link>:<Link to="/ofertas">{banner.buttonLabel} <ArrowRight className="size-4" /></Link>}
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="left-3 hidden md:flex" />
        <CarouselNext className="right-3 hidden md:flex" />
      </Carousel>

      <div className="mt-3 flex justify-center gap-2">
        {ACTIVE_BANNERS.map((banner, index) => (
          <button
            key={banner.id}
            type="button"
            aria-label={`Ir para o banner ${index + 1}`}
            aria-current={current === index ? "true" : undefined}
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
