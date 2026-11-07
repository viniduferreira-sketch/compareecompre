import { createRemoteJWKSet, jwtVerify } from "jose";
import { z } from "zod";
import { authorizedAwinWorkflow, awinRowSchema, normalizeAwinProduct } from "./awin-catalog";
import { getAlgoliaIndexingConfig, ensureIdentifierFacets } from "./algolia-indexing.server";

export const AWIN_REPOSITORY = "viniduferreira-sketch/compareecompre";
export const AWIN_AUDIENCE = "compareecompre-awin-import";

export async function verifyAwinWorkflow(request: Request) {
  const token = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) throw new Error("Unauthorized");
  const keys = createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"));
  const { payload } = await jwtVerify(token, keys, {
    issuer: "https://token.actions.githubusercontent.com", audience: AWIN_AUDIENCE,
    algorithms: ["RS256"], maxTokenAge: "10m",
  });
  if (!authorizedAwinWorkflow(payload, AWIN_REPOSITORY)) throw new Error("Forbidden");
  return z.string().regex(/^\d+$/).parse(payload["run_id"]);
}

export const importRequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), importId: z.string().uuid().optional() }),
  z.object({ action: z.literal("batch"), importId: z.string().uuid(), batch: z.number().int().min(0), rows: z.array(awinRowSchema).min(1).max(100) }),
  z.object({ action: z.literal("finish"), importId: z.string().uuid(), success: z.boolean(), error: z.string().max(500).optional() }),
]);

export async function handleAwinImport(runId: string, input: z.infer<typeof importRequestSchema>) {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  if (input.action === "start") {
    await ensureIdentifierFacets();
    // Clear only abandoned jobs, not catalog records. Workflow concurrency prevents simultaneous downloads.
    await db.from("catalog_imports").update({ status: "failed", error: "Execução interrompida; solicite novamente." }).in("status", ["queued", "running"]).lt("updated_at", new Date(Date.now() - 3 * 3600_000).toISOString());
    const feedUrl = process.env["AWIN_FEED_URL"];
    if (!feedUrl) throw new Error("Feed Awin não configurado.");
    const url = new URL(feedUrl);
    if (url.protocol !== "https:" || url.hostname !== "productdata.awin.com" || !url.pathname.startsWith("/datafeed/download/")) throw new Error("URL do feed inválida.");
    const existing = await db.from("catalog_imports").select("id,status").eq("github_run_id", runId).maybeSingle();
    if (existing.error) throw new Error("Não foi possível ler a importação.");
    if (existing.data) return { importId: existing.data.id, feedUrl };
    const result = input.importId
      ? await db.from("catalog_imports").update({ status: "running", github_run_id: runId, updated_at: new Date().toISOString() }).eq("id", input.importId).eq("status", "queued").select("id").single()
      : await db.from("catalog_imports").insert({ status: "running", github_run_id: runId }).select("id").single();
    if (result.error || !result.data) throw new Error("Importação já em andamento ou solicitação inválida.");
    return { importId: result.data.id, feedUrl };
  }
  const { data: job, error } = await db.from("catalog_imports").select("id,status,created_at").eq("id", input.importId).eq("github_run_id", runId).single();
  if (error || !job) throw new Error("Importação não autorizada.");
  if (input.action === "finish") {
    let indexed = 0;
    for (let offset = 0; ; offset += 1000) {
      const batches = await db.from("catalog_import_batches").select("indexed").eq("import_id", job.id).order("batch").range(offset, offset + 999);
      if (batches.error) throw new Error("Não foi possível conferir os lotes.");
      indexed += (batches.data ?? []).reduce((n, b) => n + b.indexed, 0);
      if ((batches.data ?? []).length < 1000) break;
    }
    const success = input.success && indexed > 0;
    const result = await db.from("catalog_imports").update({ status: success ? "completed" : "failed", finished_at: new Date().toISOString(), updated_at: new Date().toISOString(), error: success ? null : "Importação incompleta ou sem produtos válidos. Consulte a execução no GitHub." }).eq("id", job.id);
    if (result.error) throw new Error("Não foi possível finalizar a importação.");
    return { success, indexed };
  }
  if (job.status !== "running") throw new Error("Importação encerrada.");
  const previous = await db.from("catalog_import_batches").select("indexed,skipped").eq("import_id", job.id).eq("batch", input.batch).maybeSingle();
  if (previous.error) throw new Error("Não foi possível conferir o lote.");
  if (previous.data) return previous.data;
  const mapped = input.rows.map((row) => normalizeAwinProduct(row, new Date().toISOString()));
  const products = Array.from(new Map(mapped.flatMap((p) => p ? [[p.objectID, p] as const] : [])).values());
  if (products.length) {
    // Save the source of truth before indexing. A failed Algolia write retries these same IDs safely.
    const saved = await db.from("partner_catalog").upsert(products.map((record) => ({ object_id: record.objectID, source: "awin", record, last_synced_at: record.last_synced_at })), { onConflict: "object_id" });
    if (saved.error) throw new Error("Falha ao persistir produtos Awin.");
    const { client, indexName } = getAlgoliaIndexingConfig();
    await client.saveObjects({ indexName, objects: products, waitForTasks: true, batchSize: 100 });
  }
  const counts = { indexed: products.length, skipped: mapped.filter((p) => !p).length };
  const savedBatch = await db.from("catalog_import_batches").upsert({ import_id: job.id, batch: input.batch, ...counts });
  if (savedBatch.error) throw new Error("Não foi possível registrar o progresso.");
  await db.from("catalog_imports").update({ updated_at: new Date().toISOString() }).eq("id", job.id);
  return counts;
}