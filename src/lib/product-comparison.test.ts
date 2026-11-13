import { describe, expect, it } from 'vitest';
import { comparisonKey, groupComparedOffers, isSameProduct, COMPARISON_CACHE_MS } from './product-comparison';
const variant = { type: 'smartphone', storage: '128GB', ram: '8GB', colour: 'Preto', network: '5G' };
const base = { brand: 'Samsung', model: 'SM-A156M', comparison_variant: variant };
describe('comparação exata', () => {
  it('normaliza EAN/GTIN para uma chave compartilhada entre lojas', () => {
    expect(comparisonKey({ ean: '7891234567890' })).toBe('gtin:07891234567890');
    expect(isSameProduct({ ean: '7891234567890' }, { gtin: '07891234567890' })).toBe(true);
  });
  it('EANs diferentes nunca recorrem a marca/modelo', () => expect(isSameProduct({ ...base, gtin: '12345678' }, { ...base, gtin: '12345679' })).toBe(false));
  it('marca/modelo só com variante completa e igual', () => {
    expect(isSameProduct(base, { ...base, brand: 'SAMSUNG' })).toBe(true);
    expect(isSameProduct(base, { ...base, comparison_variant: { ...variant, storage: '256GB' } })).toBe(false);
  });
  it('dados incompletos ou modelo genérico não agrupam', () => {
    expect(comparisonKey({ brand: 'Samsung', model: 'SM-A156M' })).toBeNull();
    expect(comparisonKey({ ...base, comparison_variant: { ...variant, ram: '' } })).toBeNull();
    expect(comparisonKey({ ...base, model: 'Smartphone' })).toBeNull();
  });
  it('não mistura oferta com EAN com fallback sem EAN', () => expect(isSameProduct({ ...base, ean: '12345678' }, base)).toBe(false));
  it('mantém lojas diferentes e menor preço por loja, frete e destino originais', () => {
    const hit = (objectID: string, store: string, price: number) => ({ objectID, store, price, gtin: '12345678', status: 'active', affiliateUrl: `https://loja.com/${objectID}`, shippingCost: 12 });
    const out = groupComparedOffers({ gtin: '12345678' }, [hit('a', 'KaBuM', 299), hit('b', 'Mercado Livre', 279), hit('c', 'Mercado Livre', 289)]);
    expect(out.map(o => [o.id, o.price])).toEqual([['b', 279], ['a', 299]]);
    expect(out[0]?.affiliateUrl).toBe('https://loja.com/b');
    expect(out[0]?.shippingCost).toBe(12);
  });
  it('não mostra indisponíveis, rejeitados ou revisão pendente', () => {
    const hit = { objectID: 'a', store: 'Loja', price: 10, gtin: '12345678', affiliateUrl: 'https://loja.com' };
    expect(groupComparedOffers(hit, [{ ...hit, status: 'unavailable' }, { ...hit, quality_status: 'rejected' }, { ...hit, price_review_status: 'pending' }])).toEqual([]);
  });
  it('cache dura cinco minutos', () => expect(COMPARISON_CACHE_MS).toBe(300000));
});