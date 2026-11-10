/** Failures are isolated per feed. No credentials or raw errors leave this function. */
export async function processFeedSequence(feeds, { read, batch, record }) {
  let batchNumber = 0, failures = 0;
  for (const feed of feeds) {
    let linhas = 0;
    try {
      const rows = await read(feed.url, () => { linhas++; });
      for (let offset=0; offset<rows.length; offset+=100) {
        const current = batchNumber++;
        await batch(current, rows.slice(offset,offset+100));
      }
      if (feed.id) await record(feed.id,linhas,true);
    } catch {
      failures++;
      if (feed.id) await record(feed.id,linhas,false).catch(()=>{});
    }
  }
  return {failures,batches:batchNumber};
}
