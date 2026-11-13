import { createClient } from '@supabase/supabase-js';
import { expect, it } from 'vitest';
import type { Database } from '@/integrations/supabase/types';

it.skipIf(!process.env['SUPABASE_SERVICE_ROLE_KEY'])('persists first price and changes only, isolates stores and prevents duplicate retries', async () => {
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  const url = process.env['SUPABASE_URL'];
  if (!key || !url) throw new Error('Test credentials missing');
  const db = createClient<Database>(url, key, { auth: { persistSession: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers);
    if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    headers.set('apikey', key); return fetch(input, { ...init, headers });
  } } });
  const id = `price-history-test-${crypto.randomUUID()}`;
  const record = (price: number, store = 'Test store') => db.rpc('record_real_product_price', {
    _object_id: id, _source: 'test', _store: store, _price: price,
  });
  try {
    expect((await record(100)).data).toBe(true);
    const retries = await Promise.all([record(100), record(100)]);
    expect(retries.map(r => r.data)).toEqual([false, false]);
    expect((await record(80)).data).toBe(true);
    expect((await record(100)).data).toBe(true);
    expect((await record(100, 'Other test store')).data).toBe(true);
    const rows = await db.from('product_price_history').select('price,store,observed_at').eq('object_id', id).order('id');
    expect(rows.error).toBeNull();
    expect(rows.data?.map(r => Number(r.price))).toEqual([100,80,100,100]);
    expect(rows.data?.every(r => Number.isFinite(Date.parse(r.observed_at)))).toBe(true);
    expect(rows.data?.[3]?.store).toBe('Other test store');
  } finally {
    const cleanup = await db.from('product_price_history').delete().eq('object_id', id).eq('source', 'test');
    if (cleanup.error) throw cleanup.error;
  }
});