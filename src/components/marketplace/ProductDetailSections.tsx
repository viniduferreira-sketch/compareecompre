import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Star } from "lucide-react";

import { formatBRL } from "@/components/marketplace/OfferCard";
import { StoreLogo } from "@/components/marketplace/StoreLogo";
import { getComparedOffers } from '@/lib/product-comparison.functions';
import { COMPARISON_CACHE_MS } from '@/lib/product-comparison';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import { recordOutboundClick } from "@/lib/outbound-clicks";
import { Link } from '@tanstack/react-router';
import {storeSlug} from '@/lib/store-pages';

const SOURCE_LABEL: Record<string, string> = { mercadolivre: "Mercado Livre", awin: "Awin", lomadee: "Lomadee" };

export function RatingStars({ rating }: { rating: { value: number; count: number; source: string } }) {
  const label = `${rating.value.toFixed(1).replace(".", ",")} de 5 estrelas, ${rating.count} avaliações`;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-graphite" aria-label={label}>
      <span className="flex" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, rating.value - i));
          return (
            <span key={i} className="relative size-4">
              <Star className="absolute inset-0 size-4 text-brand/30" strokeWidth={1.75} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className="size-4 fill-brand text-brand" strokeWidth={1.75} />
              </span>
            </span>
          );
        })}
      </span>
      <span className="font-semibold">{rating.value.toFixed(1).replace(".", ",")}</span>
      <span className="text-muted-foreground">({rating.count.toLocaleString("pt-BR")} avaliações · via {SOURCE_LABEL[rating.source] ?? rating.source})</span>
    </div>
  );
}

export function CompareOffers({ product }: { product: { id: string; title: string; comparisonKey?: string | null; category?: string | null } }) {
  const key = product.comparisonKey;
  const { data: offers = [], isPending } = useQuery({
    queryKey: ['compare-offers-exact', key],
    queryFn: () => key ? getComparedOffers({ data: { key } }) : Promise.resolve([]),
    enabled: Boolean(key),
    staleTime: COMPARISON_CACHE_MS,
    refetchOnWindowFocus: false,
  });
  if (!key || isPending || offers.length < 2) return null;
  return (
    <section className="mt-6" aria-labelledby="comparar-ofertas">
      <h2 id="comparar-ofertas" className="font-display text-lg font-semibold text-graphite">Ofertas do mesmo produto</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm text-graphite">
          <thead><tr className="border-b border-border text-left text-muted-foreground">
            <th scope="col" className="px-3 py-3">Loja / vendedor</th>
            <th scope="col" className="px-3 py-3">Preço</th>
            <th scope="col" className="px-3 py-3">Frete</th>
            <th scope="col" className="px-3 py-3"><span className="sr-only">Link da oferta</span></th>
          </tr></thead>
          <tbody>{offers.map((offer, index) => (
            <tr key={offer.id} className={cn('border-b border-border', index === 0 && 'bg-deal-soft/60')}>
              <td className="px-3 py-3">
                <StoreLogo store={offer.store} logoUrl={offer.storeLogoUrl ?? undefined} className="mb-1 h-8 w-24" />
                <Link to="/loja/$slug" params={{ slug: storeSlug(offer.store) }} className="font-medium hover:underline">{offer.store}</Link>
                {offer.sellerName && <p className="text-xs text-muted-foreground">{offer.sellerName}</p>}
                {offer.last_synced_at && <p className="mt-1 text-[11px] text-muted-foreground">Verificado em {new Date(offer.last_synced_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}</p>}
              </td>
              <td className="whitespace-nowrap px-3 py-3 font-semibold">{formatBRL(offer.price)}</td>
              <td className="px-3 py-3">{offer.freeShipping || offer.shippingCost === 0 ? 'Grátis' : offer.shippingCost != null ? formatBRL(offer.shippingCost) : 'Consultar na loja'}</td>
              <td className="px-3 py-3"><Button size="sm" asChild><a href={offer.affiliateUrl} onClick={() => recordOutboundClick({ ...offer, title: product.title, category: product.category }, 'compare_store')} target="_blank" rel="noopener noreferrer sponsored">Ir à loja <ExternalLink className="size-3.5" /></a></Button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}

export function SpecsTable({ rows }: { rows: Array<readonly [string, string]> }) {
  return (
    <table className="w-full min-w-[300px] text-sm text-graphite">
      <tbody>
        {rows.map(([label, value], index) => (
          <tr key={`${label}-${index}`} className={index % 2 === 0 ? "bg-zebra" : ""}>
            <th scope="row" className="w-2/5 rounded-l-md px-3 py-2 text-left font-medium">{label}</th>
            <td className="rounded-r-md px-3 py-2">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Split partner descriptions on \n, <br> and <p>; long single blocks are split every ~3 sentences. */
export function descriptionParagraphs(raw: string): string[] {
  const text = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
  const blocks = text.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  if (blocks.length > 1) return blocks;
  const sentences = (blocks[0] ?? "").match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [];
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) out.push(sentences.slice(i, i + 3).join("").trim());
  return out.filter(Boolean);
}

export function FormattedDescription({ text }: { text: string }) {
  return (
    <div className="max-w-3xl text-base leading-[1.6] text-graphite">
      {descriptionParagraphs(text).map((paragraph, index) => (
        <p key={index} className="mb-4 last:mb-0">{paragraph}</p>
      ))}
    </div>
  );
}
