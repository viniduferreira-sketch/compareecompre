import { getAlgoliaIndexingConfig } from "./algolia-indexing.server";
import { calculatePopularity, productGroupId, POPULARITY_INDEX_SETTINGS, type PopularityRecord } from "./popularity";

export async function readPopularityClicks() {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const result = await db.rpc("product_click_counts_30d");
  if (result.error) throw new Error("Não foi possível ler os cliques para popularidade.");
  const counts = new Map((result.data ?? []).map((r) => [r.offer_id, Number(r.clicks)]));
  return { counts, total: [...counts.values()].reduce((sum, n) => sum + n, 0) };
}

export async function enrichPopularity<T extends PopularityRecord>(records: T[]) {
  const clicks = await readPopularityClicks();
  return records.map((record) => ({ ...record,
    popularity_score: calculatePopularity(record, clicks.counts.get(record.objectID) ?? 0, clicks.total),
    product_group_id: productGroupId(record),
  }));
}

export async function configurePopularityIndex() {
  const { client, indexName } = getAlgoliaIndexingConfig();
  for (const name of [indexName, `${indexName}_price_asc`, `${indexName}_price_desc`]) {
    const result = await client.setSettings({ indexName: name, indexSettings: POPULARITY_INDEX_SETTINGS });
    await client.waitForTask({ indexName: name, taskID: result.taskID });
  }
}

/** One bounded cursor page. Recalculation changes only popularity_score, never visibility/links/dates. */
export async function recalculatePopularityPage(cursor?: string) {
  const { client, indexName } = getAlgoliaIndexingConfig();
  const clicks = await readPopularityClicks();
  const page = await client.browse<PopularityRecord>({ indexName, browseParams: {
    hitsPerPage: 500, ...(cursor ? { cursor } : {}),
  } });
  const updates = page.hits.map((record) => ({ objectID: record.objectID,
    popularity_score: calculatePopularity(record, clicks.counts.get(record.objectID) ?? 0, clicks.total),
  }));
  if (updates.length) {
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const saved = await db.rpc("patch_catalog_popularity", { _updates: updates });
    if (saved.error) throw new Error("Não foi possível persistir a popularidade.");
    await client.partialUpdateObjects({ indexName, objects: updates, createIfNotExists: false, waitForTasks: true });
  }
  const distribution: Record<string, number> = {};
  for (const u of updates) {
    const bucket = u.popularity_score === 100 ? "100" : `${Math.floor(u.popularity_score / 10) * 10}–${Math.floor(u.popularity_score / 10) * 10 + 9}`;
    distribution[bucket] = (distribution[bucket] ?? 0) + 1;
  }
  return { updated: updates.length, cursor: page.cursor ?? null, distribution };
}