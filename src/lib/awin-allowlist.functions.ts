import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { normalizeAwinMerchantName } from "./awin-allowlist";

const merchantNameSchema = z.string().trim().min(1).max(200);

async function requireAdmin(context: { userId: string; supabase: SupabaseClient<Database> }) {
  const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
}

export const getAwinAllowlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "no-store");
    await requireAdmin(context);
    const result = await context.supabase.from("awin_allowed_merchants").select("merchant_name").order("merchant_name");
    if (result.error) throw new Error("Não foi possível ler os anunciantes permitidos.");
    return (result.data ?? []).map((row) => row.merchant_name);
  });

export const addAwinAllowedMerchant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(merchantNameSchema)
  .handler(async ({ data, context }) => {
    setResponseHeader("Cache-Control", "no-store");
    await requireAdmin(context);
    const current = await context.supabase.from("awin_allowed_merchants").select("merchant_name");
    if (current.error) throw new Error("Não foi possível conferir os anunciantes permitidos.");
    const normalized = normalizeAwinMerchantName(data);
    if ((current.data ?? []).some((row) => normalizeAwinMerchantName(row.merchant_name) === normalized)) {
      return (current.data ?? []).map((row) => row.merchant_name);
    }
    const result = await context.supabase.from("awin_allowed_merchants").insert({ merchant_name: data });
    if (result.error) throw new Error("Não foi possível adicionar o anunciante.");
    return [...(current.data ?? []).map((row) => row.merchant_name), data].sort((a, b) => a.localeCompare(b));
  });

export const removeAwinAllowedMerchant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(merchantNameSchema)
  .handler(async ({ data, context }) => {
    setResponseHeader("Cache-Control", "no-store");
    await requireAdmin(context);
    const result = await context.supabase.from("awin_allowed_merchants").delete().eq("merchant_name", data);
    if (result.error) throw new Error("Não foi possível remover o anunciante.");
    const current = await context.supabase.from("awin_allowed_merchants").select("merchant_name").order("merchant_name");
    if (current.error) throw new Error("O anunciante foi removido, mas não foi possível atualizar a lista.");
    return (current.data ?? []).map((row) => row.merchant_name);
  });
