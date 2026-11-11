import { describe, it, expect } from 'vitest';
import { selectRelated, type RelatedHit } from './related-products';
const current: RelatedHit = { objectID: 'current', title: 'Atual', price: 100, categoryName: 'Casa', group_key: 'same' };
const hit = (id: string, extra: Partial<RelatedHit> = {}): RelatedHit => ({ ...current, objectID: id, group_key: id, ...extra });
describe('related product rules', () => {
  it('excludes the current product and same group_key variants', () => { expect(selectRelated([current, hit('variant', { group_key: 'same' }), hit('ok')], current, { limit: 4 }).map(h => h.objectID)).toEqual(['ok']); });
  it('keeps only the same category', () => { expect(selectRelated([hit('wrong', { categoryName: 'Moda' }), hit('ok')], current, { limit: 4 }).map(h => h.objectID)).toEqual(['ok']); });
  it('accepts the inclusive 70% to 130% price range', () => { expect(selectRelated([hit('low', { price: 69 }), hit('70', { price: 70 }), hit('130', { price: 130 }), hit('high', { price: 131 })], current, { limit: 4, min: 70, max: 130 }).map(h => h.price)).toEqual([70,130]); });
  it('orders by popularity and allows at most two of a normalized brand', () => { expect(selectRelated([hit('a', { brand: 'Nike', popularity_score: 70 }), hit('b', { brand: ' NIKE ', popularity_score: 100 }), hit('c', { brand: 'nike', popularity_score: 90 }), hit('d', { brand: 'Adidas', popularity_score: 80 })], current, { limit: 4, brandLimit: 2 }).map(h => h.objectID)).toEqual(['b','c','d']); });
  it('does not repeat alternatives in the category block', () => { expect(selectRelated([hit('a'), hit('b')], current, { limit: 8, exclude: ['a'] }).map(h => h.objectID)).toEqual(['b']); });
  it('excludes other representatives of an alternative group in the category block', () => { expect(selectRelated([hit('a', {group_key:'alternative'}), hit('b')], current, {limit:8,excludeGroups:['alternative']}).map(h=>h.objectID)).toEqual(['b']); });
  it('rejects unavailable, rejected, hidden and price-review pending offers', () => { expect(selectRelated([hit('a',{status:'unavailable'}),hit('b',{quality_status:'rejected'}),hit('c',{site_hidden:true}),hit('d',{price_review_status:'pending'}),hit('e')], current, {limit:8}).map(h=>h.objectID)).toEqual(['e']); });
});