import { Link } from "@tanstack/react-router";
import { Truck } from "lucide-react";

import { ProductImage } from "@/components/marketplace/ProductImage";
import type { Offer } from "@/lib/search-offers.functions";

export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function OfferCard({ offer, rank }: { offer: Offer; rank?: number }) {
  return (
    <Link
      to="/produto/$id"
      params={{ id: offer.id }}
      aria-label={`Ver detalhes de ${offer.title}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative h-40 w-full overflow-hidden rounded-md">
        <ProductImage
          src={offer.imageUrl}
          alt={offer.title}
          loading="lazy"
          className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
          placeholderClassName="rounded-none bg-card"
        />
        {offer.discountPercent || offer.freeShipping ? (
          <div className="absolute left-1.5 right-1.5 top-1.5 flex flex-wrap items-center gap-1">
            {offer.discountPercent ? (
              <span className="rounded-full bg-savings px-2 py-0.5 text-[10px] font-bold text-savings-foreground shadow-card">
                -{offer.discountPercent}%
              </span>
            ) : null}
            {offer.freeShipping ? (
              <span className="flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[10px] font-semibold text-savings shadow-card">
                <Truck className="size-3" /> Frete grátis
              </span>
            ) : null}
          </div>
        ) : null}
        {rank ? (
          <span className="absolute bottom-1.5 left-1.5 flex size-7 items-center justify-center rounded-full bg-ink font-display text-xs font-extrabold text-ink-foreground shadow-card">
            {rank}
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-medium leading-5 text-foreground transition-colors group-hover:text-primary">
        {offer.title}
      </h3>

      <div className="mt-auto pt-2">
        {offer.originalPrice ? (
          <p className="text-xs text-muted-foreground line-through">{formatBRL(offer.originalPrice)}</p>
        ) : (
          <p className="select-none text-xs text-transparent">—</p>
        )}
        <p className="font-display text-xl font-bold text-foreground">{formatBRL(offer.price)}</p>
      </div>
    </Link>
  );
}
