import { createRemoteJWKSet, jwtVerify } from "jose";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { authorizedAwinWorkflow, awinRowSchema, normalizeAwinProduct, awinDiscardReason, type AwinProduct, type AwinRow } from "./awin-catalog";
import { awinRowPriority, awinRuleDiscard, findAwinRule, MERCHANT_LIMIT_REASON, type AwinMerchantRule } from "./awin-rules";
import { normalizeAwinMerchantName } from "./awin-allowlist";
import { addDiscard, type DiscardReasons } from "./import-discards";
import { getAlgoliaIndexingConfig, ensureIdentifierFacets } from "./algolia-indexing.server";
import { withAlgoliaConnectionRetry } from "./algolia-connection";
import { enrichPopularity } from "./popularity.server";
import { applyStoreDisplay, storeMatches, type StoreControl } from "./partner-stores";
import { applyPriceReviewToRecords } from "./price-review.server";
import { awinSyncScope, assertAwinFeedRows } from './awin-sync-scope';

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
  z.object({ action: z.literal("testBatch"), batch: z.number().int().min(0), rows: z.array(awinRowSchema).min(1).max(100) }),
  z.object({ action: z.literal("feedResult"), importId: z.string().uuid(), feedId: z.string().uuid(), linhas: z.number().int().min(0), success: z.boolean() }),
  z.object({ action: z.literal("finish"), importId: z.string().uuid(), success: z.boolean(), error: z.string().max(500).optional() }),
  z.object({ action: z.literal('workflowEnd'), importId:z.string().uuid().optional(), conclusion:z.enum(['success','failure','cancelled']) }),
]);

type AwinBatchConfiguration = {
  allowedMerchants: string[];
  controls: StoreControl[];
  rules: AwinMerchantRule[];
};

type EvaluatedCandidate = { product: AwinProduct; rule: AwinMerchantRule; priority: number };

async function readAwinBatchConfiguration(db: SupabaseClient<Database>): Promise<AwinBatchConfiguration> {
  const allowlist = await db.from("awin_allowed_merchants").select("merchant_name");
  if (allowlist.error) throw new Error("Não foi possível ler os anunciantes Awin permitidos.");
  const allowedMerchants = (allowlist.data ?? []).map((row) => row.merchant_name);
  const controls = await db.from("partner_stores").select("network,external_id,merchant_name,import_enabled,display_enabled").eq("network", "awin");
  if (controls.error) throw new Error("Não foi possível conferir os controles das lojas Awin.");
  const rulesResult = await db.from("awin_merchant_rules").select("merchant,category_terms,excluded_category_terms,max_products");
  if (rulesResult.error) throw new Error("Não foi possível ler as regras por loja da Awin.");
  return { allowedMerchants, controls: controls.data ?? [], rules: rulesResult.data ?? [] };
}

function evaluateAwinBatch(rows: AwinRow[], configuration: AwinBatchConfiguration) {
  const { allowedMerchants, controls, rules } = configuration;
  const reasons: DiscardReasons = {};
  // Pipeline order: allowlist → adult content → BRL → partner category → per-store limit.
  const candidates: EvaluatedCandidate[] = [];
  const syncedAt = new Date().toISOString();
  for (const row of rows) {
    if (controls.some((store) => storeMatches(store, { source: "awin", store: row["merchant_name"], merchant_id: row["merchant_id"] }) && !store.import_enabled)) { addDiscard(reasons, "merchant_not_allowed"); continue; }
    const reason = awinDiscardReason(row, allowedMerchants) ?? awinRuleDiscard(row, rules);
    if (reason) { addDiscard(reasons, reason); continue; }
    const product = normalizeAwinProduct(row, syncedAt, allowedMerchants);
    const rule = findAwinRule(row, rules);
    if (!product || !rule) { addDiscard(reasons, "invalid_id"); continue; }
    candidates.push({ product, rule, priority: awinRowPriority(row) });
  }
  const unique = new Map<string, EvaluatedCandidate>();
  for (const candidate of candidates) unique.set(candidate.product.objectID, candidate);
  const duplicates = candidates.length - unique.size;
  if (duplicates) reasons["duplicate_in_batch"] = duplicates;
  const byMerchant = new Map<string, EvaluatedCandidate[]>();
  for (const candidate of unique.values()) byMerchant.set(candidate.rule.merchant, [...(byMerchant.get(candidate.rule.merchant) ?? []), candidate]);
  for (const list of byMerchant.values()) list.sort((a, b) => b.priority - a.priority);
  return { reasons, duplicates, byMerchant };
}

function batchCounts(rowCount: number, indexed: number, duplicates: number) {
  return { indexed, skipped: rowCount - indexed - duplicates };
}

