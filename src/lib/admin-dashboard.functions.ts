import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const metricsSchema = z.object({ clicks7: z.number(), clicks30: z.number(), subscribers: z.number(), daily: z.array(z.object({ label: z.string(), count: z.number() })) });
export const getAdminDashboard = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  setResponseHeader("Cache-Control", "private, no-store");
  const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
  const [metrics, ...histories] = await Promise.all([context.supabase.rpc("admin_dashboard_metrics"), ...["awin", "lomadee", "mercadolivre"].map((source) => context.supabase.from("catalog_imports").select("id,source,status,created_at,catalog_import_batches(indexed,skipped)").eq("source", source).order("created_at", { ascending: false }).limit(20))]);
  if (metrics.error || histories.some((result) => result.error)) throw new Error("Não foi possível ler os indicadores.");
  const { getAlgoliaIndexingConfig } = await import("./algolia-indexing.server");
  const { client, indexName } = getAlgoliaIndexingConfig();
  const sources: Record<string, number> = {}; const stores: Record<string, number> = {}; const distribution: Record<string, number> = { "Sem pontuação": 0, "0–19": 0, "20–39": 0, "40–59": 0, "60–79": 0, "80–100": 0 }; let total = 0;
  await client.browseObjects<{ source?: string; store?: string; popularity_score?: number; status?: string; quality_status?: string; site_hidden?: boolean; price?: number }>({ indexName, browseParams: { hitsPerPage: 1000, attributesToRetrieve: ["source", "store", "popularity_score", "status", "quality_status", "site_hidden", "price"] }, aggregator: (batch) => {
    for (const record of batch.hits) { total++; const source = record.source ?? "Legados"; sources[source] = (sources[source] ?? 0) + 1; const store = record.store ?? "Sem loja"; stores[store] = (stores[store] ?? 0) + 1; const score = record.popularity_score; const range = typeof score !== "number" ? "Sem pontuação" : score < 20 ? "0–19" : score < 40 ? "20–39" : score < 60 ? "40–59" : score < 80 ? "60–79" : "80–100"; distribution[range] = (distribution[range] ?? 0) + 1; }
  } });
  const active = await client.searchSingleIndex({ indexName, searchParams: { query: "", hitsPerPage: 0, facets: ["store"], maxValuesPerFacet: 1000, filters: 'price > 0 AND NOT status:"unavailable" AND NOT quality_status:"rejected" AND NOT site_hidden:true' } });
  const bucket = (values: Record<string,number>) => Object.entries(values).map(([label,count]) => ({ label,count })).sort((a,b) => b.count-a.count);
  return { ...metricsSchema.parse(metrics.data), total, activeStores: Object.keys(active.facets?.["store"] ?? {}).length, sources: bucket(sources), stores: bucket(stores).slice(0,10), distribution: Object.entries(distribution).map(([label,count]) => ({ label,count })), histories: histories.flatMap((result) => (result.data ?? []).map(({ catalog_import_batches, ...job }) => ({ ...job, accepted: catalog_import_batches.reduce((n,b) => n+b.indexed,0), discarded: catalog_import_batches.reduce((n,b) => n+b.skipped,0) }))), checkedAt: new Date().toISOString() };
});
export const getAdminCoupons = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  setResponseHeader("Cache-Control", "no-store");
  const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const rows: Array<{ id: string; store: string; source: string; title: string; code: string; starts_at: string | null; expires_at: string | null; status: string }> = [];
  for (let from=0;;from+=1000) { const result = await db.from("partner_coupons").select("id,store,source,title,code,starts_at,expires_at,status").order("id").range(from,from+999); if (result.error) throw new Error("Não foi possível ler os cupons."); rows.push(...result.data ?? []); if ((result.data ?? []).length<1000) break; }
  return rows;
});