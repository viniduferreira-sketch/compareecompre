import { describe, expect, it } from 'vitest';
import { productIndexability } from './product-indexability';
const now = Date.parse('2026-11-13T04:12:00Z');
const qa = [{source:'mercado_livre', pergunta:'Tem garantia?', data:'2026-11-01'}];
describe('product indexing policy', () => {
  it('excludes content-free products, not generated descriptions or rating totals', () => {
    expect(productIndexability({description:'Descrição', reviews:100},now).indexable).toBe(false);
  });
  it('requires two real positive prices on different dates, not different prices', () => {
    expect(productIndexability({price_history:[{date:'2026-11-01',price:50},{date:'2026-11-02',price:50}]},now).indexable).toBe(true);
    expect(productIndexability({price_history:[{date:'2026-11-01',price:50},{date:'2026-11-01',price:60}]},now).indexable).toBe(false);
  });
  it('restores indexing automatically with real partner questions', () => {
    expect(productIndexability({qa},now).indexable).toBe(true);
    expect(productIndexability({qa:[{pergunta:'Genérica'}]},now).indexable).toBe(false);
  });
  it('accepts real sourced review text but not star counts', () => {
    expect(productIndexability({reviews:[{source:'awin',text:'Minha experiência'}]},now).indexable).toBe(true);
  });
  it('unavailable or out of stock overrides own content', () => {
    expect(productIndexability({qa,status:'unavailable'},now).indexable).toBe(false);
    expect(productIndexability({qa,inStock:false},now).unavailable).toBe(true);
  });
  it('expires strictly after seven days and restores when synced', () => {
    expect(productIndexability({qa,last_synced_at:'2026-11-06T04:12:00Z'},now).indexable).toBe(true);
    expect(productIndexability({qa,last_synced_at:'2026-11-06T04:11:59Z'},now).indexable).toBe(false);
    expect(productIndexability({qa,last_synced_at:'2026-11-13T04:12:00Z'},now).indexable).toBe(true);
  });
  it('does not invent freshness for missing legacy dates', () => {
    expect(productIndexability({qa},now).stale).toBe(false);
  });
  it('retains prior public visibility protections', () => {
    for(const field of [{site_hidden:true},{quality_status:'rejected'},{price_review_status:'pending'}])
      expect(productIndexability({qa,...field},now).indexable).toBe(false);
  });
});