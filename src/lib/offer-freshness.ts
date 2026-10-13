export const MAX_PRICE_AGE_MS = 24 * 60 * 60 * 1000;
export const SYNC_CRON_UTC = '0 3,9,15,21 * * *';
export function isFreshPrice(timestamp: string | null | undefined, now = Date.now()): boolean {
  const time = timestamp ? Date.parse(timestamp) : NaN;
  return Number.isFinite(time) && time <= now && time >= now - MAX_PRICE_AGE_MS;
}
export function freshnessNumericFilters(now = Date.now()): string[] {
  return [`last_synced_at_timestamp>=${now - MAX_PRICE_AGE_MS}`, `last_synced_at_timestamp<=${now}`];
}
export function formatPriceUpdated(timestamp: string | null | undefined): string {
  if (!timestamp || !Number.isFinite(Date.parse(timestamp))) return '';
  const date = new Date(timestamp);
  const day = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' }).format(date);
  const hour = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  return `Preço atualizado em ${day} às ${hour}`;
}
export function validMeliPermalink(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'mercadolivre.com.br' || url.hostname.endsWith('.mercadolivre.com.br'));
  } catch { return false; }
}
export function validMeliItem(item: { status?: string; available_quantity?: number; permalink?: string; price?: number }): boolean {
  return item.status === 'active' && typeof item.available_quantity === 'number' && item.available_quantity > 0
    && validMeliPermalink(item.permalink) && typeof item.price === 'number' && Number.isFinite(item.price) && item.price > 0;
}
export function removalIds(previous: Array<{ objectID: string; source?: string; categoryName?: string }>, current: Set<string>, category: string, successful: boolean): string[] {
  if (!successful) return [];
  return previous.filter(item => item.source === 'mercadolivre' && item.categoryName === category && !current.has(item.objectID)).map(item => item.objectID);
}
export async function fetchMeliWithRetry(input: string, init?: RequestInit, fetcher: typeof fetch = fetch, wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))): Promise<Response> {
  let retries429 = 0;
  let retries5xx = 0;
  while (true) {
    const response = await fetcher(input, init);
    if (response.status === 429 && retries429 < 3) {
      const retryAfter = Number(response.headers.get('retry-after'));
      await wait(Math.max(1000 * 2 ** retries429, Number.isFinite(retryAfter) ? Math.min(retryAfter * 1000, 30000) : 0));
      retries429 += 1;
      continue;
    }
    if (response.status >= 500 && retries5xx < 1) {
      await wait(1000);
      retries5xx += 1;
      continue;
    }
    return response;
  }
}
