import { useState } from "react";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AdminAction } from "@/components/admin/AdminAction";
import { getPriceReviewQueue, releasePriceReview, scanPriceReviews } from "@/lib/price-review.functions";
import { PRICE_REVIEW_CONFIG } from "@/lib/price-review";

export const priceReviewQuery = queryOptions({ queryKey: ["admin", "price-review"], queryFn: () => getPriceReviewQueue() });
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function PriceReviewControl() {
  const { data: queue } = useSuspenseQuery(priceReviewQuery);
  const client = useQueryClient();
  const scan = useServerFn(scanPriceReviews);
  const release = useServerFn(releasePriceReview);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const refresh = () => client.invalidateQueries({ queryKey: ["admin", "price-review"] });
  return <section className="mb-8 border-b border-border pb-5" aria-label="Revisão de preços suspeitos">
    <h2 className="mb-3 flex items-center gap-2 text-lg font-bold"><ShieldAlert className="size-5" />Revisão de preços suspeitos</h2>
    <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">Ficam ocultos preços abaixo de {money.format(PRICE_REVIEW_CONFIG.absoluteMinimum)} ou abaixo de {PRICE_REVIEW_CONFIG.medianRatio * 100}% da mediana de produtos com a mesma família e categoria. A liberação é manual e permanece nas próximas sincronizações.</p>
    <AdminAction writes description="Verifica o catálogo já indexado, recalcula a popularidade sem bônus para descontos acima de 70% e oculta novos preços suspeitos. Não importa nem apaga; pode levar alguns minutos." variant="outline" disabled={busy} onClick={async () => {
      setBusy(true); setMessage("");
      try { const result = await scan(); setMessage(`${result.scanned} registros verificados; ${result.newPending} novos suspeitos; ${result.pending} aguardando revisão.`); await refresh(); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível verificar."); }
      finally { setBusy(false); }
    }}>{busy ? "Verificando preços…" : "Verificar preços agora"}</AdminAction>
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
    <div className="mt-5">
      <h3 className="text-sm font-semibold">{queue.length} {queue.length === 1 ? "produto aguardando" : "produtos aguardando"} revisão</h3>
      {queue.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nenhum preço suspeito pendente.</p> : <ul className="mt-3 space-y-3">
        {queue.map((item) => <li key={item.object_id} className="rounded-lg border border-border p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.store ?? item.source} · preço {money.format(Number(item.price))} · mediana {item.median_price === null ? "sem referência" : money.format(Number(item.median_price))} · {item.peer_count} semelhantes</p>
              <p className="mt-1 text-xs text-muted-foreground">Motivo: {item.reason === "below_minimum" ? "abaixo de R$ 5" : "abaixo de 20% da mediana"}</p>
            </div>
            <AdminAction writes description={`Liberar “${item.title}”? O produto volta às buscas e a decisão fica registrada. Não altera preço nem link.`} variant="outline" disabled={busy} onClick={async () => {
              setBusy(true);
              try { await release({ data: { objectID: item.object_id } }); toast.success("Produto liberado para as buscas."); await refresh(); }
              catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível liberar."); }
              finally { setBusy(false); }
            }}>Liberar</AdminAction>
          </div>
        </li>)}
      </ul>}
    </div>
  </section>;
}
