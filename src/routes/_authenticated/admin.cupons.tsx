import { createFileRoute } from "@tanstack/react-router";
import { adminHead } from "@/components/admin/admin-shared";
export const Route = createFileRoute("/_authenticated/admin/cupons")({ staticData: { sitemap: false }, head: () => adminHead("Cupons", "Gestão administrativa de cupons reais das lojas parceiras."), component: () => <p className="text-sm text-muted-foreground">A atualização de cupons fica em Sincronização.</p> });
