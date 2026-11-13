import { blogPublicClient } from './blog-public.server';
import { COMPARISON_CACHE_MS, comparisonKey, groupComparedOffers, type ComparedOffer, type ComparisonRecord } from './product-comparison';

const cache = new Map<string, { expires: number; data: Promise<ComparedOffer[]> }>();
export async function readComparedOffers(key: string): Promise<ComparedOffer[]> {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.data;
  const data = (async () => {
    const url = process.env['SUPABASE_URL'], token = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !token) throw new Error('Comparação indisponível.');
    const db = blogPublicClient(url, token);
    const records: ComparisonRecord[] = [];
    for (let offset = 0; ; offset += 1000) {
      const result = await db.from('product_comparison_offers').select('record').eq('comparison_key', key).order('price').range(offset, offset + 999);
      if (result.error) throw new Error('Não foi possível comparar as ofertas.');
      records.push(...(result.data ?? []).map(row => row.record as unknown as ComparisonRecord));
      if ((result.data?.length ?? 0) < 1000) break;
    }
    const base = records.find(record => comparisonKey(record) === key);
    return base ? groupComparedOffers(base, records) : [];
  })();
  if (cache.size >= 500) { const first = cache.keys().next().value; if (first) cache.delete(first); }
  cache.set(key, { expires: Date.now() + COMPARISON_CACHE_MS, data });
  try { return await data; } catch (error) { cache.delete(key); throw error; }
}

/** Internal synchronization only; public readers cannot write comparison evidence. */
export async function persistMercadoLivreComparison(records: Array<Record<string, unknown>>) {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  for (let i = 0; i < records.length; i += 10) {
    await Promise.all(records.slice(i, i + 10).filter(record => record['source'] === 'mercadolivre').map(async record => {
      const { error } = await db.rpc('capture_comparison_offer', { _id: String(record['objectID']), _source: 'mercadolivre', _record: JSON.parse(JSON.stringify(record)) });
      if (error) throw new Error('Não foi possível guardar a comparação do Mercado Livre.');
    }));
  }
  cache.clear();
}