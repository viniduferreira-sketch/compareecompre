import { useQueries, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck, Sparkles, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CompareDialog } from "@/components/marketplace/CompareDialog";
import { Header } from "@/components/marketplace/Header";
import { OfferCard } from "@/components/marketplace/OfferCard";
import { Skeleton } from "@/components/ui/skeleton";
import { searchOffers, type Offer } from "@/lib/search-offers.functions";

const DEMO_QUERIES = ["iPhone", "Smart TV", "Air Fryer"];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Compare e Compre | Melhores ofertas das maiores lojas do Brasil" },
      {
        name: "description",
        content:
          "Compare preços de iPhone, Smart TV, Air Fryer e milhares de produtos entre as maiores lojas do Brasil e compre pela melhor oferta.",
      },
      { property: "og:title", content: "Compare e Compre | Melhores ofertas do Brasil" },
      {
        property: "og:description",
        content:
          "Busque um produto e veja na hora qual loja tem o menor preço. Ofertas atualizadas do Mercado Livre.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function OffersGrid({
  title,
  subtitle,
  offers,
  isLoading,
  onCompare,
}: {
  title: string;
  subtitle?: string;
  offers: Offer[];
  isLoading: boolean;
  onCompare: (offer: Offer) => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold">{title}</h2>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {isLoading ? <Loader2 className="size-5 animate-spin text-primary" /> : null}
      </div>

      {isLoading && offers.length === 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-80 rounded-2xl" />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhuma oferta encontrada. Tente outro termo de busca.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {offers.map((offer) => (
            <OfferCard key={`${offer.store}-${offer.id}`} offer={offer} onCompare={onCompare} />
          ))}
        </div>
      )}
    </section>
  );
}

function Home() {
  const run = useServerFn(searchOffers);
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<Offer | null>(null);

  const demo = useQueries({
    queries: DEMO_QUERIES.map((query) => ({
      queryKey: ["offers", query],
      queryFn: () => run({ data: { query, limit: 8 } }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const search = useQuery({
    queryKey: ["offers", "search", term],
    enabled: term.length > 0,
    queryFn: () => run({ data: { query: term, limit: 24 } }),
  });

  const persistenceErrors = [
    ...demo.map((result) => result.data?.persistence.ok === false ? result.data.persistence.message : null),
    search.data?.persistence.ok === false ? search.data.persistence.message : null,
  ].filter((message): message is string => Boolean(message));
  const persistenceErrorKey = [...new Set(persistenceErrors)].join("\n");

  useEffect(() => {
    if (!persistenceErrorKey) return;
    console.error("[Supabase] Falha de persistência:", persistenceErrorKey);
    toast.error("Erro ao salvar ofertas", {
      id: `persistence-${persistenceErrorKey}`,
      description: persistenceErrorKey,
      duration: 15_000,
    });
  }, [persistenceErrorKey]);

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={setTerm} initialTerm={term} />

      <main>
        <section className="bg-hero-gradient">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
            <span className="inline-flex items-center gap-2 rounded-full bg-ink-foreground/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-foreground">
              <Sparkles className="size-3.5" /> Ofertas atualizadas em tempo real
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-ink-foreground md:text-6xl">
              Encontre a melhor oferta entre as maiores lojas do Brasil
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-ink-foreground/80 md:text-lg">
              Buscamos o mesmo produto em várias lojas, ordenamos do menor para o maior preço e
              levamos você direto para a compra.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-ink-foreground/80">
              <span className="flex items-center gap-2">
                <TrendingDown className="size-4" /> Menor preço primeiro
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4" /> Lojas parceiras confiáveis
              </span>
            </div>
          </div>
        </section>

        {term ? (
          <OffersGrid
            title={`Resultados para "${term}"`}
            subtitle="Ordenado do menor para o maior preço"
            offers={search.data?.offers ?? []}
            isLoading={search.isFetching}
            onCompare={setSelected}
          />
        ) : (
          DEMO_QUERIES.map((query, index) => (
            <OffersGrid
              key={query}
              title={query}
              subtitle="Destaques com o menor preço primeiro"
              offers={demo[index]?.data?.offers ?? []}
              isLoading={Boolean(demo[index]?.isLoading)}
              onCompare={setSelected}
            />
          ))
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Compare e Compre · Preços e disponibilidade podem mudar na loja parceira. Podemos receber
        comissão pelas compras realizadas.
      </footer>

      <CompareDialog offer={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