export async function handleAwinImport(runId: string, input: z.infer<typeof importRequestSchema>) {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  if(input.action==='workflowEnd'){
    // Caller identity was verified against this exact workflow and run ID.
    const status=input.conclusion==='cancelled'?'cancelled':'failed';
    let lookup=db.from('catalog_imports').select('id,status,github_run_id').eq('source','awin');
    lookup=input.importId?lookup.eq('id',input.importId):lookup.eq('github_run_id',runId);
    const found=await lookup.maybeSingle();
    if(found.error)throw new Error('Não foi possível conferir o encerramento.');
    const job=found.data;
    if(!job)return {ok:true};
    if(job.github_run_id&&job.github_run_id!==runId)throw new Error('Execução não autorizada.');
    if(input.conclusion==='success'||!['queued','running'].includes(job.status))return {ok:true};
    const saved=await db.from('catalog_imports').update({status,finished_at:new Date().toISOString(),error:status==='cancelled'?'Execução cancelada no GitHub.':'Execução falhou no GitHub.'}).eq('id',job.id).eq('source','awin').in('status',['queued','running']);
    if(saved.error)throw new Error('Não foi possível registrar o encerramento.');
    return {ok:true};
  }
  if (input.action === "testBatch") {
    const configuration = await readAwinBatchConfiguration(db);
    const { reasons, duplicates, byMerchant } = evaluateAwinBatch(input.rows, configuration);
    const acceptedByMerchant = Object.fromEntries([...byMerchant].map(([merchant, list]) => [merchant, list.length]));
    const indexed = [...byMerchant.values()].reduce((count, list) => count + list.length, 0);
    return { dryRun: true as const, batch: input.batch, ...batchCounts(input.rows.length, indexed, duplicates), discardReasons: reasons, acceptedByMerchant };
  }
  if (input.action === "start") {
    // Clear only abandoned jobs, not catalog records. Workflow concurrency prevents simultaneous downloads.
    const expired=await db.rpc('expire_idle_awin_jobs');
    if(expired.error)throw new Error('Não foi possível conferir execuções expiradas.');
    const { readImportFeeds } = await import("./awin-feeds.server");
    const existing = await db.from("catalog_imports").select("id,status,sync_cursor").eq('source', 'awin').eq("github_run_id", runId).maybeSingle();
    if (existing.error) throw new Error("Não foi possível ler a importação.");
    if (existing.data) {
      if (existing.data.status !== 'running') throw new Error('Importação encerrada.');
      const scope = awinSyncScope(existing.data.sync_cursor);
      return { importId: existing.data.id, feeds: await readImportFeeds(process.env['AWIN_FEED_URL'], scope?.feedId) };
    }
    const result = input.importId
      ? await db.from("catalog_imports").update({ status: "running", github_run_id: runId, updated_at: new Date().toISOString() }).eq('source', 'awin').eq("id", input.importId).eq("status", "queued").select("id,sync_cursor").single()
      : await db.from("catalog_imports").insert({ source: 'awin', status: "running", github_run_id: runId }).select("id,sync_cursor").single();
    if (result.error || !result.data) throw new Error("Importação já em andamento ou solicitação inválida.");
    try {
      const scope = awinSyncScope(result.data.sync_cursor);
      const feeds = await readImportFeeds(process.env['AWIN_FEED_URL'], scope?.feedId);
      await ensureIdentifierFacets();
      return { importId: result.data.id, feeds };
    } catch (error) {
      await db.from('catalog_imports').update({ status: 'failed', finished_at: new Date().toISOString(), error: 'Não foi possível iniciar a leitura do feed selecionado.' }).eq('id', result.data.id).eq('source', 'awin');
      throw error;
    }
  }
  const { data: job, error } = await db.from("catalog_imports").select("id,status,created_at,sync_cursor").eq('source', 'awin').eq("id", input.importId).eq("github_run_id", runId).single();
  if (error || !job) throw new Error("Importação não autorizada.");
  const scope = awinSyncScope(job.sync_cursor);
  if (input.action === "feedResult") {
    if (job.status !== "running") throw new Error("Importação encerrada.");
    if (scope && scope.feedId !== input.feedId) throw new Error('Resultado de outro feed não autorizado.');
    const erro = input.success ? null : "Falha no download ou processamento deste feed.";
    const saved = await db.from("awin_feed_import_results").upsert({import_id:job.id,feed_id:input.feedId,linhas:input.linhas,status:input.success?"completed":"failed",erro});
    if (saved.error) throw new Error("Não foi possível registrar o resultado do feed.");
    const updated = await db.from("awin_feeds").update({ultima_importacao_em:new Date().toISOString(),ultima_importacao_linhas:input.linhas}).eq("id",input.feedId);
    if (updated.error) throw new Error("Não foi possível atualizar o histórico do feed.");
    return {ok:true};
  }
  if (input.action === "finish") {
    if(job.status!=='running')return {success:job.status==='completed',indexed:0};
    let indexed = 0;
    for (let offset = 0; ; offset += 1000) {
      const batches = await db.from("catalog_import_batches").select("indexed").eq("import_id", job.id).order("batch").range(offset, offset + 999);
      if (batches.error) throw new Error("Não foi possível conferir os lotes.");
      indexed += (batches.data ?? []).reduce((n, b) => n + b.indexed, 0);
      if ((batches.data ?? []).length < 1000) break;
    }
    const feedResults = await db.from("awin_feed_import_results").select("status").eq("import_id",job.id);
    if (feedResults.error) throw new Error("Não foi possível conferir os feeds.");
    const failedFeeds = (feedResults.data ?? []).filter(f=>f.status==="failed").length;
    const success = input.success && indexed > 0 && !failedFeeds;
    const result = await db.from("catalog_imports").update({ status: success ? "completed" : "failed", finished_at: new Date().toISOString(), updated_at: new Date().toISOString(), error: success ? null : "Importação incompleta ou sem produtos válidos. Consulte a execução no GitHub." }).eq("id", job.id).eq('status','running');
    if (result.error) throw new Error("Não foi possível finalizar a importação.");
    return { success, indexed };
  }
  if (job.status !== "running") throw new Error("Importação encerrada.");
  assertAwinFeedRows(scope, input.rows);
  const previous = await db.from("catalog_import_batches").select("indexed,skipped,discard_reasons").eq("import_id", job.id).eq("batch", input.batch).maybeSingle();
  if (previous.error) throw new Error("Não foi possível conferir o lote.");
  if (previous.data) return previous.data;
  const configuration = await readAwinBatchConfiguration(db);
  const { reasons, duplicates, byMerchant } = evaluateAwinBatch(input.rows, configuration);
  const products: AwinProduct[] = [];
  for (const [merchant, list] of byMerchant) {
    // Durable per-import, per-store counter; idempotent for retried batches.
    const claim = await db.rpc("claim_awin_merchant_slots", { _import_id: job.id, _batch: input.batch, _merchant: merchant, _requested: list.length, _limit: list[0]?.rule.max_products ?? 0 });
    if (claim.error || typeof claim.data !== "number") throw new Error("Não foi possível reservar o limite da loja.");
    products.push(...list.slice(0, claim.data).map((candidate) => candidate.product));
    for (let i = claim.data; i < list.length; i++) addDiscard(reasons, MERCHANT_LIMIT_REASON);
  }
  if (products.length) {
    const enriched = applyStoreDisplay(await applyPriceReviewToRecords(await enrichPopularity(products)), configuration.controls);
    // Save the source of truth before indexing. A failed Algolia write retries these same IDs safely.
    const saved = await db.from("partner_catalog").upsert(enriched.map((record) => ({ object_id: record.objectID, source: "awin", record, last_synced_at: record.last_synced_at })), { onConflict: "object_id" });
    if (saved.error) throw new Error("Falha ao persistir produtos Awin.");
    const { indexName } = getAlgoliaIndexingConfig();
    await withAlgoliaConnectionRetry(({ client }) => client.saveObjects({ indexName, objects: enriched, waitForTasks: true, batchSize: 100 }), getAlgoliaIndexingConfig);
  }
  const counts = batchCounts(input.rows.length, products.length, duplicates);
  const savedBatch = await db.from("catalog_import_batches").upsert({ import_id: job.id, batch: input.batch, ...counts, discard_reasons: reasons });
  if (savedBatch.error) throw new Error("Não foi possível registrar o progresso.");
  await db.from("catalog_imports").update({ updated_at: new Date().toISOString() }).eq("id", job.id);
  return counts;
}

