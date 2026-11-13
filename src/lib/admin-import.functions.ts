import { ADMIN_HISTORY_LIMIT, ADMIN_HISTORY_SOURCES, recentImportsPerSource } from "./admin-history";
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { mergeDiscardReasons } from "./import-discards";

export const getImportStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "no-store");
    const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
    const results = await Promise.all(ADMIN_HISTORY_SOURCES.map((source) => context.supabase.from("catalog_imports").select("id,source,status,created_at,updated_at,finished_at,error,github_run_id,catalog_import_batches(indexed,skipped,discard_reasons)").eq("source", source).order("created_at", { ascending: false }).limit(ADMIN_HISTORY_LIMIT)));
    if (results.some((result) => result.error)) throw new Error("Não foi possível consultar as importações.");
    return recentImportsPerSource(results.flatMap((result) => result.data ?? [])).map(({ catalog_import_batches, ...job }) => ({
      ...job,
      indexed: catalog_import_batches.reduce((n, b) => n + b.indexed, 0),
      skipped: catalog_import_batches.reduce((n, b) => n + b.skipped, 0),
      discardReasons: mergeDiscardReasons(catalog_import_batches.map((b) => b.discard_reasons)),
      reasonsRecorded: catalog_import_batches.length > 0 && catalog_import_batches.every((b) => b.discard_reasons !== null),
    }));
  });

export const startLomadeeSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "no-store");
    const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
    const { runLomadeeSync } = await import("@/lib/lomadee-sync.server");
    return runLomadeeSync();
  });

export const startCouponSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "no-store");
    const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
    const { runLomadeeSync } = await import("@/lib/lomadee-sync.server");
    return runLomadeeSync({ couponsOnly: true });
  });

export const revalidateMlDryRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "no-store");
    const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
    const { revalidateMercadoLivreOffers } = await import("@/lib/ml-revalidate.server");
    return revalidateMercadoLivreOffers({ dryRun: true });
  });

export const revalidateMlApply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "no-store");
    const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
    const { revalidateMercadoLivreOffers } = await import("@/lib/ml-revalidate.server");
    return revalidateMercadoLivreOffers({ dryRun: false });
  });

export const mlQualityDryRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "no-store");
    const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
    const { evaluateMercadoLivreQuality } = await import("@/lib/ml-quality.server");
    return evaluateMercadoLivreQuality();
  });

export const partnerQualityDryRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "no-store");
    const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
    const allowed = await context.supabase.from("awin_allowed_merchants").select("merchant_name").order("merchant_name");
    if (allowed.error) throw new Error("Não foi possível confirmar os anunciantes Awin permitidos.");
    const { evaluatePartnerQuality } = await import("@/lib/partner-quality.server");
    return evaluatePartnerQuality((allowed.data ?? []).map((row) => row.merchant_name));
  });

export const startAwinImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "no-store");
    const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
    const { dispatchAwinImport } = await import('./awin-dispatch.server');
    return dispatchAwinImport();
  });