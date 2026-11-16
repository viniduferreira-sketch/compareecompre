import { describe, expect, it } from 'vitest';
import { monitoredStores, storeHasProducts } from './monitored-stores';

describe('public store directory', () => {
  const stores = { 'Kabum BR': { name: 'KaBuM', logo_url: null, description: '' }, 'Nike BR': { name: 'Nike', logo_url: null, description: '' }, Empty: { name: 'Empty', logo_url: null, description: '' } };
  it('never includes facet-only stores absent from the display-enabled projection', () => {
    expect(monitoredStores(stores, { 'Kabum BR': 20, Disabled: 999 }).map(s => s.name)).toEqual(['KaBuM']);
  });
  it('orders by real product counts, largest first', () => {
    expect(monitoredStores(stores, { 'Kabum BR': 20, 'Nike BR': 30 }).map(s => s.count)).toEqual([30, 20]);
  });
  it('excludes zero-product stores from public lists and counts', () => {
    expect(monitoredStores(stores, {Empty:0})).toEqual([]);
  });
  it('uses the exact merchant facet for the filtered list', () => {
    expect(monitoredStores(stores, {'Nike BR':1}).find(s => s.name === 'Nike')?.href).toBe('/loja/nike');
  });
  it('automatically restores listing and sitemap path when the first product arrives', () => {
    expect(monitoredStores(stores, {Empty:0}).map(s=>s.href)).not.toContain('/loja/empty');
    expect(monitoredStores(stores, {Empty:1}).map(s=>s.href)).toEqual(['/loja/empty']);
  });
  it('noindex eligibility uses the whole store count, not a filtered empty selection', () => {
    expect(storeHasProducts(0)).toBe(false);
    expect(storeHasProducts(1)).toBe(true);
    expect(storeHasProducts(30)).toBe(true);
  });
});