import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

async function requireAdmin(context: { userId: string; supabase: SupabaseClient<Database> }) {
  const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
}

async function readRules(supabase: SupabaseClient<Database>) {
  const result = await supabase.from("awin_merchant_rules").select("merchant,category_terms,excluded_category_terms,max_products").order("merchant");
  if (result.error) throw new Error("Não foi possível ler as regras por loja.");
  return result.data ?? [];
}

async function readAllowed(supabase: SupabaseClient<Database>) {
  const result = await supabase.from("awin_allowed_merchants").select("merchant_name");
  // Fail closed: an unreadable allowlist must never be treated as "everyone allowed".
  if (result.error) throw new Error("Não foi possível ler os anunciantes permitidos.");
  return (result.data ?? []).map((r) => r.merchant_name);
}

export const getAwinRules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "no-store");
    await requireAdmin(context);
    return readRules(context.supabase);
  });

const ruleSchema = z.object({
  merchant: z.string().trim().min(1).max(200),
  categoryTerms: z.array(z.string().trim().min(1).max(80)).max(100),
  excludedCategoryTerms: z.array(z.string().trim().min(1).max(80)).max(100),
  maxProducts: z.number().int().min(1).max(100000),
});

export const saveAwinRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(ruleSchema)
  .handler(async ({ data, context }) => {
    setResponseHeader("Cache-Control", "no-store");
    await requireAdmin(context);
    const terms = [...new Set(data.categoryTerms.map((t) => t.toLowerCase()))];
    const excludedTerms = [...new Set(data.excludedCategoryTerms.map((t) => t.toLowerCase()))];
    const result = await context.supabase.from("awin_merchant_rules").upsert(
      { merchant: data.merchant, category_terms: terms, excluded_category_terms: excludedTerms, max_products: data.maxProducts, updated_at: new Date().toISOString() },
      { onConflict: "merchant" },
    );
    if (result.error) throw new Error("Não foi possível salvar a regra.");
    return readRules(context.supabase);
  });

export const deleteAwinRule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.string().trim().min(1).max(200))
  .handler(async ({ data, context }) => {
    setResponseHeader("Cache-Control", "no-store");
    await requireAdmin(context);
    const result = await context.supabase.from("awin_merchant_rules").delete().eq("merchant", data);
    if (result.error) throw new Error("Não foi possível remover a regra.");
    return readRules(context.supabase);
  });

export const simulateAwinFilter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "no-store");
    await requireAdmin(context);
    const [allowed, rules] = await Promise.all([readAllowed(context.supabase), readRules(context.supabase)]);
    const { simulateAwinFeed } = await import("@/lib/awin-admin.server");
    return simulateAwinFeed(allowed, rules);
  });

export const setAwinNotAllowedMark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ mark: z.boolean() }))
  .handler(async ({ data, context }) => {
    setResponseHeader("Cache-Control", "no-store");
    await requireAdmin(context);
    const allowed = await readAllowed(context.supabase);
    const { markAwinNotAllowed } = await import("@/lib/awin-admin.server");
    return markAwinNotAllowed(allowed, data.mark);
  });
