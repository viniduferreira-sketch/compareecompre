// Shared Web-stream CSV reader for the Worker and GitHub workflow.
export const FEED_TEST_MAX_BYTES = 300 * 1024;
export const FEED_TEST_MAX_ROWS = 200;
export const FEED_TEST_TIMEOUT_MS = 20000;
export function validateFeedUrl(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.hostname !== 'productdata.awin.com' || u.username || u.password || u.port || u.hash) throw new Error();
    return u.href;
  } catch { throw new Error('Use uma URL HTTPS do domínio productdata.awin.com.'); }
}
export function maskFeedUrl(value) {
  const u = new URL(validateFeedUrl(value));
  const key = /\/apikey\/([^/]+)/i.exec(u.pathname)?.[1] ?? u.searchParams.get('apikey') ?? u.searchParams.get('api_key') ?? u.searchParams.get('key') ?? '';
  return `https://productdata.awin.com/… (chave ••••${key.slice(-4)})`;
}
export async function* parseCsv(stream) {
  const reader = stream.getReader();
  let header = null, field = '', record = [], quoted = false, pendingQuote = false;
  const emit = () => {
    record.push(field); field = '';
    const values = record; record = [];
    if (!header) { header = values.map((h,i) => i === 0 ? h.replace(/^\uFEFF/, '') : h); return null; }
    if (values.length === 1 && values[0] === '') return null;
    return Object.fromEntries(header.map((h,i) => [h,values[i] ?? '']));
  };
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      for (const ch of value) {
        if (pendingQuote) { pendingQuote = false; if (ch === '"') { field += '"'; continue; } quoted = false; }
        if (quoted) { if (ch === '"') pendingQuote = true; else field += ch; continue; }
        if (ch === '"') quoted = true;
        else if (ch === ',') { record.push(field); field = ''; }
        else if (ch === '\n') { const row = emit(); if (row) yield row; }
        else if (ch !== '\r') field += ch;
      }
    }
    if (field || record.length) { const row = emit(); if (row) yield row; }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
function bounded(stream, limit) {
  const reader = stream.getReader(); let used = 0;
  return new ReadableStream({
    async pull(controller) {
      if (used >= limit) { await reader.cancel().catch(() => {}); controller.close(); return; }
      const {value, done} = await reader.read();
      if (done) { controller.close(); return; }
      const remaining = limit - used; used += Math.min(value.byteLength, remaining);
      controller.enqueue(value.subarray(0,remaining));
    }, cancel() { return reader.cancel().catch(() => {}); }
  });
}
export async function openFeed(url, { limited = false } = {}) {
  const safeUrl = validateFeedUrl(url);
  const response = await fetch(safeUrl, { redirect: 'error', signal: AbortSignal.timeout(limited ? FEED_TEST_TIMEOUT_MS : 120000) });
  if (!response.ok || !response.body) throw new Error('Não foi possível baixar o feed Awin.');
  const reader = response.body.getReader(); const first = await reader.read();
  if (first.done || !first.value) throw new Error('Feed Awin vazio.');
  let initial = first.value;
  const raw = new ReadableStream({
    async pull(controller) {
      if (initial) { controller.enqueue(initial); initial = null; return; }
      const {value,done} = await reader.read(); if (done) controller.close(); else controller.enqueue(value);
    }, cancel() { return reader.cancel().catch(() => {}); }
  });
  const gzip = first.value[0] === 0x1f && first.value[1] === 0x8b;
  const source = limited ? bounded(raw, FEED_TEST_MAX_BYTES) : raw;
  const decoded = gzip ? source.pipeThrough(new DecompressionStream('gzip')) : source;
  return (limited ? bounded(decoded, FEED_TEST_MAX_BYTES) : decoded).pipeThrough(new TextDecoderStream());
}
