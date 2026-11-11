import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { storeEditSchema } from "./partner-stores";
import { isAwinMerchantAllowed } from "./awin-allowlist";

async function admin(context: { userId: string; supabase: SupabaseClient<Database> }) {
  setResponseHeader("Cache-Control", "no-store");
  const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
}
export const getPublicStores = createServerFn({ method: "GET" }).handler(async () => {
  const {readPublicStoreIdentities}=await import('./public-store-identities.server');
  return readPublicStoreIdentities();
});
export const getPartnerStores = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await admin(context);
  const [stores, allowed] = await Promise.all([context.supabase.from("partner_stores").select("*").order("name"), context.supabase.from("awin_allowed_merchants").select("merchant_name")]);
  if (stores.error || allowed.error) throw new Error("Não foi possível ler os parceiros.");
  const { readStoreCounts } = await import("./partner-stores.server");
  const counts = await readStoreCounts();
  return (stores.data ?? []).map((store) => ({ ...store, import_enabled: store.network === "awin" ? isAwinMerchantAllowed(store.merchant_name,(allowed.data ?? []).map((row)=>row.merchant_name)) : store.import_enabled, count: counts[`${store.network}:${store.merchant_name}`] ?? 0 }));
});
export const savePartnerStore = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(storeEditSchema).handler(async ({ context, data }) => {
  await admin(context);
  const { id, ...fields } = data;
  const result = await context.supabase.from("partner_stores").update({ ...fields, logo_url: fields.logo_url || null, updated_at: new Date().toISOString(), metadata_origin: { name: "manual", logo: "manual", description: "manual" } }).eq("id", id);
  if (result.error) throw new Error(`Falha ao salvar: ${result.error.code} ${result.error.message}`);
  return { saved: true };
});
export const setStoreImport = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid(), enabled: z.boolean() })).handler(async ({ context, data }) => {
  await admin(context);
  const result = await context.supabase.rpc("set_partner_store_import", { _id: data.id, _enabled: data.enabled });
  if (result.error) throw new Error(`Falha ao alterar importação: ${result.error.code} ${result.error.message}`);
  return { saved: true };
});
export const storeGroupingBatch = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid(), enabled: z.boolean(), cursor: z.string().max(20000).optional() })).handler(async ({ context, data }) => {
  await admin(context);
  const row = await context.supabase.from("partner_stores").select("network,external_id,merchant_name,import_enabled,display_enabled,group_variants").eq("id", data.id).single();
  if (row.error || !row.data) throw new Error("Loja não encontrada.");
  if (!data.cursor) {
    const saved = await context.supabase.from("partner_stores").update({ group_variants: data.enabled, updated_at: new Date().toISOString() }).eq("id", data.id);
    if (saved.error) throw new Error(`Falha ao salvar agrupamento: ${saved.error.code} ${saved.error.message}`);
  } else if (row.data.group_variants !== data.enabled) throw new Error("A opção mudou. Reinicie o agrupamento desta loja.");
  const { groupingPage } = await import("./partner-stores.server");
  return groupingPage({ ...row.data, group_variants: data.enabled }, data.cursor);
});
export const storeVisibilityBatch = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid(), enabled: z.boolean(), preview: z.boolean(), cursor: z.string().max(20000).optional() })).handler(async ({ context, data }) => {
  await admin(context);
  const row = await context.supabase.from("partner_stores").select("network,external_id,merchant_name,import_enabled,display_enabled").eq("id", data.id).single();
  if (row.error || !row.data) throw new Error("Loja não encontrada.");
  const { visibilityPage, ensureDisplayFacet } = await import("./partner-stores.server");
  if (!data.preview && !data.cursor) {
    await ensureDisplayFacet();
    const saved = await context.supabase.from("partner_stores").update({ display_enabled: data.enabled, updated_at: new Date().toISOString() }).eq("id", data.id);
    if (saved.error) throw new Error("Não foi possível salvar a visibilidade.");
  }
  return visibilityPage({ ...row.data, display_enabled: data.enabled }, data.cursor, data.preview);
});
export const discoverPartnerStores = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await admin(context);
  const { readNetworkStores } = await import("./partner-stores.server");
  const brands = await readNetworkStores();
  const current = await context.supabase.from("partner_stores").select("external_id").eq("network", "lomadee");
  if (current.error) throw new Error("Não foi possível conferir o cadastro.");
  const known = new Set((current.data ?? []).map((row) => row.external_id));
  const rows = brands.filter((brand) => !known.has(brand.id)).map((brand) => {
    const enabled = brand.network?.active !== false && Boolean(brand.channels?.some((channel) => channel.shortUrls?.length));
    return { network: "lomadee", external_id: brand.id, merchant_name: brand.name, name: brand.name, logo_url: brand.logo ?? null, description: brand.description ?? "", import_enabled: enabled, display_enabled: enabled, enrollment_status: enabled ? "authorized" : "disabled", metadata_origin: { name: "lomadee", logo: brand.logo ? "lomadee" : "missing", description: brand.description ? "lomadee" : "missing" } };
  });
  if (rows.length) {
    const result = await context.supabase.from("partner_stores").insert(rows);
    if (result.error) throw new Error(`Falha ao cadastrar lojas: ${result.error.code} ${result.error.message}`);
  }
  return { read: brands.length, added: rows.length };
});