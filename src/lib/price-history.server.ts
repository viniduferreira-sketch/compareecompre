import { blogPublicClient } from './blog-public.server';

export async function readRealPriceHistory(id?: string) {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Histórico de preços indisponível.');
  const db = blogPublicClient(url, key);
  const result = new Map<string, Array<{ date: string; price: number; store: string }>>();
  for (let offset = 0; ; offset += 1000) {
    let query = db.from('product_price_history').select('object_id,observed_at,price,store').order('id').range(offset, offset + 999);
    if (id) query = query.eq('object_id', id);
    const { data, error } = await query;
    if (error) throw new Error('Não foi possível ler o histórico real de preços.');
    for (const row of data ?? []) {
      const points = result.get(row.object_id) ?? [];
      points.push({ date: row.observed_at, price: Number(row.price), store: row.store });
      result.set(row.object_id, points);
    }
    if ((data?.length ?? 0) < 1000) break;
  }
  return result;
}

/** Invoked only after verified ML synchronization, never on page views or simulations. */
export async function recordMercadoLivrePrices(records: Array<Record<string, unknown>>) {
  const { persistMercadoLivreComparison } = await import('./product-comparison.server');
  await persistMercadoLivreComparison(records);
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  for (let i = 0; i < records.length; i += 10) {
    await Promise.all(records.slice(i, i + 10).map(async record => {
      if (record['status'] === 'unavailable' || typeof record['price'] !== 'number' || record['price'] <= 0) return;
      const { error } = await db.rpc('record_real_product_price', {
        _object_id: String(record['objectID']), _source: 'mercadolivre',
        _store: typeof record['store'] === 'string' ? record['store'] : 'Mercado Livre', _price: record['price'],
      });
      if (error) throw new Error('Não foi possível registrar o preço real do Mercado Livre.');
    }));
  }
}