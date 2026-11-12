// Shared Web-stream CSV reader for the Worker and GitHub workflow.
export const FEED_TEST_MAX_BYTES = 300 * 1024;
export const FEED_TEST_MAX_ROWS = 200;
export const FEED_TEST_TIMEOUT_MS = 60000;
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
export async function* parseCsv(stream, { partial = false, onHeader } = {}) {
  const reader = stream.getReader();
  let header = null, field = '', record = [], quoted = false, pendingQuote = false;
  const emit = () => {
    record.push(field); field = '';
    const values = record; record = [];
    if (!header) { header = values.map((h,i) => i === 0 ? h.replace(/^\uFEFF/, '') : h); onHeader?.(header); return null; }
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
    if (!partial && (field || record.length)) { const row = emit(); if (row) yield row; }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
function bounded(stream, limit, diagnostics) {
  const reader = stream.getReader(); let used = 0;
  return new ReadableStream({
    async pull(controller) {
      if (used >= limit) { controller.close(); void reader.cancel().catch(() => {}); return; }
      const {value, done} = await reader.read();
      if (done) { controller.close(); return; }
      const remaining = limit - used; used += Math.min(value.byteLength, remaining);
      if (diagnostics) { diagnostics.bytesRead = used; diagnostics.truncated = used >= limit; }
      controller.enqueue(value.subarray(0,remaining));
    }, cancel() { void reader.cancel().catch(() => {}); }
  });
}
export async function openFeed(url, { limited = false, diagnostics } = {}) {
  const safeUrl = validateFeedUrl(url);
  const response = await fetch(safeUrl, { redirect: 'error', signal: AbortSignal.timeout(limited ? FEED_TEST_TIMEOUT_MS : 120000) });
  if (diagnostics) { diagnostics.httpStatus = response.status; }
  if (!response.ok || !response.body) { void response.body?.cancel().catch(() => {}); throw new Error(`HTTP ${response.status}: ${response.body ? 'download recusado' : 'resposta sem conteúdo'}.`); }
  const reader = response.body.getReader();
  const prefix = []; let length = 0;
  // Network chunks need not contain both gzip magic bytes in the first read.
  while (length < 2) {
    const {value,done} = await reader.read();
    if (done) break;
    prefix.push(value); length += value.byteLength;
    if (diagnostics) diagnostics.downloadedBytes += value.byteLength;
  }
  if (!length) throw new Error('Feed Awin vazio.');
  let initial = new Uint8Array(length); let offset = 0;
  for (const chunk of prefix) { initial.set(chunk,offset); offset += chunk.byteLength; }
  const gzip = initial[0] === 0x1f && initial[1] === 0x8b;
  if (diagnostics) diagnostics.gzip = gzip;
  const raw = new ReadableStream({
    async pull(controller) {
      if (initial) { controller.enqueue(initial); initial = null; return; }
      const {value,done} = await reader.read(); if (done) controller.close(); else { if (diagnostics) diagnostics.downloadedBytes += value.byteLength; controller.enqueue(value); }
    }, cancel() { return reader.cancel().catch(() => {}); }
  });
  const source = raw;
  const decoded = gzip ? source.pipeThrough(new DecompressionStream('gzip')) : source;
  return (limited ? bounded(decoded, FEED_TEST_MAX_BYTES, diagnostics) : decoded).pipeThrough(new TextDecoderStream());
}
