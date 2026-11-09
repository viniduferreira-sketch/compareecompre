import { createFileRoute } from "@tanstack/react-router";
import { adminHead } from "@/components/admin/admin-shared";
import { AdminOperations } from "@/components/admin/AdminOperations";
export const Route = createFileRoute("/_authenticated/admin/qualidade")({ staticData: { sitemap: false }, head: () => adminHead("Mercado Livre e qualidade", "Revalidação de ofertas Mercado Livre e auditoria de qualidade dos parceiros."), component: () => <AdminOperations section="quality" /> });
