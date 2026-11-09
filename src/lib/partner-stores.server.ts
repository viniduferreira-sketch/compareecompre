import { lomadeeRequests } from "./lomadee-client.server";
import { getAlgoliaIndexingConfig } from "./algolia-indexing.server";
import type { LomadeeBrand } from "./lomadee-catalog";
import { storeMatches, type StoreControl } from "./partner-stores";

export async function readNetworkStores() {
  const requests = lomadeeRequests(30);
  const brands: Array<LomadeeBrand & { id: string; description?: string }> = [];
  for (let page = 1; page <= 30; page++) {
    const response = await requests.call<{ data?: Array<LomadeeBrand & { id: string; description?: string }>; meta?: { totalPages?: number }; pagination?: { totalPages?: number } }>(`/affiliate/brands?limit=20&page=${page}`);
    brands.push(...response.data ?? []);
    const pages = response.meta?.totalPages ?? response.pagination?.totalPages;
    if (pages ? page >= pages : (response.data ?? []).length < 20) return brands;
  }
  throw new Error("A leitura da rede ultrapassou 30 páginas; nenhum cadastro foi atualizado.");
}

export async function readStoreCounts() {
  const { client, indexName } = getAlgoliaIndexingConfig();
  const counts: Record<string, number> = {};
  await client.browseObjects<{ source?: string; store?: string }>({ indexName, browseParams: { attributesToRetrieve: ["source", "store"], hitsPerPage: 1000 }, aggregator: (batch) => { for (const record of batch.hits) { const key = `${record.source ?? "legacy"}:${record.store ?? ""}`; counts[key] = (counts[key] ?? 0) + 1; } } });
  return counts;
}

export async function visibilityPage(store: StoreControl, cursor: string | undefined, preview: boolean) {
  const { client, indexName } = getAlgoliaIndexingConfig();
  const response = await client.browse<{ objectID: string; source?: string; store?: string; merchant_id?: string; organizationId?: string }>({ indexName, browseParams: cursor ? { cursor } : { hitsPerPage: 500, attributesToRetrieve: ["objectID", "source", "store", "merchant_id", "organizationId"] } });
  const ids = response.hits.filter((record) => storeMatches(store, record)).map((record) => record.objectID);
  if (!preview) {
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    if (ids.length) {
      const saved = await db.rpc("patch_store_display", { _ids: ids, _network: store.network, _hidden: !store.display_enabled });
      if (saved.error) throw new Error(`Falha ao marcar visibilidade: ${saved.error.code} ${saved.error.message}`);
      await client.partialUpdateObjects({ indexName, objects: ids.map((objectID) => ({ objectID, site_hidden: !store.display_enabled })), createIfNotExists: false, waitForTasks: true });
    }
  }
  return { count: ids.length, cursor: response.cursor ?? null };
}

export async function ensureDisplayFacet() {
  const { client, indexName } = getAlgoliaIndexingConfig();
  const settings = await client.getSettings({ indexName });
  for (const name of [indexName, ...(settings.replicas ?? [])]) {
    const current = await client.getSettings({ indexName: name });
    const facets = [...new Set([...(current.attributesForFaceting ?? []), "filterOnly(site_hidden)"])];
    if (facets.length === current.attributesForFaceting?.length) continue;
    const result = await client.setSettings({ indexName: name, indexSettings: { attributesForFaceting: facets } });
    await client.waitForTask({ indexName: name, taskID: result.taskID });
  }
}