import { algoliasearch } from "algoliasearch";
import { ALGOLIA_SERVER_TIMEOUTS, withAlgoliaConnectionRetry } from "./algolia-connection";

export const CATALOG_FACETS = ["searchable(store)", "searchable(categoryName)", "searchable(brand)", "freeShipping", "filterOnly(status)", "filterOnly(quality_status)", "filterOnly(gtin)", "filterOnly(model)", "filterOnly(site_hidden)", "filterOnly(price_review_status)"];

/** Merge, never replace existing facet settings or recreate any index. */
export async function ensureIdentifierFacets() {
  const { indexName } = getAlgoliaIndexingConfig();
  for (const name of [indexName, `${indexName}_price_asc`, `${indexName}_price_desc`]) {
    const settings = await withAlgoliaConnectionRetry(({ client }) => client.getSettings({ indexName: name }), getAlgoliaIndexingConfig);
    const facets = [...new Set([...(settings.attributesForFaceting ?? []), ...CATALOG_FACETS])];
    if (facets.length === settings.attributesForFaceting?.length) continue;
    const { taskID } = await withAlgoliaConnectionRetry(({ client }) => client.setSettings({ indexName: name, indexSettings: { attributesForFaceting: facets } }), getAlgoliaIndexingConfig);
    await withAlgoliaConnectionRetry(({ client }) => client.waitForTask({ indexName: name, taskID }), getAlgoliaIndexingConfig);
  }
}

// Only indexing and exact-object reads use this credential. User searches use the browser lite client.
export function getAlgoliaIndexingConfig() {
  const connectionKey = process.env["ALGOLIA_API_KEY"];
  const lovableKey = process.env["LOVABLE_API_KEY"];
  if (!connectionKey || !lovableKey) throw new Error("As credenciais do Algolia não estão configuradas.");
  return {
    indexName: "produtos_mercado_livre",
    client: algoliasearch("gateway", connectionKey, {
      hosts: [{ url: "connector-gateway.lovable.dev/algolia", accept: "readWrite", protocol: "https" }],
      baseHeaders: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connectionKey },
      timeouts: ALGOLIA_SERVER_TIMEOUTS,
    }),
  };
}