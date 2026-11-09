import { getAlgoliaIndexingConfig, ensureIdentifierFacets } from "./algolia-indexing.server";
import { calculatePopularity, type PopularityRecord } from "./popularity";
import { readPopularityClicks } from "./popularity.server";
import type { Json } from "@/integrations/supabase/types";
import { detectSuspiciousPrices, type PriceDetection, type PriceReviewRecord } from "./price-review";

type ReviewRow = {
  object_id: string;
  source: string | null;
  store: string | null;
  title: string;
  price: number;
  median_price: number | null;
  peer_count: number;
  reason: "below_minimum" | "below_median";
  status: "pending" | "approved";
  detected_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

type PendingRow = {
  object_id: string;
  source: string | null;
  store: string | null;
  title: string;
  price: number;
  median_price: number | null;
  peer_count: number;
  reason: "below_minimum" | "below_median";
  status: "pending";
  detected_at: string;
};

type ReviewStamp = {
  price_review_status: "pending" | "approved";
  price_review_reason: "below_minimum" | "below_median";
  price_review_median: number | null;
  price_review_peer_count: number;
  price_reviewed_at: string;
};

async function readDecisions(): Promise<Map<string, ReviewRow>> {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const rows: ReviewRow[] = [];
  for (let from = 0; ; from += 1000) {
    const result = await db.from("price_review_items").select("*").order("object_id").range(from, from + 999);
    if (result.error) throw new Error("Não foi possível ler as decisões de preço.");
    rows.push(...(result.data ?? []) as ReviewRow[]);
    if ((result.data ?? []).length < 1000) break;
  }
  return new Map(rows.map((row) => [row.object_id, row]));
}

const detectionFor = (row: ReviewRow): PriceDetection => ({ reason: row.reason, median: row.median_price === null ? null : Number(row.median_price), peerCount: row.peer_count });
const stampFor = (detection: PriceDetection, status: "pending" | "approved", date: string): ReviewStamp => ({
  price_review_status: status,
  price_review_reason: detection.reason,
  price_review_median: detection.median,
  price_review_peer_count: detection.peerCount,
  price_reviewed_at: date,
});

async function savePending(rows: PendingRow[]) {
  if (!rows.length) return;
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const result = await db.from("price_review_items").upsert(rows, { onConflict: "object_id" });
  if (result.error) throw new Error("Não foi possível gravar a fila de preços suspeitos.");
}

/** Shared by every importer. Existing pending items stay hidden; admin approvals survive later syncs. */
export async function applyPriceReviewToRecords<T extends PriceReviewRecord>(records: T[]): Promise<Array<T & Partial<ReviewStamp>>> {
  if (!records.length) return [];
  const decisions = await readDecisions();
  const detections = detectSuspiciousPrices(records);
  const now = new Date().toISOString();
  const pendingRows: PendingRow[] = [];
  const reviewed = records.map((record) => {
    const decision = decisions.get(record.objectID);
    if (decision?.status === "approved") return { ...record, ...stampFor(detectionFor(decision), "approved", decision.reviewed_at ?? now) };
    const detection = decision?.status === "pending" ? detectionFor(decision) : detections.get(record.objectID);
    if (!detection) return record;
    const detectedAt = decision?.detected_at ?? now;
    pendingRows.push({
      object_id: record.objectID, source: record.source ?? null, store: record.store ?? null,
      title: record.title ?? record.objectID, price: record.price!, median_price: detection.median,
      peer_count: detection.peerCount, reason: detection.reason, status: "pending" as const, detected_at: detectedAt,
    });
    return { ...record, ...stampFor(detection, "pending", detectedAt) };
  });
  await savePending(pendingRows);
  return reviewed as Array<T & Partial<ReviewStamp>>;
}

/** Scans only the existing index. Also recalculates scores with the new >70% discount rule. */
export async function scanPriceReviewCatalog() {
  await ensureIdentifierFacets();
  const { client, indexName } = getAlgoliaIndexingConfig();
  const records: Array<PriceReviewRecord & PopularityRecord> = [];
  await client.browseObjects<PriceReviewRecord & PopularityRecord>({
    indexName,
    browseParams: { hitsPerPage: 1000 },
    aggregator: (batch) => { records.push(...batch.hits); },
  });
  const [decisions, clicks] = await Promise.all([readDecisions(), readPopularityClicks()]);
  const detections = detectSuspiciousPrices(records);
  const now = new Date().toISOString();
  const updates: Array<Record<string, unknown> & { objectID: string }> = [];
  const pendingRows: PendingRow[] = [];
  let newPending = 0;
  for (const record of records) {
    const decision = decisions.get(record.objectID);
    const detection = decision?.status === "approved" ? undefined : decision?.status === "pending" ? detectionFor(decision) : detections.get(record.objectID);
    const update: Record<string, unknown> & { objectID: string } = {
      objectID: record.objectID,
      popularity_score: calculatePopularity(record, clicks.counts.get(record.objectID) ?? 0, clicks.total),
    };
    if (detection) {
      const detectedAt = decision?.detected_at ?? now;
      Object.assign(update, stampFor(detection, "pending", detectedAt));
      if (decision?.status !== "pending") newPending++;
      pendingRows.push({
        object_id: record.objectID, source: record.source ?? null, store: record.store ?? null,
        title: record.title ?? record.objectID, price: record.price!, median_price: detection.median,
        peer_count: detection.peerCount, reason: detection.reason, status: "pending" as const, detected_at: detectedAt,
      });
    } else if (decision?.status === "approved" && record.price_review_status === "pending") {
      Object.assign(update, stampFor(detectionFor(decision), "approved", decision.reviewed_at ?? now));
    }
    updates.push(update);
  }
  await savePending(pendingRows);
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  for (let start = 0; start < updates.length; start += 500) {
    const batch = updates.slice(start, start + 500);
    const saved = await db.rpc("patch_catalog_price_review", { _updates: batch as unknown as Json });
    if (saved.error) throw new Error("Não foi possível persistir a revisão de preços.");
    await client.partialUpdateObjects({ indexName, objects: batch, createIfNotExists: false, waitForTasks: true });
  }
  return {
    scanned: records.length,
    updated: updates.length,
    newPending,
    pending: pendingRows.length,
    belowMinimum: pendingRows.filter((row) => row["reason"] === "below_minimum").length,
    belowMedian: pendingRows.filter((row) => row["reason"] === "below_median").length,
  };
}

export async function approvePriceReview(objectID: string, userId: string) {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const current = await db.from("price_review_items").select("*").eq("object_id", objectID).maybeSingle();
  if (current.error || !current.data) throw new Error("Produto não encontrado na fila de revisão.");
  const row = current.data as ReviewRow;
  const now = new Date().toISOString();
  const approved = await db.from("price_review_items").update({ status: "approved", reviewed_at: now, reviewed_by: userId }).eq("object_id", objectID);
  if (approved.error) throw new Error("Não foi possível registrar a liberação.");
  const update = [{ objectID, ...stampFor(detectionFor(row), "approved", now) }];
  const saved = await db.rpc("patch_catalog_price_review", { _updates: update });
  if (saved.error) throw new Error("A liberação foi registrada, mas o cadastro não foi atualizado.");
  const { client, indexName } = getAlgoliaIndexingConfig();
  await client.partialUpdateObjects({ indexName, objects: update, createIfNotExists: false, waitForTasks: true });
  return { objectID, status: "approved" as const, reviewedAt: now };
}
