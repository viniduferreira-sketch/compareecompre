import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCatalogIdentifierPage } from "@/lib/catalog-identifiers.functions";
import type { IdentifierCounts } from "@/lib/product-identifiers";

export const identifierStatsQuery = queryOptions({
  queryKey: ["admin", "catalog-identifiers"],
  staleTime: 60000,
  queryFn: async () => {
    const counts: IdentifierCounts = {};
    let cursor: string | undefined;
    do {
      const page = await getCatalogIdentifierPage({ data: { cursor } });
      for (const [source, row] of Object.entries(page.counts)) {
        const sum = counts[source] ?? (counts[source] = { total: 0, gtin: 0, brand: 0, model: 0 });
        sum.total += row.total; sum.gtin += row.gtin; sum.brand += row.brand; sum.model += row.model;
      }
      cursor = page.cursor ?? undefined;
    } while (cursor);
    return counts;
  },
});

const names: Record<string, string> = { mercadolivre: "Mercado Livre", awin: "Awin", lomadee: "Lomadee", unknown: "Sem source (legados)" };
export function CatalogIdentifierStats() {
  const { data, isFetching } = useSuspenseQuery(identifierStatsQuery);
  const client = useQueryClient();
  const sources = [...new Set(["mercadolivre", "awin", "lomadee", ...Object.keys(data)])];
  return <section aria-label="Identificadores por parceiro" className="my-8">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">Identificadores por parceiro</h2>
      <Button variant="outline" size="icon" aria-label="Atualizar identificadores" title="Atualizar identificadores" disabled={isFetching} onClick={() => client.invalidateQueries({ queryKey: identifierStatsQuery.queryKey })}><RefreshCw className="size-4" /></Button>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm">
      <thead className="border-b border-border text-muted-foreground"><tr>{["Parceiro", "Total no índice", "Com GTIN", "Com marca", "Com modelo"].map((name) => <th className="p-3 font-medium" key={name}>{name}</th>)}</tr></thead>
      <tbody>{sources.map((source) => { const row = data[source] ?? { total: 0, gtin: 0, brand: 0, model: 0 }; return <tr key={source} className="border-b border-border"><td className="p-3">{names[source] ?? source}</td>{[row.total, row.gtin, row.brand, row.model].map((value, i) => <td key={i} className="p-3 tabular-nums">{value.toLocaleString("pt-BR")}</td>)}</tr>; })}</tbody>
    </table></div>
  </section>;
}