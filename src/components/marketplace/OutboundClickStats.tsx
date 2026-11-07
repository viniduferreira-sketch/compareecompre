import { queryOptions, useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOutboundClickReport } from "@/lib/outbound-clicks.functions";

export const outboundReportQuery = queryOptions({ queryKey: ["admin", "outbound-clicks"], queryFn: () => getOutboundClickReport(), refetchInterval: 30_000 });

function Breakdown({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  return <div className="min-w-0"><h3 className="mb-2 font-semibold">{title}</h3>{rows.length ? <ul className="divide-y divide-border">{rows.map((row) => <li key={row.label} className="flex justify-between gap-3 py-2 text-sm"><span className="min-w-0 break-words">{row.label}</span><strong className="shrink-0 tabular-nums">{row.count.toLocaleString("pt-BR")}</strong></li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhum clique registrado.</p>}</div>;
}

export function OutboundClickStats() {
  const { data, isPending, isError, refetch } = useQuery(outboundReportQuery);
  return <section className="mt-10 border-t border-border pt-7" aria-labelledby="outbound-heading">
    <div className="flex items-center justify-between gap-3"><h2 id="outbound-heading" className="text-xl font-bold">Cliques de saída</h2><Button variant="outline" size="icon" aria-label="Atualizar cliques" onClick={() => { void refetch(); }}><RefreshCw className="size-4" /></Button></div>
    {isPending ? <p className="py-5 text-muted-foreground">Carregando cliques…</p> : isError || !data ? <p role="alert" className="py-5 text-destructive">Não foi possível consultar os cliques.</p> : <>
      <dl className="my-6 grid grid-cols-3 gap-3">{([{ label: "Hoje", count: data.today }, { label: "7 dias", count: data.days7 }, { label: "30 dias", count: data.days30 }]).map(({ label, count }) => <div key={label} className="border-l-2 border-primary pl-3"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="text-2xl font-bold tabular-nums">{count.toLocaleString("pt-BR")}</dd></div>)}</dl>
      <p className="mb-5 text-xs text-muted-foreground">Hoje: horário de São Paulo. Detalhamentos: últimos 30 dias.</p>
      <div className="grid gap-8 sm:grid-cols-2"><Breakdown title="Por fonte" rows={data.sources} /><Breakdown title="Por loja · top 10" rows={data.stores} /><Breakdown title="Por categoria" rows={data.categories} /><Breakdown title="Por local do clique" rows={data.placements} /></div>
      <h3 className="mb-3 mt-8 font-semibold">Produtos e cupons mais clicados · top 20</h3>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-border text-muted-foreground"><tr>{["Produto / cupom (ID)", "Tipo", "Fonte", "Loja", "Cliques"].map((label) => <th key={label} className="p-2 font-medium">{label}</th>)}</tr></thead><tbody>{data.items.map((item) => <tr key={`${item.kind}-${item.source}-${item.offer_id}-${item.store_name}`} className="border-b border-border"><td className="max-w-64 break-words p-2">{item.offer_id}</td><td className="p-2">{item.kind}</td><td className="p-2">{item.source}</td><td className="p-2">{item.store_name}</td><td className="p-2 font-semibold tabular-nums">{item.count}</td></tr>)}</tbody></table></div>
      {!data.items.length && <p className="py-4 text-sm text-muted-foreground">Nenhum clique registrado.</p>}
    </>}
  </section>;
}