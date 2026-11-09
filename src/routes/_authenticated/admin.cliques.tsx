import { createFileRoute } from "@tanstack/react-router";
import { adminHead } from "@/components/admin/admin-shared";
import { OutboundClickStats, outboundReportQuery } from "@/components/marketplace/OutboundClickStats";
export const Route = createFileRoute("/_authenticated/admin/cliques")({ staticData: { sitemap: false }, head: () => adminHead("Cliques de saída", "Estatísticas privadas de cliques de saída, sem dados de comissões."), loader: ({ context }) => context.queryClient.ensureQueryData(outboundReportQuery), component: () => <><p className="rounded-md border border-seal-border bg-seal-soft p-4 text-sm text-seal-foreground">Estes números são cliques, não comissões ou compras. As comissões ficam nos painéis da Awin e da Lomadee.</p><OutboundClickStats /></> });
