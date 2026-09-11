import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BellRing, ChevronRight, ExternalLink, Heart, Loader2, Minus, Plus, Share2, Truck } from "lucide-react";
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
import { formatBRL } from "@/components/marketplace/OfferCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getProductDetail } from "@/lib/product-detail.functions";

export const Route = createFileRoute("/produto/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes do produto | Compare e Compre" },
      {
        name: "description",
        content:
          "Veja fotos, ficha técnica, prós e contras e o menor preço encontrado para este produto nas lojas parceiras.",
      },
      { property: "og:title", content: "Detalhes do produto | Compare e Compre" },
      {
        property: "og:description",
        content: "Compare o preço deste produto e compre pela melhor oferta do Brasil.",
      },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

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
    const date = new Date(Date.now() - (points - index) * step * 86_400_000);
    return {
      date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
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
  const { id } = Route.useParams();
  const run = useServerFn(getProductDetail);
  const [activeImage, setActiveImage] = useState(0);
  const [alert, setAlert] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [period, setPeriod] = useState(PERIODS[0]!.days);

  const { data, isLoading } = useQuery({
    queryKey: ["product-detail", id],
    queryFn: () => run({ data: { id } }),
    staleTime: 5 * 60 * 1000,
  });

  const history = useMemo(
    () => buildHistory(data?.price ?? 1000, period),
    [data?.price, period],
  );

  const attribute = (needle: string) =>
    data?.attributes.find((item) => item.name.toLowerCase().includes(needle))?.value ?? "—";

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={() => undefined} />

      <main className="mx-auto max-w-7xl px-4 py-6">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-10 w-96 max-w-full" />
            <div className="grid gap-6 lg:grid-cols-2">
              <Skeleton className="h-96 rounded-2xl" />
              <Skeleton className="h-96 rounded-2xl" />
            </div>
          </div>
        ) : !data ? (
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

            <header className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 lg:flex lg:items-center lg:justify-between">
              <h1 className="min-w-0 font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                {data.title}
              </h1>

              <div className="flex shrink-0 items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2">
                  <BellRing className="size-4 text-muted-foreground" />
                  <span className="hidden text-sm text-foreground sm:inline">Criar alerta de preço</span>
                  <Switch checked={alert} onCheckedChange={setAlert} aria-label="Criar alerta de preço" />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  aria-pressed={favorite}
                  aria-label="Favoritar"
                  onClick={() => setFavorite((value) => !value)}
                >
                  <Heart className={cn("size-4", favorite && "fill-destructive text-destructive")} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  aria-label="Compartilhar"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.share) {
                      void navigator.share({ title: data.title, url: window.location.href });
                    } else if (typeof navigator !== "undefined") {
                      void navigator.clipboard?.writeText(window.location.href);
                    }
                  }}
                >
                  <Share2 className="size-4" />
                </Button>
              </div>
            </header>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-muted/40">
                  {data.images[activeImage] ? (
                    <img
                      src={data.images[activeImage]}
                      alt={data.title}
                      className="h-full w-full object-contain p-6"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">Sem imagem</span>
                  )}
                </div>

                {data.images.length > 1 ? (
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                    {data.images.map((image, index) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        aria-label={`Ver imagem ${index + 1}`}
                        className={cn(
                          "size-16 shrink-0 overflow-hidden rounded-xl border bg-card p-1 transition-colors",
                          index === activeImage ? "border-primary" : "border-border hover:border-primary/50",
                        )}
                      >
                        <img src={image} alt="" className="h-full w-full object-contain" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border-2 border-savings bg-card p-5">
                <span className="inline-block rounded-md bg-savings px-2 py-1 text-[11px] font-semibold text-savings-foreground">
                  Menor preço
                </span>

                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    {data.originalPrice ? (
                      <p className="text-sm text-muted-foreground line-through">
                        {formatBRL(data.originalPrice)}
                      </p>
                    ) : null}
                    <p className="font-display text-4xl font-bold text-foreground sm:text-5xl">
                      {data.price ? formatBRL(data.price) : "Indisponível"}
                    </p>
                    {data.price ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        ou 10x de {formatBRL(data.price / 10)} sem juros
                      </p>
                    ) : null}
                    {data.freeShipping ? (
                      <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-savings">
                        <Truck className="size-4" /> Frete grátis
                      </p>
                    ) : null}
                  </div>

                  <p className="shrink-0 text-sm text-muted-foreground sm:text-right">
                    Vendido por: <span className="font-semibold text-foreground">Mercado Livre</span>
                  </p>
                </div>

                <Button variant="ink" size="lg" className="mt-6 w-full" asChild>
                  <a href={data.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored">
                    Ir à loja <ExternalLink className="size-4" />
                  </a>
                </Button>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  {data.sellerCount > 0
                    ? `${data.sellerCount} vendedor(es) anunciando este produto`
                    : "Preço acompanhado diariamente"}
                </p>
              </div>
            </section>

            <Tabs defaultValue="pros" className="mt-10">
              <TabsList className="flex w-full justify-start gap-1 overflow-x-auto rounded-xl bg-muted/60 p-1">
                <TabsTrigger value="pros">Prós e Contras</TabsTrigger>
                <TabsTrigger value="specs">Ficha técnica</TabsTrigger>
                <TabsTrigger value="history">Histórico de preços</TabsTrigger>
              </TabsList>

              <TabsContent value="pros" className="mt-4">
                <div className="grid gap-6 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
                  <div>
                    <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                      <Plus className="size-4 rounded-full bg-savings p-0.5 text-savings-foreground" /> Prós
                    </h2>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                      {data.pros.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                      <Minus className="size-4 rounded-full bg-primary p-0.5 text-primary-foreground" /> Contras
                    </h2>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                      {data.cons.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="specs" className="mt-4">
                <div className="grid gap-6 rounded-2xl border border-border bg-card p-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
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
                    <h2 className="mb-3 font-display text-lg font-semibold">Descrição</h2>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {data.description}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h2 className="font-display text-lg font-semibold">Histórico de preços</h2>
                  <div className="mt-4 h-64 w-full">
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
                    Variação estimada com base no preço atual da loja parceira.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      <footer className="mt-10 border-t border-border py-8 text-center text-xs text-muted-foreground">
        Compare e Compre · Preços e disponibilidade podem mudar na loja parceira.
      </footer>
    </div>
  );
}
