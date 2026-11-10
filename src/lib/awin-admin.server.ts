// Admin-only Awin operations: feed filter simulation (read-only) and reversible
// "anunciante não permitido" marking. Never deletes catalog records.
import { awinDiscardReason } from "./awin-catalog";
import { isAwinMerchantAllowed } from "./awin-allowlist";
import { MERCHANT_NOT_ALLOWED_REASON } from "./content-policy";
import { awinRowPriority, awinRuleDiscard, findAwinRule, MERCHANT_LIMIT_REASON, type AwinMerchantRule } from "./awin-rules";
import { getAlgoliaIndexingConfig } from "./algolia-indexing.server";

type Row = Record<string, string>;

import { parseCsv, openFeed } from "../../scripts/awin-feed-reader.mjs";
export { parseCsv };

export type AwinSimulationStore = {
  merchant: string;
  merchantId: string;
  rule: string | null;
  limit: number | null;
  rows: number;
  accepted: number;
  discards: Record<string, number>;
  categories: { category: string; rows: number; accepted: number }[];
  examples: { id: string; title: string; price: string; category: string; gtin: boolean }[];
};

export async function simulateAwinFeed(allowed: string[], rules: AwinMerchantRule[]) {
  const { readImportFeeds } = await import("./awin-feeds.server");
  const feeds = await readImportFeeds(process.env["AWIN_FEED_URL"]);

  type Eligible = { row: Row; priority: number; order: number };
  const stores = new Map<string, { s: AwinSimulationStore; eligible: Eligible[]; catRows: Map<string, number> }>();
  let total = 0;
  for (const feed of feeds) {
  const body = await openFeed(feed.url);
  for await (const row of parseCsv(body)) {
    total++;
    const name = row["merchant_name"] || "(sem nome)";
    let entry = stores.get(name);
    if (!entry) {
      const rule = findAwinRule(row, rules);
      entry = {
        s: { merchant: name, merchantId: row["merchant_id"] ?? "", rule: rule?.merchant ?? null, limit: rule?.max_products ?? null, rows: 0, accepted: 0, discards: {}, categories: [], examples: [] },
        eligible: [], catRows: new Map(),
      };
      stores.set(name, entry);
    }
    entry.s.rows++;
    const category = row["merchant_category"] || "(sem categoria)";
    entry.catRows.set(category, (entry.catRows.get(category) ?? 0) + 1);
    const reason = awinDiscardReason(row, allowed) ?? awinRuleDiscard(row, rules);
    if (reason) { entry.s.discards[reason] = (entry.s.discards[reason] ?? 0) + 1; continue; }
    // Keep only what the report needs, not the whole row.
    entry.eligible.push({
      row: { aw_product_id: row["aw_product_id"] ?? "", product_name: (row["product_name"] ?? "").slice(0, 120), search_price: row["search_price"] ?? "", merchant_category: category, ean: row["ean"] ?? "", product_GTIN: row["product_GTIN"] ?? "" },
      priority: awinRowPriority(row), order: entry.eligible.length,
    });
  }

  }
  const result: AwinSimulationStore[] = [];
  for (const { s, eligible, catRows } of stores.values()) {
    eligible.sort((a, b) => b.priority - a.priority || a.order - b.order);
    const limit = s.limit ?? 0;
    const kept = eligible.slice(0, limit);
    if (eligible.length > kept.length) s.discards[MERCHANT_LIMIT_REASON] = eligible.length - kept.length;
    s.accepted = kept.length;
    const catAccepted = new Map<string, number>();
    for (const e of kept) catAccepted.set(e.row["merchant_category"]!, (catAccepted.get(e.row["merchant_category"]!) ?? 0) + 1);
    s.categories = [...catRows.entries()]
      .map(([category, rows]) => ({ category, rows, accepted: catAccepted.get(category) ?? 0 }))
      .sort((a, b) => b.accepted - a.accepted || b.rows - a.rows)
      .slice(0, 40);
    s.examples = kept.slice(0, 15).map((e) => ({
      id: e.row["aw_product_id"]!, title: e.row["product_name"]!, price: e.row["search_price"]!,
      category: e.row["merchant_category"]!, gtin: e.priority >= 4,
    }));
    result.push(s);
  }
  result.sort((a, b) => b.rows - a.rows);
  return { totalRows: total, accepted: result.reduce((n, s) => n + s.accepted, 0), stores: result };
}

/** Marks (or restores) Awin records whose merchant is outside the allowlist. Reversible; never deletes. */
export async function markAwinNotAllowed(allowed: string[], mark: boolean) {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const ids: string[] = [];
  const byStore: Record<string, number> = {};
  for (let from = 0; ; from += 1000) {
    const page = await db.from("partner_catalog").select("object_id, store:record->>store, reason:record->>quality_reason").eq("source", "awin").order("object_id").range(from, from + 999);
    if (page.error) throw new Error("Não foi possível ler o catálogo Awin.");
    for (const r of page.data ?? []) {
      const store = String(r.store ?? "");
      const target = mark ? !isAwinMerchantAllowed(store, allowed) && r.reason !== MERCHANT_NOT_ALLOWED_REASON : r.reason === MERCHANT_NOT_ALLOWED_REASON;
      if (target) { ids.push(r.object_id); byStore[store] = (byStore[store] ?? 0) + 1; }
    }
    if ((page.data ?? []).length < 1000) break;
  }
  // The index can hold older Awin records that are no longer in the database; mark those too.
  const { client, indexName } = getAlgoliaIndexingConfig();
  const known = new Set(ids);
  const seen = new Set<string>();
  await client.browseObjects<{ objectID: string; source?: string; store?: string; quality_reason?: string | null }>({
    indexName,
    browseParams: { attributesToRetrieve: ["objectID", "source", "store", "quality_reason"], hitsPerPage: 1000 },
    aggregator: (batch) => {
      for (const h of batch.hits) {
        if (h.source !== "awin" || known.has(h.objectID) || seen.has(h.objectID)) continue;
        const target = mark ? !isAwinMerchantAllowed(h.store ?? "", allowed) && h.quality_reason !== MERCHANT_NOT_ALLOWED_REASON : h.quality_reason === MERCHANT_NOT_ALLOWED_REASON;
        if (target) { seen.add(h.objectID); byStore[h.store ?? ""] = (byStore[h.store ?? ""] ?? 0) + 1; }
      }
    },
  });
  const indexIds = [...ids, ...seen];
  if (indexIds.length) {
    // Persist first; Algolia follows with partial updates of the same IDs (safe to retry).
    for (let i = 0; i < ids.length; i += 500) {
      const res = await db.rpc("set_awin_quality_mark", { _ids: ids.slice(i, i + 500), _reason: MERCHANT_NOT_ALLOWED_REASON, _mark: mark });
      if (res.error) throw new Error("Não foi possível atualizar o catálogo Awin.");
    }
    await client.partialUpdateObjects({
      indexName,
      objects: indexIds.map((objectID) => mark
        ? { objectID, quality_status: "rejected", quality_reason: MERCHANT_NOT_ALLOWED_REASON }
        : { objectID, quality_status: null, quality_reason: null }),
      createIfNotExists: false,
      waitForTasks: true,
    });
  }
  return { changed: indexIds.length, byStore };
}
