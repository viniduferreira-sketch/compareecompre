import { createFileRoute } from "@tanstack/react-router";
import { adminHead } from "@/components/admin/admin-shared";
import { PopularityControl } from "@/components/marketplace/PopularityControl";
import { CatalogIdentifierStats, identifierStatsQuery } from "@/components/marketplace/CatalogIdentifierStats";
export const Route = createFileRoute("/_authenticated/admin/busca")({ staticData: { sitemap: false }, head: () => adminHead("Busca e ranking", "Pontuação de popularidade e cobertura de identificadores do catálogo."), loader: ({ context }) => context.queryClient.ensureQueryData(identifierStatsQuery), component: () => <><PopularityControl /><CatalogIdentifierStats /></> });
