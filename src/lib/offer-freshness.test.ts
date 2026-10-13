import { test } from 'node:test';
import assert from 'node:assert/strict';
const expect = (actual: unknown) => ({ toBe: (expected: unknown) => assert.equal(actual, expected), toEqual: (expected: unknown) => assert.deepEqual(actual, expected) });
import { MAX_PRICE_AGE_MS, SYNC_CRON_UTC, isFreshPrice, freshnessNumericFilters, validMeliItem, removalIds, fetchMeliWithRetry } from './offer-freshness';
const now = Date.parse('2026-10-13T03:00:00Z');
test('six hour cron is midnight, 6, 12 and 18 Brasília', () => expect(SYNC_CRON_UTC).toBe('0 3,9,15,21 * * *'));
test('prices expire strictly after 24 hours; missing stamps are hidden', () => {
 expect(MAX_PRICE_AGE_MS).toBe(86400000);
 expect(isFreshPrice(new Date(now - 86400000).toISOString(), now)).toBe(true);
 expect(isFreshPrice(new Date(now - 86400001).toISOString(), now)).toBe(false);
 expect(isFreshPrice(undefined, now)).toBe(false);
 expect(freshnessNumericFilters(now)).toEqual([`last_synced_at_timestamp>=${now-86400000}`, `last_synced_at_timestamp<=${now}`]);
});
const item = {status:'active',available_quantity:1,permalink:'https://www.mercadolivre.com.br/p/MLB123',price:100};
test('inactive items cannot be indexed',()=>expect(validMeliItem({...item,status:'paused'})).toBe(false));
test('zero stock cannot be indexed',()=>expect(validMeliItem({...item,available_quantity:0})).toBe(false));
test('invalid permalink cannot be indexed',()=>{expect(validMeliItem({...item,permalink:'https://evil.com'})).toBe(false);expect(validMeliItem(item)).toBe(true)});
const old = [{objectID:'old',source:'mercadolivre',categoryName:'Casa'},{objectID:'fresh',source:'mercadolivre',categoryName:'Casa'},{objectID:'other',source:'awin',categoryName:'Casa'},{objectID:'electronics',source:'mercadolivre',categoryName:'Eletrônicos'}];
test('delete only absent records of successful category and matching source',()=>expect(removalIds(old,new Set(['fresh']),'Casa',true)).toEqual(['old']));
test('failed or unexpectedly empty category never deletes',()=>expect(removalIds(old,new Set(),'Casa',false)).toEqual([]));
test('429 has max three retries with growing waits', async()=>{
 let calls=0; const waits:number[]=[];
 const response=await fetchMeliWithRetry('https://example.com',undefined,async()=>{calls++;return new Response('',{status:429})},async ms=>{waits.push(ms)});
 expect(response.status).toBe(429); expect(calls).toBe(4); expect(waits).toEqual([1000,2000,4000]);
});
test('5xx has exactly one retry',async()=>{let calls=0;await fetchMeliWithRetry('https://example.com',undefined,async()=>{calls++;return new Response('',{status:503})},async()=>{});expect(calls).toBe(2)});
