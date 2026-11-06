import { Link } from "@tanstack/react-router";
import { ChevronRight, Truck } from "lucide-react";


import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/marketplace/ProductImage";
import type { Offer } from "@/lib/search-offers.functions";

export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function OfferCard({ offer, rank }: { offer: Offer; rank?: number }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lift">
      <Link
        to="/produto/$id"
        params={{ id: offer.id }}
        className="relative block aspect-square w-full overflow-hidden bg-muted"
        aria-label={`Ver detalhes de ${offer.title}`}
      >
        <ProductImage
          src={offer.imageUrl}
          alt={offer.title}
          loading="lazy"
          className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          placeholderClassName="rounded-none"
        />
        {rank ? (
          <span className="absolute bottom-3 left-3 flex size-9 items-center justify-center rounded-full bg-ink font-display text-sm font-extrabold text-ink-foreground shadow-card">
            {rank}
          </span>
        ) : null}
        {offer.discountPercent || offer.freeShipping ? (
          <div className="absolute left-3 right-3 top-3 flex flex-wrap items-center gap-1.5">
            {offer.discountPercent ? (
              <span className="rounded-full bg-savings px-2.5 py-1 text-[11px] font-bold text-savings-foreground shadow-card">
                -{offer.discountPercent}%
              </span>
            ) : null}
            {offer.freeShipping ? (
              <span className="flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[11px] font-semibold text-savings shadow-card">
                <Truck className="size-3" /> Frete grátis
              </span>
            ) : null}
          </div>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
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
        </div>

        <div>
          <Button className="w-full bg-brand text-brand-foreground hover:bg-brand/90" asChild>
            <Link to="/produto/$id" params={{ id: offer.id }}>
              Ver detalhes <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
