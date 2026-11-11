import { describe, expect, it } from 'vitest';
import { actualDiscount, selectCatalog, orderCatalog, uniqueCatalog, dealsCanonical } from './catalog-pages';
import type { RelatedHit } from './related-products';
import { catalogResult } from './catalog-pages.queries';
const hit = (patch: Partial<RelatedHit> = {}): RelatedHit => ({ objectID: '1', title: 'SSD modelo A', store: 'KaBuM', price: 90, originalPrice: 100, imageUrl: 'https://example.com/product.jpg', ...patch });
describe('Ofertas públicas', () => {
  it('aceita preço mínimo de R$ 30, não R$ 29,99', () => expect(selectCatalog([hit({price:30}), hit({objectID:'2',price:29.99})], true).map(h=>h.price)).toEqual([30]));
  it('exige desconto real mínimo de 10%', () => { expect(selectCatalog([hit(), hit({price:90.01}), hit({originalPrice:80}), hit({originalPrice:null,discountPercent:90})],true)).toHaveLength(1); expect(actualDiscount(hit())).toBeCloseTo(10); });
  it('exclui pendente, oculto, rejeitado, indisponível e sem imagem', () => expect(selectCatalog([hit({price_review_status:'pending'}),hit({site_hidden:true}),hit({quality_status:'rejected'}),hit({status:'unavailable'}),hit({imageUrl:null})],true)).toEqual([]));
  it('ordena maior desconto, popularidade e preço', () => { const rows=[hit({objectID:'a',price:40,popularity_score:20}),hit({objectID:'b',price:60,popularity_score:90})]; expect(orderCatalog(rows,'maior-desconto')[0]?.objectID).toBe('a'); expect(orderCatalog(rows,'mais-populares')[0]?.objectID).toBe('b'); expect(orderCatalog(rows,'menor-preco')[0]?.price).toBe(40); });
  it('deduplica apenas na mesma loja', () => expect(uniqueCatalog([hit(),hit({objectID:'2'}),hit({objectID:'3',store:'Nike'})])).toHaveLength(2));
  it('canonical ignora filtros e preserva página', () => { expect(dealsCanonical({loja:'kabum',categoria:'casa'})).toBe('https://compareecompre.com/ofertas'); expect(dealsCanonical({loja:'kabum',pagina:2})).toBe('https://compareecompre.com/ofertas?pagina=2'); });
  it('pagina 24 produtos sem repetir a primeira página',()=>{const rows=Array.from({length:50},(_,i)=>hit({objectID:String(i),title:`Produto ${i}`}));const first=catalogResult(rows,{pagina:1},true),second=catalogResult(rows,{pagina:2},true);expect(first.offers).toHaveLength(24);expect(second.offers).toHaveLength(24);expect(second.offers.some(o=>first.offers.some(a=>a.id===o.id))).toBe(false);expect(first.paging.total).toBe(50);});
  it('resolve loja e marca por slug sem acentos',()=>{const result=catalogResult([hit({store:'Kabum BR',brand:'São José'})],{loja:'kabum',marca:'sao-jose'},true);expect(result.offers).toHaveLength(1);expect(catalogResult([hit({store:'Nike BR'})],{loja:'kabum'},true).offers).toHaveLength(0);});
});