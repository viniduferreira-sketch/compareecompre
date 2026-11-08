import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { describeAdultContentMatch, getAdultContentMatch } from "./content-policy";

export type AdultContentAudit = {
  totalRecords: number;
  blocked: number;
  bySource: Record<"mercadolivre" | "awin" | "lomadee", number>;
  examples: Array<{ title: string; store: string; source: string; reason: string }>;
};

type AuditRecord = {
  title?: string;
  store?: string;
  merchant_name?: string;
  source?: string;
  category?: string;
  categoryName?: string;
};

/** Auditoria somente leitura: não altera status, não apaga e não reindexa registros. */
export const auditAdultContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdultContentAudit> => {
    setResponseHeader("Cache-Control", "no-store");
    const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
    const { getAlgoliaIndexingConfig } = await import("./algolia-indexing.server");
    const { client, indexName } = getAlgoliaIndexingConfig();
    const result: AdultContentAudit = {
      totalRecords: 0,
      blocked: 0,
      bySource: { mercadolivre: 0, awin: 0, lomadee: 0 },
      examples: [],
    };
    await client.browseObjects<AuditRecord>({
      indexName,
      browseParams: {
        query: "",
        hitsPerPage: 1000,
        attributesToRetrieve: ["title", "store", "merchant_name", "source", "category", "categoryName"],
      },
      aggregator: (batch) => {
        for (const hit of batch.hits) {
          result.totalRecords += 1;
          const match = getAdultContentMatch({
            store: [hit.store, hit.merchant_name],
            category: [hit.category, hit.categoryName],
            title: hit.title,
          });
          if (!match) continue;
          const source = hit.source === "awin" || hit.source === "lomadee" || hit.source === "mercadolivre"
            ? hit.source
            : "mercadolivre";
          result.blocked += 1;
          result.bySource[source] += 1;
          if (result.examples.length < 15) result.examples.push({
            title: hit.title ?? "Sem título",
            store: hit.store ?? hit.merchant_name ?? "Loja não informada",
            source,
            reason: describeAdultContentMatch(match),
          });
        }
      },
    });
    return result;
  });
