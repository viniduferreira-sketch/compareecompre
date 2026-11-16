import { describe, expect, it } from 'vitest';
import { awinDiscardReason, normalizeAwinProduct } from './awin-catalog';
import { addCurrencyDiagnostic, mergeCurrencyDiagnostics, type CurrencyDiagnostics } from './awin-currency';
import { mergeDiscardReasons } from './import-discards';

const row = { aw_product_id: '1', merchant_id: '2', merchant_name: 'LG BR', product_name: 'Monitor LG', search_price: '1099.90', aw_deep_link: 'https://awin1.com/p', currency: 'BRL' };
describe('moeda Awin sem conversão', () => {
  it.each(['BRL', 'brl', ' BrL ', '\tbrl\n'])('aceita %j mantendo preço 1099.90', currency => {
    expect(awinDiscardReason({ ...row, currency })).toBeNull();
    expect(normalizeAwinProduct({ ...row, currency }, '2026-11-14T00:00:00Z')?.price).toBe(1099.90);
  });
  it.each(['', '  ', '\t\n'])('preserva moeda vazia %j sem alterar o preço', currency => {
    expect(awinDiscardReason({ ...row, currency })).toBeNull();
    expect(normalizeAwinProduct({ ...row, currency }, '2026-11-14T00:00:00Z')?.price).toBe(1099.90);
  });
  it('preserva feeds sem coluna currency', () => {
    const { currency: _currency, ...withoutCurrency } = row;
    expect(awinDiscardReason(withoutCurrency)).toBeNull();
    expect(normalizeAwinProduct(withoutCurrency, '2026-11-14T00:00:00Z')?.price).toBe(1099.90);
  });
  it.each(['USD', 'usd', ' EUR ', 'R$', 'BRL USD'])('descarta %j sem tratar como reais', currency => {
    expect(awinDiscardReason({ ...row, currency })).toBe('unsupported_currency');
    expect(normalizeAwinProduct({ ...row, currency }, '2026-11-14T00:00:00Z')).toBeNull();
  });
  it('soma 3361 USD e mantém três exemplos e contadores separados', () => {
    const a: CurrencyDiagnostics = { counts: {}, examples: [] };
    const b: CurrencyDiagnostics = { counts: {}, examples: [] };
    for (let i=0;i<3361;i++) addCurrencyDiagnostic(i<100?a:b, { ...row, currency: 'USD' });
    const batches = [{ unsupported_currency:100,currency_diagnostics:a }, { unsupported_currency:3261,currency_diagnostics:b }];
    expect(mergeCurrencyDiagnostics(batches)).toEqual({counts:{USD:3361},examples:Array.from({length:3},()=>({title:'Monitor LG',price:'1099.90',currency:'USD'}))});
    expect(mergeDiscardReasons(batches)).toEqual({unsupported_currency:3361});
  });
  it('registra vazio sem inventar dados históricos', () => {
    const a: CurrencyDiagnostics = { counts: {}, examples: [] };
    addCurrencyDiagnostic(a, {...row,currency:''});
    expect(a.counts).toEqual({vazio:1});
    expect(a.examples[0]?.currency).toBe('');
    expect(mergeCurrencyDiagnostics([{unsupported_currency:3361},null])).toBeNull();
  });
});