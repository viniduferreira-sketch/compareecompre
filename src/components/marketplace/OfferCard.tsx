import { Link } from "@tanstack/react-router";
import { ExternalLink, Truck } from "lucide-react";


import { Button } from "@/components/ui/button";
import type { Offer } from "@/lib/search-offers.functions";

export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function OfferCard({ offer }: { offer: Offer }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift">
      <Link
        to="/produto/$id"
        params={{ id: offer.id }}
        className="relative block aspect-square w-full overflow-hidden bg-muted"
        aria-label={`Ver detalhes de ${offer.title}`}
      >
        {offer.imageUrl ? (
          <img
            src={offer.imageUrl}
            alt={offer.title}
            loading="lazy"
            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Sem imagem
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-store px-2.5 py-1 text-[11px] font-semibold text-store-foreground shadow-card">
          {offer.store}
        </span>
        {offer.discountPercent ? (
          <span className="absolute right-3 top-3 rounded-full bg-savings px-2.5 py-1 text-[11px] font-bold text-savings-foreground shadow-card">
            -{offer.discountPercent}%
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="text-[10px] font-bold uppercase text-muted-foreground">Mercado Livre</p>
        <Link
          to="/produto/$id"
          params={{ id: offer.id }}
          className="line-clamp-2 text-left text-sm font-medium leading-snug text-foreground transition-colors hover:text-primary"
        >
          {offer.title}
        </Link>

        <div className="mt-auto space-y-1">
          {offer.originalPrice ? (
            <p className="text-xs text-muted-foreground line-through">
              {formatBRL(offer.originalPrice)}
            </p>
          ) : (
            <p className="text-xs text-transparent select-none">—</p>
          )}
          <p className="font-display text-2xl font-bold text-foreground">{formatBRL(offer.price)}</p>
          {offer.freeShipping ? (
            <p className="flex items-center gap-1.5 text-xs font-medium text-savings">
              <Truck className="size-3.5" /> Frete grátis
            </p>
          ) : null}
        </div>

        <div>
          <Button variant="hero" className="w-full" asChild>
            <a href={offer.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored">
              Ver no Mercado Livre <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}
