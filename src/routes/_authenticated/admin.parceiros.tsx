import { createFileRoute } from "@tanstack/react-router";
import { adminHead } from "@/components/admin/admin-shared";
import { AwinAllowlist, awinAllowlistQuery } from "@/components/marketplace/AwinAllowlist";
import { AwinMerchantRules, awinRulesQuery } from "@/components/marketplace/AwinMerchantRules";
import { PartnerStores, partnerStoresQuery } from "@/components/admin/PartnerStores";
export const Route = createFileRoute("/_authenticated/admin/parceiros")({ staticData: { sitemap: false }, head: () => adminHead("Parceiros", "Anunciantes permitidos e regras administrativas das lojas parceiras."), loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(partnerStoresQuery), context.queryClient.ensureQueryData(awinAllowlistQuery), context.queryClient.ensureQueryData(awinRulesQuery)]), component: () => <><PartnerStores /><AwinAllowlist /><AwinMerchantRules /></> });
