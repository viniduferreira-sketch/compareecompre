import { describe, expect, it } from 'vitest';
import { buyingTopic, selectTechnicalSimilars, technicalAttributes, type TechnicalHit } from './product-buying';
const current: TechnicalHit = { objectID: 'base', title: 'SSD Kingston NV2', price: 500, brand: 'Kingston', model: 'NV2', gtin: '12345678', categoryName: 'Eletrônicos', source: 'awin', attributes: [{ name: 'Capacidade', value: '1 TB' }] };
const candidate = (id: string, extra: Partial<TechnicalHit> = {}): TechnicalHit => ({ ...current, objectID: id, model: id, gtin: '87654321', title: `SSD Kingston ${id}`, ...extra });
describe('guias e similares', () => {
  it.each([['SSD Kingston', 'ssd'], ['Tablet Samsung', 'tablet'], ['Roteador Wi-Fi TP-Link', 'roteador-wifi'], ['Ventilador Mondial', 'ventilador']])('encontra guia para %s', (title, slug) => expect(buyingTopic(title)?.[0]).toBe(slug));
  it('não recomenda guia de produto para acessórios', () => expect(buyingTopic('Capa para tablet')).toBeNull());
  it('não confunde computador contendo SSD com SSD avulso', () => expect(buyingTopic('Pc Gamer Ryzen com SSD 1TB')).toBeNull());
  it('compara somente modelos diferentes, nunca outra loja ou variante do mesmo modelo', () => {
    expect(selectTechnicalSimilars(current, [candidate('same', { model: 'NV2', gtin: '22222222' }), candidate('a'), candidate('b')]).map(p => p.objectID)).toEqual(['a', 'b']);
  });
  it('exclui GTIN idêntico mesmo se modelo divergente', () => expect(selectTechnicalSimilars(current, [candidate('a', { gtin: '12345678' }), candidate('b')])).toEqual([]));
  it('exige mesma família e faixa 70–130%, sem ampliar', () => expect(selectTechnicalSimilars(current, [candidate('a', { price: 349 }), candidate('b', { price: 651 }), candidate('c', { title: 'Tablet Samsung' })])).toEqual([]));
  it('aceita limites exatos da faixa de preço', () => expect(selectTechnicalSimilars(current, [candidate('a', { price: 350 }), candidate('b', { price: 650 })])).toHaveLength(2));
  it('esconde com menos de dois similares, sem ficha ou modelo incerto', () => {
    expect(selectTechnicalSimilars(current, [candidate('a')])).toEqual([]);
    expect(selectTechnicalSimilars(current, [candidate('a', { attributes: [] }), candidate('b', { model: null })])).toEqual([]);
  });
  it('limita a três modelos e deduplica outras lojas', () => expect(selectTechnicalSimilars(current, [candidate('a'), candidate('a'), candidate('b'), candidate('c'), candidate('d')])).toHaveLength(3));
  it('oculta indisponíveis e outra categoria', () => expect(selectTechnicalSimilars(current, [candidate('a', { status: 'unavailable' }), candidate('b', { categoryName: 'Casa' })])).toEqual([]));
  it('mantém fonte e não inventa característica ausente', () => expect(technicalAttributes({ ...current, attributes: [{ name: 'Capacidade', value: '1 TB' }, { name: 'Velocidade', value: '' }] })).toEqual([{ name: 'Capacidade', value: '1 TB', source: 'awin' }]));
});