import { createFileRoute } from "@tanstack/react-router";
import { adminHead } from "@/components/admin/admin-shared";
import { AdminOperations } from "@/components/admin/AdminOperations";
import { ImportHistory } from "@/components/admin/ImportHistory";
export const Route = createFileRoute("/_authenticated/admin/sincronizacao")({ staticData: { sitemap: false }, head: () => adminHead("Sincronização", "Atualizações de parceiros e histórico com motivos de descarte."), component: () => <><AdminOperations section="sync" /><ImportHistory /></> });
