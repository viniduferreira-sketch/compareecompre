import { algoliasearch } from "algoliasearch";

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
    }),
  };
}