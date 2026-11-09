import { createFileRoute } from "@tanstack/react-router";
import { adminHead } from "@/components/admin/admin-shared";
import { AdminCoupons, adminCouponsQuery } from "@/components/admin/AdminCoupons";
export const Route = createFileRoute("/_authenticated/admin/cupons")({ staticData: { sitemap: false }, head: () => adminHead("Cupons", "Gestão administrativa de cupons reais das lojas parceiras."), loader: ({context}) => context.queryClient.ensureQueryData(adminCouponsQuery), component: AdminCoupons });
