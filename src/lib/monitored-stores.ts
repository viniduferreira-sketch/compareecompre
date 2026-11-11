export type PublicStoreIdentity = { name: string; logo_url: string | null; description: string | null };

/** Only the server's display-enabled public projection may create directory entries. */
export function monitoredStores(identities: Record<string, PublicStoreIdentity>, facets: Record<string, number>) {
  return Object.entries(identities).map(([searchName, store]) => ({
    searchName, name: store.name, logoUrl: store.logo_url, description: store.description,
    count: facets[searchName] ?? 0,
    href: `/lojas-monitoradas?loja=${encodeURIComponent(searchName)}`,
  })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'));
}