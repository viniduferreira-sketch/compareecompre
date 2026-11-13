import { getAlgoliaIndexingConfig } from "./algolia-indexing.server";
import { calculatePopularity, productGroupId, POPULARITY_INDEX_SETTINGS, type PopularityRecord } from "./popularity";
import { storeMatches } from "./partner-stores";
import { comparisonKey, comparisonVariant } from './product-comparison';
import { classifyStoreProduct } from './store-product-filters';

export async function readPopularityClicks() {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const result = await db.rpc("product_click_counts_30d");
  if (result.error) throw new Error("Não foi possível ler os cliques para popularidade.");
  const counts = new Map((result.data ?? []).map((r) => [r.offer_id, Number(r.clicks)]));
  return { counts, total: [...counts.values()].reduce((sum, n) => sum + n, 0) };
}

export async function enrichPopularity<T extends PopularityRecord>(records: T[]) {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const [clicks, stores] = await Promise.all([readPopularityClicks(), db.from("partner_stores").select("network,external_id,merchant_name,import_enabled,display_enabled,group_variants")]);
  if (stores.error) throw new Error("Não foi possível ler o agrupamento das lojas.");
  return records.map((record) => ({ ...record,
    ...classifyStoreProduct(record),
    comparison_variant: record.comparison_variant ?? comparisonVariant(Array.isArray(record.attributes) ? record.attributes : []),
    comparison_key: comparisonKey({ ...record, comparison_variant: record.comparison_variant ?? comparisonVariant(Array.isArray(record.attributes) ? record.attributes : []) }),
    popularity_score: calculatePopularity(record, clicks.counts.get(record.objectID) ?? 0, clicks.total),
    group_key: (() => {
      const store = stores.data?.find((store) => storeMatches(store, { ...record, merchant_id: record.merchant_id ?? record.merchantId }));
      return productGroupId(store ? { ...record, store: store.external_id } : record, store?.group_variants === true);
    })(),
  }));
}

export async function configurePopularityIndex() {
  const { client, indexName } = getAlgoliaIndexingConfig();
  const ranking = await client.setSettings({ indexName, indexSettings: { customRanking: POPULARITY_INDEX_SETTINGS.customRanking } });
  await client.waitForTask({ indexName, taskID: ranking.taskID });
  const grouping = await client.setSettings({ indexName, indexSettings: { attributeForDistinct: POPULARITY_INDEX_SETTINGS.attributeForDistinct, distinct: 1 } });
  await client.waitForTask({ indexName, taskID: grouping.taskID });
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