import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  ChevronRight,
  ExternalLink,
  Heart,
  Minus,
  Plus,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Header } from "@/components/marketplace/Header";
import {storeSlug} from '@/lib/store-pages';
import { BlogPromotions } from "@/components/marketplace/BlogPromotions";
import { SiteFooter } from "@/components/marketplace/SiteFooter";
import { RelatedAlternatives, RelatedCategory } from "@/components/marketplace/RelatedProducts";
import { productBlogPromotionsQuery } from "@/lib/blog-promotions.queries";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatBRL } from "@/components/marketplace/OfferCard";
import { ProductImage } from "@/components/marketplace/ProductImage";
import { StoreLogo } from "@/components/marketplace/StoreLogo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CompareOffers, FormattedDescription, RatingStars, SpecsTable } from "@/components/marketplace/ProductDetailSections";
import { getProductDetail } from "@/lib/product-detail.functions";
import { recordOutboundClick } from "@/lib/outbound-clicks";
import { hasRealPriceHistory } from '@/lib/product-indexability';

export const Route = createFileRoute("/produto/$id")({
  staticData: { sitemap: true },
  loader: async ({ context, params }) => {
    const product = await getProductDetail({ data: { id: params.id } });
    await context.queryClient.ensureQueryData(productBlogPromotionsQuery(product?.categoryName ?? null));
    return product;
  },
  head: ({ loaderData, params }) => {
    const product = loaderData;
    const title = product
      ? `${product.title.slice(0, 38)} | Compare e Compre`
      : "Detalhes do produto | Compare e Compre";
    const description = product
      ? `Confira ${product.title.slice(0, 70)} na ${product.store.slice(0, 30)}. Veja preço, fotos e informações disponíveis; compre no site da loja.`
      : "Este produto não está disponível no momento. Explore outras ofertas das lojas parceiras no Compare e Compre.";
    const url = `https://compareecompre.com/produto/${encodeURIComponent(params.id)}`;
    const image = product?.images.find((url) => url.startsWith("https://"));
    const validPrice = product?.price && Number.isFinite(product.price) && product.price > 0
      ? product.price
      : null;
    const productSchema = product
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.title,
          ...(product.description ? { description: product.description } : {}),
          sku: product.id,
          ...(product.images.length > 0 ? { image: product.images } : {}),
          ...(validPrice
            ? {
                offers: {
                  "@type": "Offer",
                  priceCurrency: "BRL",
                  price: validPrice.toFixed(2),
                  availability: product.status === "unavailable" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
                  url: product.affiliateUrl,
                  seller: {
                    "@type": "Organization",
                    name: product.store,
                  },
                },
              }
            : {}),
        }
      : null;
    const answeredQA = product?.qa.filter((item) => item.resposta) ?? [];
    const faqSchema = answeredQA.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: answeredQA.map((item) => ({
            "@type": "Question",
            name: item.pergunta,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.resposta,
            },
          })),
        }
      : null;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: product?.seoIndexable ? "index, follow" : "noindex, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [productSchema, faqSchema].flatMap((schema) =>
        schema
          ? [{
              type: "application/ld+json",
              children: JSON.stringify(schema).replace(/</g, "\\u003c"),
            }]
          : [],
      ),
    };
  },
  component: ProductPage,
});

const PERIODS = [
  { label: "40 dias", days: 40 },
  { label: "3 meses", days: 90 },
  { label: "6 meses", days: 180 },
  { label: "1 ano", days: 365 },
];

function prettyCategory(domain: string | null) {
  if (!domain) return "Produtos";
  const raw = domain.split("-").slice(1).join(" ").toLowerCase().replace(/_/g, " ");
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Produtos";
}

