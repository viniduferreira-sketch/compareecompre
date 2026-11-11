import { describe, expect, it } from 'vitest';
import { monitoredStores } from './monitored-stores';

describe('public store directory', () => {
  const stores = { 'Kabum BR': { name: 'KaBuM', logo_url: null, description: '' }, 'Nike BR': { name: 'Nike', logo_url: null, description: '' }, Empty: { name: 'Empty', logo_url: null, description: '' } };
  it('never includes facet-only stores absent from the display-enabled projection', () => {
    expect(monitoredStores(stores, { 'Kabum BR': 20, Disabled: 999 }).map(s => s.name)).toEqual(['KaBuM', 'Empty', 'Nike']);
  });
  it('orders by real product counts, largest first', () => {
    expect(monitoredStores(stores, { 'Kabum BR': 20, 'Nike BR': 30 }).map(s => s.count)).toEqual([30, 20, 0]);
  });
  it('keeps display-enabled stores with no products and counts them as zero', () => {
    expect(monitoredStores(stores, {}).find(s => s.name === 'Empty')?.count).toBe(0);
  });
  it('uses the exact merchant facet for the filtered list', () => {
    expect(monitoredStores(stores, {})[0]?.href).toBe('/lojas-monitoradas?loja=Empty');
    expect(monitoredStores(stores, {}).find(s => s.name === 'Nike')?.href).toBe('/lojas-monitoradas?loja=Nike%20BR');
  });
});