import { Readable } from 'node:stream';
import { createGunzip } from 'node:zlib';
import { parse } from 'csv-parse';

const endpoint = process.env.AWIN_IMPORT_ENDPOINT;
if (!endpoint || new URL(endpoint).protocol !== 'https:') throw new Error('Configure AWIN_IMPORT_ENDPOINT with the published import endpoint.');
const id = process.env.AWIN_IMPORT_ID || undefined;
const audience = 'compareecompre-awin-import';
let auth;
async function token() {
  if (auth && auth.expires > Date.now()) return auth.value;
  const response = await fetch(`${process.env.ACTIONS_ID_TOKEN_REQUEST_URL}&audience=${audience}`, {
    headers: { Authorization: `Bearer ${process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` },
  });
  if (!response.ok) throw new Error('GitHub identity could not be verified.');
  auth = { value: (await response.json()).value, expires: Date.now() + 180000 };
  return auth.value;
}
async function send(body) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(120000) });
    if (response.ok) return response.json();
    if (response.status < 500 || attempt === 2) throw new Error(`Import step failed (HTTP ${response.status}).`);
    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
  }
}
let importId;
try {
  const started = await send({ action: 'start', ...(id ? { importId: id } : {}) });
  importId = started.importId;
  // Feed URL is intentionally returned only to this OIDC-verified workflow and never printed.
  const response = await fetch(started.feedUrl);
  if (!response.ok || !response.body) throw new Error(`Awin download failed (HTTP ${response.status}).`);
  const source = Readable.fromWeb(response.body);
  const iterator = source[Symbol.asyncIterator]();
  const first = await iterator.next();
  if (first.done) throw new Error('Awin feed is empty.');
  const combined = Readable.from((async function* () { yield first.value; for await (const chunk of { [Symbol.asyncIterator]: () => iterator }) yield chunk; })());
  const gzip = first.value[0] === 0x1f && first.value[1] === 0x8b;
  const decoded = gzip ? combined.pipe(createGunzip()) : combined;
  const csv = decoded.pipe(parse({ columns: true, bom: true, skip_empty_lines: true, max_record_size: 1000000 }));
  combined.on('error', () => csv.destroy(new Error('Feed stream interrupted.')));
  if (decoded !== combined) decoded.on('error', () => csv.destroy(new Error('Invalid compressed feed.')));
  let rows = [], batch = 0, read = 0;
  for await (const row of csv) {
    rows.push(row); read++;
    if (rows.length === 100) {
      await send({ action: 'batch', importId, batch: batch++, rows }); rows = [];
      console.info(`Processed ${read} rows.`);
    }
  }
  if (rows.length) await send({ action: 'batch', importId, batch: batch++, rows });
  const result = await send({ action: 'finish', importId, success: true });
  if (!result.success) throw new Error('Import produced no valid records.');
  console.info(`Import complete: ${result.indexed} records processed.`);
} catch {
  if (importId) await send({ action: 'finish', importId, success: false }).catch(() => {});
  // fetch exceptions may contain the private feed URL. Never print the raw exception.
  console.error('Awin import failed. Check download access, CSV format and the import status.');
  process.exitCode = 1;
}