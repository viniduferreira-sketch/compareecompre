import { useEffect, useState, type ComponentType } from "react";
import {
  ArrowRight,
  Camera,
  Dumbbell,
  ExternalLink,
  Gamepad2,
  House,
  Scale,
  Search,
  SearchCheck,
  Shirt,
  Smartphone,
  Sparkles,
  Store,
} from "lucide-react";

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
import heroImageDesktop from "@/assets/banners/home-commerce-hero-desktop.webp";
import heroImageMobile from "@/assets/banners/home-commerce-hero-mobile.webp";
import heroBeautyDesktop from "@/assets/banners/hero-beauty-scene-desktop.webp";
import heroBeautyMobile from "@/assets/banners/hero-beauty-scene-mobile.webp";
import heroGamingDesktop from "@/assets/banners/hero-gaming-scene-desktop.webp";
import heroGamingMobile from "@/assets/banners/hero-gaming-scene-mobile.webp";
import heroPhonesDesktop from "@/assets/banners/hero-phones-scene-desktop.webp";
import heroPhonesMobile from "@/assets/banners/hero-phones-scene-mobile.webp";
import heroKabumDesktopAsset from "@/assets/banners/hero-kabum-desktop.webp.asset.json";
import heroKabumMobileAsset from "@/assets/banners/hero-kabum-mobile.webp.asset.json";
import heroNikeDesktopAsset from "@/assets/banners/hero-nike-desktop.webp.asset.json";
import heroNikeMobileAsset from "@/assets/banners/hero-nike-mobile.webp.asset.json";
import heroElectronicsScene from "@/assets/hero-electronics-scene.jpg";
import heroFashionScene from "@/assets/hero-fashion-scene.jpg";
import heroKitchenScene from "@/assets/hero-kitchen-scene.jpg";
import heroSportsScene from "@/assets/hero-sports-scene.jpg";