/** Runs the real published batch handler against a bounded feed sample, with no job/catalog/index writes. */
export async function testAwinImporterDryRun(): Promise<{
  dryRun: true;
  batch: number;
  indexed: number;
  skipped: number;
  discardReasons: DiscardReasons;
  acceptedByMerchant: Record<string, number>;
  sampled: number;
}> {
  const { readImportFeeds } = await import("./awin-feeds.server");
  const { parseCsv, openFeed } = await import("../../scripts/awin-feed-reader.mjs");
  const feeds = await readImportFeeds(process.env["AWIN_FEED_URL"]);
  const sampled = new Map<string, AwinRow[]>();
  for (const feed of feeds) {
  const body = await openFeed(feed.url, {limited:true});
  for await (const row of parseCsv(body)) {
    const merchant = normalizeAwinMerchantName(row["merchant_name"] ?? "");
    if (merchant !== "kabum" && merchant !== "nike") continue;
    const list = sampled.get(merchant) ?? [];
    if (list.length < 50) { list.push(row); sampled.set(merchant, list); }
    if ((sampled.get("kabum")?.length ?? 0) === 50 && (sampled.get("nike")?.length ?? 0) === 50) break;
  }
  }
  const rows = [...sampled.values()].flat();
  if (!rows.length) throw new Error("O feed não contém linhas da KaBuM ou da Nike para o teste.");
  const result = await handleAwinImport("dry-run", { action: "testBatch", batch: 0, rows });
  if (!("dryRun" in result)) throw new Error("O teste do importador retornou um formato inesperado.");
  return { ...result, sampled: rows.length };
}
