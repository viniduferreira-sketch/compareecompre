import { createFileRoute } from "@tanstack/react-router";
import { adminHead } from "@/components/admin/admin-shared";
import { PopularityControl } from "@/components/marketplace/PopularityControl";
import { PriceReviewControl, priceReviewQuery } from "@/components/admin/PriceReviewControl";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogIdentifierStats } from "@/components/marketplace/CatalogIdentifierStats";

export const Route = createFileRoute("/_authenticated/admin/busca")({
  staticData: { sitemap: false },
  head: () => adminHead("Busca e ranking", "Pontuação de popularidade, revisão de preços e cobertura de identificadores do catálogo."),
  loader: ({ context }) => context.queryClient.ensureQueryData(priceReviewQuery),
  component: () => <><PriceReviewControl /><PopularityControl /><Suspense fallback={<Skeleton className="h-48 w-full" />}><CatalogIdentifierStats /></Suspense></>,
});