type BannerAction =
  | { type: "search"; value: string }
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
    id: "principal",
    active: true,
    primary: true,
    eyebrow: "Escolha inteligente",
    icon: Sparkles,
    title: "Não compre antes de comparar.",
    description: "Compare preços em várias lojas e escolha a oferta que faz sentido para você.",
    buttonLabel: "Comparar preços",
    action: { type: "search", value: "ofertas do dia" },
    backgroundClass: "bg-card",
    image: {
      desktop: heroImageDesktop,
      mobile: heroImageMobile,
      alt: "Produtos de tecnologia e casa comparados pelo Compare e Compre",
      width: 1600,
      height: 912,
    },
  },
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
    action: { type: "search", value: "ofertas do dia" },
    backgroundClass: "bg-beauty-gradient",
    steps: [
      { title: "Busque o produto", description: "Digite o que você procura.", icon: Search },
      { title: "Compare as ofertas", description: "Veja preços e condições disponíveis.", icon: Scale },
      { title: "Vá até a loja", description: "Finalize a compra no site parceiro.", icon: ExternalLink },
    ],
  },
  {
    id: "beleza",
    active: true,
    eyebrow: "Beleza para sua rotina",
    icon: Sparkles,
    title: "O perfume que você quer, pelo preço que faz sentido.",
    description: "Compare preços em várias lojas e encontre ofertas de beleza para sua rotina.",
    buttonLabel: "Comparar produtos de beleza",
    action: { type: "search", value: "beleza" },
    backgroundClass: "bg-beauty-gradient",
    image: {
      desktop: heroBeautyDesktop,
      mobile: heroBeautyMobile,
      alt: "Perfume, sérum facial e paleta de maquiagem sobre uma superfície de mármore rosado",
      width: 1408,
      height: 912,
    },
  },
  {
    id: "celulares",
    active: true,
    eyebrow: "Celulares e acessórios",
    icon: Smartphone,
    title: "Antes de trocar de celular, compare preços em segundos.",
    description: "Compare preços de celulares e acessórios em ofertas de lojas parceiras.",
    buttonLabel: "Comparar celulares",
    action: { type: "search", value: "Celulares" },
    backgroundClass: "bg-phones-gradient",
    image: {
      desktop: heroPhonesDesktop,
      mobile: heroPhonesMobile,
      alt: "Smartphone, fones intra-auriculares e carregador portátil em um pedestal",
      width: 1408,
      height: 912,
    },
  },
  {
    id: "games",
    active: true,
    eyebrow: "Para quem vive o jogo",
    icon: Gamepad2,
    title: "Seu setup gamer começa com uma boa comparação.",
    description: "Compare preços de consoles, jogos e periféricos em várias lojas parceiras.",
    buttonLabel: "Comparar produtos gamer",
    action: { type: "search", value: "Games" },
    backgroundClass: "bg-gaming-gradient",
    image: {
      desktop: heroGamingDesktop,
      mobile: heroGamingMobile,
      alt: "Console, headset gamer e teclado mecânico em uma mesa com iluminação violeta",
      width: 1408,
      height: 912,
    },
  },
  {
    id: "cozinha",
    active: false,
    eyebrow: "Para sua cozinha",
    icon: House,
    title: "Equipar a cozinha começa com uma boa comparação.",
    description: "Compare preços de cafeteiras, liquidificadores e outros produtos para casa em várias lojas.",
    buttonLabel: "Comparar preços de casa",
    action: { type: "search", value: "casa e cozinha" },
    backgroundClass: "bg-kitchen-gradient",
    image: {
      desktop: heroKitchenScene,
      mobile: heroKitchenScene,
      alt: "Cafeteira, liquidificador e torradeira em uma cozinha verde-sálvia",
      width: 1408,
      height: 912,
    },
  },
  {
    id: "eletronicos",
    active: false,
    eyebrow: "Tecnologia para comparar",
    icon: Camera,
    title: "Encontre a tecnologia que combina com você.",
    description: "Compare preços e condições de eletrônicos em ofertas de lojas parceiras.",
    buttonLabel: "Comparar eletrônicos",
    action: { type: "search", value: "Eletrônicos" },
    backgroundClass: "bg-electronics-gradient",
    image: {
      desktop: heroElectronicsScene,
      mobile: heroElectronicsScene,
      alt: "Caixa de som Bluetooth, tablet e câmera de ação em uma prateleira clara",
      width: 1408,
      height: 912,
    },
  },
  {
    id: "esportes",
    active: false,
    eyebrow: "Para sua próxima meta",
    icon: Dumbbell,
    title: "Todo treino começa com o equipamento certo.",
    description: "Compare preços de tênis, roupas e acessórios esportivos em várias lojas parceiras.",
    buttonLabel: "Comparar artigos esportivos",
    action: { type: "search", value: "Esportes" },
    backgroundClass: "bg-sports-gradient",
    image: {
      desktop: heroSportsScene,
      mobile: heroSportsScene,
      alt: "Tênis de corrida, garrafa térmica e relógio esportivo junto a uma pista",
      width: 1408,
      height: 912,
    },
  },
  {
    id: "moda",
    active: false,
    eyebrow: "Estilo para comparar",
    icon: Shirt,
    title: "Encontre a peça que você quer e compare ofertas.",
    description: "Compare preços de roupas, calçados e acessórios em várias lojas parceiras.",
    buttonLabel: "Comparar moda",
    action: { type: "search", value: "Moda" },
    backgroundClass: "bg-fashion-gradient",
    image: {
      desktop: heroFashionScene,
      mobile: heroFashionScene,
      alt: "Jaqueta, bolsa e óculos de sol sobre uma superfície de mármore claro",
      width: 1408,
      height: 912,
    },
  },
];

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

  const runAction = (action: BannerAction) => {
    if (action.type === "store") onSelectStore(action.value);
    else onSearch(action.value);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8" aria-label="Destaques">
      <Carousel setApi={setApi} opts={{ loop: true }}>
        <CarouselContent>
          {ACTIVE_BANNERS.map((banner, index) => {
            const EyebrowIcon = banner.icon;
            const Heading = banner.primary ? "h1" : "h2";
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
                      onClick={() => runAction(banner.action)}
                    >
                      {banner.buttonLabel} <ArrowRight className="size-4" />
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
