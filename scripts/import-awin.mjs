import { openFeed, parseCsv } from './awin-feed-reader.mjs';
import { processFeedSequence } from './awin-feed-sequence.mjs';
import { awinImages } from './awin-images.mjs';

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
  const feeds = started.feeds ?? [{id:null,url:started.feedUrl}];
  const { failures } = await processFeedSequence(feeds, {
    read: async (url, count) => {
      const all = [];
      for await (const row of parseCsv(await openFeed(url))) { count(); all.push(row); }
      const gtin = v => /^\d{8,14}$/.test(String(v ?? '').replace(/\D/g,'')) && /[1-9]/.test(String(v ?? ''));
      const off = v => ['0','false','no','n','out of stock','out_of_stock','unavailable'].includes(String(v ?? '').trim().toLowerCase());
      const score = r => (gtin(r.ean)||gtin(r.product_GTIN)?4:0)+(!off(r.in_stock)&&!off(r.stock_status)?2:0)+(awinImages(r).length?1:0);
      return all.map((row,i)=>({row,i,s:score(row)})).sort((a,b)=>b.s-a.s||a.i-b.i).map(x=>x.row);
    },
    batch: (batch,rows) => send({action:'batch',importId,batch,rows}),
    record: (feedId,linhas,success) => send({action:'feedResult',importId,feedId,linhas,success}),
  });
  const result = await send({ action: 'finish', importId, success: failures === 0 });
  if (!result.success) throw new Error('Import produced no valid records.');
  console.info(`Import complete: ${result.indexed} records processed.`);
} catch {
  if (importId) await send({ action: 'finish', importId, success: false }).catch(() => {});
  // fetch exceptions may contain the private feed URL. Never print the raw exception.
  console.error('Awin import failed. Check download access, CSV format and the import status.');
  process.exitCode = 1;
}