import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Star } from "lucide-react";

import { formatBRL } from "@/components/marketplace/OfferCard";
import { StoreLogo } from "@/components/marketplace/StoreLogo";
import { compareOffers, type ComparedOffer } from "@/lib/search-offers";
import { cn } from "@/lib/utils";

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

export function CompareOffers({ product }: { product: { id: string; title: string; ean?: string | null; store: string; price: number | null; affiliateUrl: string; source: string; last_synced_at?: string } }) {
  const { data, isPending } = useQuery({
    queryKey: ["compare-offers", product.id],
    queryFn: () => compareOffers(product),
    staleTime: 5 * 60_000,
  });
  const offers: ComparedOffer[] = [...(data ?? [])];
  if (product.price && !offers.some((o) => o.store === product.store)) {
    offers.push({ id: product.id, store: product.store, price: product.price, affiliateUrl: product.affiliateUrl, source: product.source, ...(product.last_synced_at ? { last_synced_at: product.last_synced_at } : {}) });
  }
  offers.sort((l, r) => l.price - r.price);

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-5" aria-labelledby="comparar-ofertas">
      <h2 id="comparar-ofertas" className="font-display text-base font-semibold text-graphite">Comparar ofertas</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">Mesmo produto em lojas parceiras, do menor para o maior preço.</p>
      {isPending ? (
        <p className="mt-4 text-xs text-muted-foreground">Buscando preços em outras lojas…</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {offers.map((offer, index) => (
            <li
              key={offer.id}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5 sm:flex-nowrap",
                index === 0 ? "border-deal-strong/40 bg-deal-soft/60" : "border-border",
              )}
            >
              <StoreLogo store={offer.store} logoUrl={offer.storeLogoUrl ?? undefined} className="h-9 w-24 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-graphite">{offer.store}</p>
                {offer.last_synced_at ? (
                  <p className="text-[11px] text-muted-foreground">
                    Verificado em {new Date(offer.last_synced_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}
                  </p>
                ) : null}
              </div>
              {index === 0 && offers.length > 1 ? (
                <span className="rounded-md border border-deal-strong/50 bg-deal-soft px-2 py-0.5 text-[11px] font-semibold text-deal-strong">Menor preço</span>
              ) : null}
              <p className="font-display text-base font-bold text-graphite">{formatBRL(offer.price)}</p>
              <a
                href={offer.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand px-4 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Ir à loja <ExternalLink className="size-3.5" />
              </a>
            </li>
          ))}
        </ul>
      )}
      {!isPending && offers.length <= 1 ? (
        <p className="mt-3 text-xs text-muted-foreground">Por enquanto só encontramos este produto nesta loja. Novas lojas aparecem aqui automaticamente.</p>
      ) : null}
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