function formatQADate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function ProductPage() {
  const data = Route.useLoaderData();
  const { data: blogPosts } = useSuspenseQuery(productBlogPromotionsQuery(data?.categoryName ?? null));
  const navigate = Route.useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [period, setPeriod] = useState(PERIODS[0]?.days ?? 40);

  const history = useMemo(
    () => (data?.priceHistory ?? []).filter(point => Date.parse(point.date) >= Date.now() - period * 86400000)
      .map(point => ({ ...point, date: new Date(point.date).toLocaleDateString("pt-BR", { timeZone: "UTC" }) })),
    [data?.priceHistory, period],
  );

  const attribute = (needle: string) =>
    data?.attributes.find((item) => item.name.toLowerCase().includes(needle))?.value ?? "—";

  return (
    <div className="min-h-screen bg-background">
      <Header
        initialTerm=""
        onSearch={(value) => navigate({ to: "/", search: { q: value } })}
      />

      <main className="mx-auto max-w-5xl px-5 py-8 text-sm sm:px-8 lg:px-12">
        {!data ? (
          <p className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Não encontramos os detalhes deste produto.{" "}
            <Link to="/" className="text-primary underline">
              Voltar para a home
            </Link>
          </p>
        ) : data.status === "unavailable" ? (
          <>
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <h1 className="font-display text-lg font-bold text-graphite">Este produto não está mais disponível</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {data.stale ? `Não confirmamos a atualização de "${data.title}" há mais de sete dias.` : `A oferta de "${data.title}" foi encerrada ou está sem estoque na loja parceira.`}
            </p>
            <Button asChild className="mt-5 bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to="/" search={{ q: data.categoryName ?? data.title.split(" ").slice(0, 3).join(" ") }}>
                Buscar ofertas em {data.categoryName ?? "produtos similares"}
              </Link>
            </Button>
          </div>
          <RelatedCategory key={`unavailable-${data.id}`} id={data.id} />
          </>
        ) : (
          <>
            <nav aria-label="Trilha de navegação" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">
                Home
              </Link>
              <ChevronRight className="size-3" />
              <span className="hover:text-foreground">{prettyCategory(data.category)}</span>
              <ChevronRight className="size-3" />
              <span className="text-foreground/70">{data.title.split(" ").slice(0, 4).join(" ")}</span>
            </nav>

            <header className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 lg:flex lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h1 className="font-display text-lg font-bold leading-tight text-graphite sm:text-xl">
                  {data.title}
                </h1>
                {data.rating ? <RatingStars rating={data.rating} /> : null}
                {data.officialStore ? (
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-seal-border bg-seal-soft px-3 py-1.5 text-xs font-semibold text-seal-foreground">
                    <BadgeCheck className="size-5 fill-seal text-seal-soft" strokeWidth={2} aria-hidden /> Loja oficial
                  </span>
                ) : data.sellerName ? (
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                    Vendido por {data.sellerName}{data.sellerLevel ? ` · reputação ${data.sellerLevel}` : ""}
                  </span>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-full"
                  aria-pressed={favorite}
                  aria-label="Favoritar"
                  onClick={() => setFavorite((value) => !value)}
                >
                  <Heart className={cn("size-3.5", favorite && "fill-destructive text-destructive")} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-full"
                  aria-label="Compartilhar"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.share) {
                      void navigator.share({ title: data.title, url: window.location.href });
                    } else if (typeof navigator !== "undefined") {
                      void navigator.clipboard?.writeText(window.location.href);
                    }
                  }}
                >
                  <Share2 className="size-3.5" />
                </Button>
              </div>
            </header>

            <section className="mt-5 grid items-start gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="mx-auto flex aspect-square max-w-[320px] items-center justify-center overflow-hidden rounded-lg bg-muted/40">
                  <ProductImage src={data.images[activeImage]} alt={data.title} className="h-full w-full object-contain p-4" />
                </div>

                {data.images.length > 1 ? (
                  <div className="mt-3 flex justify-center gap-2 overflow-x-auto pb-1">
                    {data.images.map((image, index) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        aria-label={`Ver imagem ${index + 1}`}
                        className={cn(
                          "size-11 shrink-0 overflow-hidden rounded-lg border bg-card p-1 transition-colors",
                          index === activeImage ? "border-primary" : "border-border hover:border-primary/50",
                        )}
                      >
                        <ProductImage src={image} alt="" className="h-full w-full object-contain" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap gap-1.5">
                  {data.discountPercent && data.discountPercent > 0 ? (
                    <span className="inline-block rounded-md bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground">
                      {data.discountPercent}% OFF
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    {data.originalPrice ? (
                      <p className="text-xs text-muted-foreground line-through">
                        {formatBRL(data.originalPrice)}
                      </p>
                    ) : null}
                    <p className="font-display text-2xl font-bold text-foreground">
                      {data.price ? formatBRL(data.price) : "Indisponível"}
                    </p>
                    {data.freeShipping ? (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-savings">
                        <Truck className="size-3.5" /> Frete grátis
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 text-xs text-muted-foreground sm:items-end sm:text-right">
                    <StoreLogo store={data.store} logoUrl={data.storeLogoUrl} className="h-10 w-28 rounded-md" />
                    <p>Melhor oferta em: <Link to="/loja/$slug" params={{slug:storeSlug(data.store)}} className="font-semibold text-foreground hover:underline">{data.store}</Link></p>
                  </div>
                </div>

                <Button className="mt-4 h-10 w-full rounded-md bg-brand text-sm text-brand-foreground hover:bg-brand/90" asChild>
                  <a href={data.affiliateUrl} onClick={() => recordOutboundClick(data, "best_offer")} target="_blank" rel="noopener noreferrer sponsored">
                    Ver melhor oferta <ExternalLink className="size-3.5" />
                  </a>
                </Button>

                {data.sellerCount > 0 && <p className="mt-2 text-center text-[11px] text-muted-foreground">{data.sellerCount} vendedor(es) anunciando este produto</p>}
                {hasRealPriceHistory(data.priceHistory) && <p className="mt-2 text-center text-[11px] text-muted-foreground">Histórico com preços registrados para esta oferta.</p>}
              </div>
            </section>

            <CompareOffers product={data} />

            {data.last_synced_at && <p className="mt-3 text-xs text-muted-foreground">Preço atualizado em {new Date(data.last_synced_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}</p>}
            <RelatedAlternatives key={`alternatives-${data.id}`} id={data.id} />
            <BlogPromotions posts={blogPosts} variant="product" />
            <Tabs defaultValue="specs" className="mt-8">
              <TabsList className="flex w-full justify-start gap-1 overflow-x-auto rounded-lg bg-muted/60 p-1 text-xs">
                <TabsTrigger value="specs">Ficha técnica</TabsTrigger>
                {(data.pros.length > 0 || data.cons.length > 0) && <TabsTrigger value="pros">Prós e Contras</TabsTrigger>}
                {hasRealPriceHistory(data.priceHistory) && <TabsTrigger value="history">Histórico de preços</TabsTrigger>}
              </TabsList>

              <TabsContent value="pros" className="mt-3">
                <div className="grid gap-5 rounded-xl border border-border bg-card p-5 md:grid-cols-2">
                  <div>
                    <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
                      <Plus className="size-3.5 rounded-full bg-savings p-0.5 text-savings-foreground" /> Prós
                    </h2>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs text-muted-foreground">
                      {data.pros.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
                      <Minus className="size-3.5 rounded-full bg-primary p-0.5 text-primary-foreground" /> Contras
                    </h2>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs text-muted-foreground">
                      {data.cons.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="specs" className="mt-3">
                <div className="grid gap-6 rounded-xl border border-border bg-card p-5">
                  <div className="overflow-x-auto">
                    <h2 className="mb-3 font-display text-lg font-semibold text-graphite">Informações básicas</h2>
                    <SpecsTable
                      rows={[
                        ["Marca", attribute("marca")] as const,
                        ["Modelo", attribute("modelo")] as const,
                        ["Cor", attribute("cor")] as const,
                        ["Linha", attribute("linha")] as const,
                        ["Ano de lançamento", attribute("ano")] as const,
                        ...data.attributes
                          .filter((item) => !/marca|ano|linha|modelo|cor/i.test(item.name))
                          .slice(0, 8)
                          .map((item) => [item.name, item.value] as const),
                      ].filter(([, value]) => value !== "—")}
                    />
                  </div>

                  {data.description && <div>
                    <h2 className="mb-3 font-display text-lg font-semibold text-graphite">Descrição</h2>
                    <FormattedDescription text={data.description} />
                  </div>}
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-3">
                <div className="rounded-xl border border-border bg-card p-5">
                  <h2 className="font-display text-sm font-semibold">Histórico de preços</h2>
                  <div className="mt-3 h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--savings)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="var(--savings)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" minTickGap={24} />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          stroke="var(--muted-foreground)"
                          width={64}
                          tickFormatter={(value: number) => formatBRL(value)}
                        />
                        <ChartTooltip
                          formatter={(value: number) => [formatBRL(value), "Preço"]}
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid var(--border)",
                            background: "var(--card)",
                            fontSize: 12,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="var(--savings)"
                          strokeWidth={2}
                          fill="url(#priceFill)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {PERIODS.map((item) => (
                      <Button
                        key={item.days}
                        size="sm"
                        variant={period === item.days ? "ink" : "outline"}
                        className="rounded-full"
                        onClick={() => setPeriod(item.days)}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Preços registrados em datas anteriores para esta oferta.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {data.qa.length > 0 ? (
              <section className="mt-8">
                <h2 className="font-display text-base font-semibold text-foreground">Perguntas &amp; Respostas</h2>
                <Accordion type="single" collapsible className="mt-3 rounded-xl border border-border bg-card px-4">
                  {data.qa.map((item, index) => (
                  <AccordionItem key={`${item.source}-${item.data}-${index}`} value={`qa-${index}`}>
                    <AccordionTrigger className="py-3 text-left text-sm font-medium hover:no-underline">
                      <span>
                        {item.pergunta}
                        <span className="mt-1 block text-[11px] font-normal text-muted-foreground">
                          {formatQADate(item.data)}
                        </span>
                      </span>
                    </AccordionTrigger>
                    {item.resposta ? (
                      <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
                        {item.resposta}
                      </AccordionContent>
                    ) : null}
                  </AccordionItem>
                  ))}
                </Accordion>

                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <p className="text-xs font-medium text-foreground">Esse conteúdo foi útil?</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={helpful === true ? "ink" : "outline"}
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => setHelpful(true)}
                  >
                    <ThumbsUp className="size-3.5" /> Sim
                  </Button>
                  <Button
                    size="sm"
                    variant={helpful === false ? "ink" : "outline"}
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => setHelpful(false)}
                  >
                    <ThumbsDown className="size-3.5" /> Não
                  </Button>
                </div>
                {helpful !== null ? (
                  <span className="text-xs text-muted-foreground">Obrigado pelo seu retorno!</span>
                ) : null}
                </div>
              </section>
            ) : null}

              <div className="mt-8 flex flex-col items-start gap-3 rounded-xl border border-border bg-muted/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-foreground sm:text-sm">
                  Precisa de ajuda pra escolher? Nossos especialistas estão prontos para te atender!
                </p>
                <Button variant="ink" size="sm" className="h-9 shrink-0 rounded-full px-4 text-xs">
                  Falar com o especialista
                </Button>
              </div>
              <RelatedCategory key={`category-${data.id}`} id={data.id} />
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
