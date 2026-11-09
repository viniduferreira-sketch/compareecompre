import { createFileRoute } from "@tanstack/react-router";
import { AdminShell, AdminPending } from "@/components/admin/AdminShell";
import { importsQuery, adminHead } from "@/components/admin/admin-shared";
export const Route = createFileRoute("/_authenticated/admin")({
  staticData: { sitemap: false },
  head: () => adminHead("Administração", "Painel privado de gestão do Compare e Compre."),
  loader: ({ context }) => context.queryClient.ensureQueryData(importsQuery),
  pendingComponent: AdminPending,
  errorComponent: ({ error }) => <main className="p-8"><h1 className="text-xl font-bold">Acesso restrito</h1><p className="mt-3 text-muted-foreground">{error instanceof Error ? error.message : "Não foi possível consultar o painel."}</p></main>,
  component: AdminShell,
});
