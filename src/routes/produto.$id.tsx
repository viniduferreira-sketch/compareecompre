import { Link, createFileRoute } from "@tanstack/react-router";
import {
  BellRing,
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
import { SiteFooter } from "@/components/marketplace/SiteFooter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatBRL } from "@/components/marketplace/OfferCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getProductDetail } from "@/lib/product-detail.functions";

export const Route = createFileRoute("/produto/$id")({
  loader: ({ params }) => getProductDetail({ data: { id: params.id } }),
  head: ({ loaderData }) => {
    const product = loaderData;
    const title = product
      ? `${product.title.slice(0, 38)} | Compare e Compre`
      : "Detalhes do produto | Compare e Compre";
    const description = product?.description.slice(0, 155)
      ?? "Veja fotos, ficha técnica e o menor preço encontrado para este produto nas lojas parceiras.";
    const image = product?.images.find((url) => url.startsWith("https://"));
    const validPrice = product?.price && Number.isFinite(product.price) && product.price > 0
      ? product.price
      : null;
    const productSchema = product
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.title,
          description: product.description,
          sku: product.id,
          ...(product.images.length > 0 ? { image: product.images } : {}),
          ...(validPrice
            ? {
                offers: {
                  "@type": "Offer",
                  priceCurrency: "BRL",
                  price: validPrice.toFixed(2),
                  availability: "https://schema.org/InStock",
                  url: product.affiliateUrl,
                  seller: {
                    "@type": "Organization",
                    name: "Mercado Livre",
                  },
                },
              }
            : {}),
        }
      : null;
    const faqSchema = product
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        }
      : null;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
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

const FAQ = [
  {
    q: "Tem boa qualidade de imagem?",
    a: "Sim. O produto entrega uma imagem nítida e cores equilibradas para o uso do dia a dia, com bom desempenho tanto em ambientes claros quanto à noite.",
  },
  {
    q: "É bom para jogos?",
    a: "Atende bem jogos casuais e uso intenso. Para partidas competitivas, confira na ficha técnica a taxa de atualização e o tempo de resposta.",
  },
  {
    q: "Vale a pena pelo preço atual?",
    a: "Comparando com o histórico de preços mostrado acima, o valor atual está dentro da faixa considerada boa para este modelo.",
  },
  {
    q: "Qual é o prazo de entrega?",
    a: "O prazo é calculado pela loja responsável no momento da compra, de acordo com o seu CEP. Muitos anúncios contam com frete grátis.",
  },
  {
    q: "A compra é segura?",
    a: "Sim. Você é redirecionado para a página oficial da loja responsável, onde confere o pagamento, a entrega e as condições de garantia.",
  },
  {
    q: "Tem garantia do fabricante?",
    a: "A maioria dos anúncios oferece garantia do fabricante ou do vendedor. O prazo exato aparece na página da loja responsável.",
  },
];

const PERIODS = [
  { label: "40 dias", days: 40 },
  { label: "3 meses", days: 90 },
  { label: "6 meses", days: 180 },
  { label: "1 ano", days: 365 },
];

function buildHistory(price: number, days: number) {
  const points = Math.min(days, 40);
  const step = days / points;
  return Array.from({ length: points + 1 }, (_, index) => {
    const seed = Math.sin((index + 1) * (days / 7)) * Math.cos(index * 1.7);
    const variation = 1 + seed * 0.06 + (points - index) * 0.0015;
    return {
      date: index === points ? "Hoje" : `${Math.round((points - index) * step)}d`,
      price: Math.round(price * variation),
    };
  });
}

function prettyCategory(domain: string | null) {
  if (!domain) return "Produtos";
  const raw = domain.split("-").slice(1).join(" ").toLowerCase().replace(/_/g, " ");
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Produtos";
}

function ProductPage() {
  const data = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const [alert, setAlert] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [period, setPeriod] = useState(PERIODS[0]!.days);

  const history = useMemo(
    () => buildHistory(data?.price ?? 1000, period),
    [data?.price, period],
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
              <h1 className="min-w-0 font-display text-lg font-bold leading-tight text-foreground sm:text-xl">
                {data.title}
              </h1>

              <div className="flex shrink-0 items-center gap-1.5">
                <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1.5">
                  <BellRing className="size-3.5 text-muted-foreground" />
                  <span className="hidden text-xs text-foreground sm:inline">Criar alerta de preço</span>
                  <Switch checked={alert} onCheckedChange={setAlert} aria-label="Criar alerta de preço" />
                </div>
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
                  {data.images[activeImage] ? (
                    <img
                      src={data.images[activeImage]}
                      alt={data.title}
                      className="h-full w-full object-contain p-4"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem imagem</span>
                  )}
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
                        <img src={image} alt="" className="h-full w-full object-contain" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl border border-savings bg-card p-4">
                <span className="inline-block rounded-md bg-savings px-2 py-0.5 text-[10px] font-semibold text-savings-foreground">
                  Menor preço
                </span>

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
                    {data.price ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        ou 10x de {formatBRL(data.price / 10)} sem juros
                      </p>
                    ) : null}
                    {data.freeShipping ? (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-savings">
                        <Truck className="size-3.5" /> Frete grátis
                      </p>
                    ) : null}
                  </div>

                  <p className="shrink-0 text-xs text-muted-foreground sm:text-right">
                    Melhor oferta em: <span className="font-semibold text-foreground">loja verificada</span>
                  </p>
                </div>

                <Button variant="ink" className="mt-4 h-10 w-full text-sm" asChild>
                  <a href={data.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored">
                    Ver melhor oferta <ExternalLink className="size-3.5" />
                  </a>
                </Button>

                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  {data.sellerCount > 0
                    ? `${data.sellerCount} vendedor(es) anunciando este produto`
                    : "Preço acompanhado diariamente"}
                </p>
              </div>
            </section>

            <Tabs defaultValue="pros" className="mt-8">
              <TabsList className="flex w-full justify-start gap-1 overflow-x-auto rounded-lg bg-muted/60 p-1 text-xs">
                <TabsTrigger value="pros">Prós e Contras</TabsTrigger>
                <TabsTrigger value="specs">Ficha técnica</TabsTrigger>
                <TabsTrigger value="history">Histórico de preços</TabsTrigger>
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
                <div className="grid gap-5 rounded-xl border border-border bg-card p-5 text-xs md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                  <div className="overflow-x-auto">
                    <h2 className="mb-3 font-display text-lg font-semibold">Informações básicas</h2>
                    <table className="w-full min-w-[320px] overflow-hidden rounded-xl text-sm">
                      <tbody>
                        {[
                          ["Marca", attribute("marca")],
                          ["Ano de lançamento", attribute("ano")],
                          ["Linha", attribute("linha")],
                          ["Modelo", attribute("modelo")],
                          ["Cores", attribute("cor")],
                          ...data.attributes
                            .filter(
                              (item) =>
                                !/marca|ano|linha|modelo|cor/i.test(item.name),
                            )
                            .slice(0, 5)
                            .map((item) => [item.name, item.value] as const),
                        ].map(([label, value], index) => (
                          <tr key={`${label}-${index}`} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                            <th scope="row" className="w-2/5 px-3 py-2 text-left font-medium text-muted-foreground">
                              {label}
                            </th>
                            <td className="px-3 py-2 text-foreground">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h2 className="mb-2 font-display text-sm font-semibold">Descrição</h2>
                    <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                      {data.description}
                    </p>
                  </div>
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
                    Variação estimada com base no melhor preço encontrado entre as lojas monitoradas.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <section className="mt-8">
              <h2 className="font-display text-base font-semibold text-foreground">Perguntas &amp; Respostas</h2>
              <Accordion type="single" collapsible className="mt-3 rounded-xl border border-border bg-card px-4">
                {FAQ.map((item) => (
                  <AccordionItem key={item.q} value={item.q}>
                    <AccordionTrigger className="py-3 text-left text-sm font-medium hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
                      {item.a}
                    </AccordionContent>
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

              <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-border bg-muted/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-foreground sm:text-sm">
                  Precisa de ajuda pra escolher? Nossos especialistas estão prontos para te atender!
                </p>
                <Button variant="ink" size="sm" className="h-9 shrink-0 rounded-full px-4 text-xs">
                  Falar com o especialista
                </Button>
              </div>
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
