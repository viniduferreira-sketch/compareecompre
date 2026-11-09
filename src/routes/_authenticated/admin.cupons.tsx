import { createFileRoute } from "@tanstack/react-router";
import { adminHead } from "@/components/admin/admin-shared";
import { AdminOperations } from "@/components/admin/AdminOperations";
export const Route = createFileRoute("/_authenticated/admin/cupons")({ staticData: { sitemap: false }, head: () => adminHead("Cupons", "Gestão administrativa de cupons reais das lojas parceiras."), component: () => <AdminOperations section="sync" /> });
