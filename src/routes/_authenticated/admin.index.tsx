import { createFileRoute } from "@tanstack/react-router";
import { adminHead } from "@/components/admin/admin-shared";
import { AdminDashboard, dashboardQuery } from "@/components/admin/AdminDashboard";
export const Route = createFileRoute("/_authenticated/admin/")({ staticData: { sitemap: false }, head: () => adminHead("Visão geral", "Resumo administrativo do catálogo e das últimas execuções."), loader: ({context}) => context.queryClient.ensureQueryData(dashboardQuery), component: AdminDashboard });
