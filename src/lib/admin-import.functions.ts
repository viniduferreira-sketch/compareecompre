import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getImportStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "no-store");
    const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
    const result = await context.supabase.from("catalog_imports").select("id,source,status,created_at,updated_at,finished_at,error,github_run_id,catalog_import_batches(indexed,skipped)").order("created_at", { ascending: false }).limit(10);
    if (result.error) throw new Error("Não foi possível consultar as importações.");
    return (result.data ?? []).map(({ catalog_import_batches, ...job }) => ({
      ...job,
      indexed: catalog_import_batches.reduce((n, b) => n + b.indexed, 0),
      skipped: catalog_import_batches.reduce((n, b) => n + b.skipped, 0),
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

export const startAwinImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    setResponseHeader("Cache-Control", "no-store");
    const role = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (role.error || !role.data) throw new Error("Acesso restrito ao administrador.");
    const key = process.env["GITHUB_API_KEY"];
    const lovableKey = process.env["LOVABLE_API_KEY"];
    if (!key || !lovableKey || !process.env["AWIN_FEED_URL"]) throw new Error("A integração ainda não está configurada.");
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    await db.from("catalog_imports").update({ status: "failed", error: "Execução interrompida; solicite novamente." }).in("status", ["queued", "running"]).lt("updated_at", new Date(Date.now() - 3 * 3600_000).toISOString());
    const { data: job, error } = await db.from("catalog_imports").insert({ status: "queued" }).select("id").single();
    if (error || !job) throw new Error("Já existe uma importação em andamento.");
    try {
      const response = await fetch("https://connector-gateway.lovable.dev/github/repos/viniduferreira-sketch/compareecompre/actions/workflows/awin-import.yml/dispatches", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": key, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
        body: JSON.stringify({ ref: "main", inputs: { import_id: job.id } }),
      });
      if (!response.ok) {
        const body = await response.text();
        console.error("GitHub dispatch failed", response.status, body);
        throw new Error(`GitHub recusou o disparo (${response.status}). Confirme que a rotina já chegou ao repositório.`);
      }
      return { id: job.id };
    } catch (error) {
      await db.from("catalog_imports").update({ status: "failed", error: "Não foi possível iniciar a execução no GitHub." }).eq("id", job.id);
      throw error;
    }
  });