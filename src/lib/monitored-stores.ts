import {storeSlug} from './store-pages';
export type PublicStoreIdentity = { name: string; logo_url: string | null; description: string | null };

export function storeHasProducts(count: number) { return Number.isFinite(count) && count > 0; }

/** Only the server's display-enabled public projection may create directory entries. */
export function monitoredStores(identities: Record<string, PublicStoreIdentity>, facets: Record<string, number>) {
  return Object.entries(identities).map(([searchName, store]) => ({
    searchName, name: store.name, logoUrl: store.logo_url, description: store.description,
    count: facets[searchName] ?? 0,
    href: `/loja/${storeSlug(store.name)}`,
  })).filter(store => storeHasProducts(store.count)).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'));
}