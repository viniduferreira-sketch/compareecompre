import { openFeed, parseCsv, validateFeedUrl, maskFeedUrl, FEED_TEST_MAX_ROWS, FEED_TEST_TIMEOUT_MS } from '../../scripts/awin-feed-reader.mjs';
export { validateFeedUrl, maskFeedUrl };
export const REQUIRED_FEED_COLUMNS = ['merchant_id', 'merchant_name', 'product_name', 'search_price', 'aw_deep_link'];
export async function inspectFeed(url: string) {
  const merchants = new Map<string,string>();
  const examples: { title: string; merchant: string; price: string; category: string }[] = [];
  let columns: string[] = []; let rows = 0;
  const started = Date.now();
  const diagnostics = {httpStatus:null as number|null,bytesRead:0,downloadedBytes:0,gzip:false,truncated:false};
  const parsed = new URL(url);
  const keys = [/\/apikey\/([^/]+)/i.exec(parsed.pathname)?.[1], ...parsed.searchParams.values()].filter((key): key is string => Boolean(key));
  const scrub = (value: string) => {
    let safe = value.split(url).join('[link protegido]');
    for (const key of keys) safe = safe.split(key).join('[chave protegida]');
    return safe.replace(/https?:\/\/\S+/gi, '[link protegido]').slice(0,200);
  };
  let error: string | null = null;
  try {
    const stream = await openFeed(url, { limited: true, diagnostics });
    for await (const row of parseCsv(stream, {partial:true,onHeader:header=>{columns=header;}})) {
      rows++;
      const name = (row['merchant_name'] ?? '').trim(); const id = (row['merchant_id'] ?? '').trim();
      if (name && id && /^[\w.-]{1,40}$/.test(id)) merchants.set(id, scrub(name));
      if (examples.length < 3) examples.push({title:scrub(row['product_name'] ?? ''),merchant:scrub(name),price:scrub(row['search_price'] ?? ''),category:scrub(row['merchant_category'] ?? '')});
      if (rows >= FEED_TEST_MAX_ROWS) break;
    }
  } catch (cause) {
    error = cause instanceof Error && (cause.name === 'TimeoutError' || cause.name === 'AbortError')
      ? `Tempo limite de ${FEED_TEST_TIMEOUT_MS / 1000} segundos excedido.`
      : scrub(cause instanceof Error ? `${cause.name}: ${cause.message}` : 'Falha desconhecida na leitura do feed.');
  }
  const required = [...REQUIRED_FEED_COLUMNS, ...(columns.includes('aw_product_id') ? ['aw_product_id'] : ['merchant_product_id'])];
  const missing = required.filter(c => !columns.includes(c));
  return { merchants: [...merchants].map(([id,name]) => ({id,name})), examples, present: required.filter(c => columns.includes(c)), missing, rows, valid: !error && rows > 0 && !missing.length && merchants.size > 0, error, diagnostics:{...diagnostics,elapsedMs:Date.now()-started,timeoutMs:FEED_TEST_TIMEOUT_MS,header:columns.map(scrub)} };
}
export async function readImportFeeds(secret: string | undefined) {
  const { supabaseAdmin: db } = await import('@/integrations/supabase/client.server');
  const result = await db.from('awin_feeds').select('id,nome,url,ativo').order('created_at');
  if (result.error) throw new Error('Não foi possível ler os feeds cadastrados.');
  if (!result.data?.length) {
    if (!secret) throw new Error('Feed Awin não configurado.');
    return [{id:null,nome:'Feed atual',url:validateFeedUrl(secret)}];
  }
  return result.data.filter(f => f.ativo).map(f => ({id:f.id,nome:f.nome,url:validateFeedUrl(f.url)}));
}
