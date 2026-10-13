import { algoliasearch } from 'algoliasearch';
export const ALGOLIA_INDEX = 'produtos_mercado_livre';
export function getAlgoliaConfig() {
  const apiKey = process.env['ALGOLIA_API_KEY'];
  const lovableKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey || !lovableKey) throw new Error('A conexão Algolia não está configurada.');
  return {
    indexName: ALGOLIA_INDEX,
    client: algoliasearch('gateway', apiKey, {
      hosts: [{ url: 'connector-gateway.lovable.dev/algolia', protocol: 'https', accept: 'readWrite' }],
      baseHeaders: { Authorization: `Bearer ${lovableKey}`, 'X-Connection-Api-Key': apiKey },
    }),
  };
}
