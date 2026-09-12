import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CompareDialog } from "@/components/marketplace/CompareDialog";
import { Header } from "@/components/marketplace/Header";
import { HeroCarousel } from "@/components/marketplace/HeroCarousel";
import { OfferCard } from "@/components/marketplace/OfferCard";
import { PopularCategories } from "@/components/marketplace/PopularCategories";
import { Skeleton } from "@/components/ui/skeleton";
import { searchOffers, type Offer } from "@/lib/search-offers.functions";

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
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" ? { q: search["q"] as string } : {},
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
  const { q } = Route.useSearch();
  const [term, setTerm] = useState(q ?? "");
  const [selected, setSelected] = useState<Offer | null>(null);

  const search = useQuery({
    queryKey: ["offers", "search", term],
    enabled: term.length > 0,
    queryFn: () => run({ data: { query: term, limit: 50 } }),
  });

  const persistenceErrors = [
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
        <HeroCarousel onSearch={setTerm} />

        <PopularCategories onSearch={setTerm} />




        {term ? (
          <OffersGrid
            title={`Resultados para "${term}"`}
            subtitle="Ordenado do menor para o maior preço"
            offers={search.data?.offers ?? []}
            isLoading={search.isFetching}
            onCompare={setSelected}
          />
        ) : (
          <section className="mx-auto max-w-7xl px-4 py-10 text-center">
            <h2 className="font-display text-2xl font-bold">O que você está procurando?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Digite um produto na busca para ver ofertas atuais do Mercado Livre.
            </p>
          </section>
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
