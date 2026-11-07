import { useQuery } from "@tanstack/react-query";
import { ProductImage } from "@/components/marketplace/ProductImage";
import { ExternalLink, Loader2, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBRL } from "@/components/marketplace/OfferCard";
import { searchOffers, type Offer } from "@/lib/search-offers";
import { recordOutboundClick } from "@/lib/outbound-clicks";

export function CompareDialog({
  offer,
  onOpenChange,
}: {
  offer: Offer | null;
  onOpenChange: (open: boolean) => void;
}) {
  const run = searchOffers;

  const { data, isLoading } = useQuery({
    queryKey: ["compare", offer?.id],
    enabled: Boolean(offer),
    queryFn: () =>
      run({
        data: {
          query: offer?.title.split(" ").slice(0, 6).join(" ") ?? "",
          limit: 8,
        },
      }),
  });

  const alternatives = (data?.offers ?? []).filter((item) => item.id !== offer?.id).slice(0, 5);
  const best = data?.offers[0] ?? offer;

  return (
    <Dialog open={Boolean(offer)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        {offer ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-left text-lg leading-snug">{offer.title}</DialogTitle>
              <DialogDescription className="text-left">
                Compare os preços encontrados e escolha a melhor oferta entre as lojas monitoradas.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="mx-auto w-40 shrink-0 rounded-xl border border-border bg-muted p-3">
                <div className="h-32 w-full"><ProductImage src={offer.imageUrl} alt={offer.title} className="h-32 w-full object-contain" /></div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="rounded-xl border border-primary/40 bg-accent/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Melhor preço agora
                  </p>
                  <p className="font-display text-3xl font-bold text-foreground">
                    {best ? formatBRL(best.price) : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    na {best?.store}
                    {best?.freeShipping ? " · frete grátis" : ""}
                  </p>
                  <Button variant="hero" size="lg" className="mt-3 w-full" asChild>
                    <a
                      href={best?.affiliateUrl}
                      onClick={() => { if (best) recordOutboundClick(best, "compare_dialog_best"); }}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                    >
                      Ver melhor oferta <ExternalLink className="size-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Outras ofertas parecidas</h3>
              {isLoading ? (
                <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Buscando preços...
                </p>
              ) : alternatives.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  Nenhuma oferta adicional encontrada para este produto.
                </p>
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                  {alternatives.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 bg-card p-3">
                      <span className="size-12 shrink-0"><ProductImage src={item.imageUrl} alt={item.title} className="size-12 rounded-md object-contain" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm text-foreground">{item.title}</p>
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full bg-store px-2 py-0.5 font-medium text-store-foreground">
                            {item.store}
                          </span>
                          {item.freeShipping ? (
                            <span className="flex items-center gap-1 text-savings">
                              <Truck className="size-3" /> grátis
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-base font-bold">{formatBRL(item.price)}</p>
                        <Button variant="link" size="sm" className="h-auto p-0" asChild>
                          <a href={item.affiliateUrl} onClick={() => recordOutboundClick(item, "compare_dialog_alternative")} target="_blank" rel="noopener noreferrer sponsored">
                            Ver oferta
                          </a>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
