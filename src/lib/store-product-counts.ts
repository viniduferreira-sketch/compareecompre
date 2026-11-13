import { uniqueCatalog, selectCatalog } from './catalog-pages';
import type { RelatedHit } from './related-products';

/** Same visible distinct product population as the store listing, never raw size rows. */
export function storeProductCounts(hits: RelatedHit[]) {
  const counts = new Map<string, number>();
  for (const hit of uniqueCatalog(selectCatalog(hits, false))) {
    const store = hit.store ?? hit.merchant_name;
    if (store) counts.set(store, (counts.get(store) ?? 0) + 1);
  }
  return counts;
}