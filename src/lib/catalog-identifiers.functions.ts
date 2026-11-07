import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { countIdentifiers } from "./product-identifiers";

/** One cursor page per invocation; no product searches or mutations. */
export const getCatalogIdentifierPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ cursor: z.string().max(10000).optional() }))
  .handler(async ({ context, data }) => {
    setResponseHeader("Cache-Control", "no-store");
    const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
    const { getAlgoliaIndexingConfig } = await import("./algolia-indexing.server");
    const { client, indexName } = getAlgoliaIndexingConfig();
    const page = await client.browse<Record<string, unknown>>({ indexName, browseParams: data.cursor ? { cursor: data.cursor } : {
      hitsPerPage: 1000, attributesToRetrieve: ["objectID", "source", "gtin", "brand", "model"],
    } });
    return { counts: countIdentifiers(page.hits), cursor: page.cursor ?? null };
  });