export const PRICE_FRESHNESS_MS = 24 * 60 * 60 * 1000;

/** Unix seconds threshold for Algolia numericFilters on lastSyncedAtTs. */
export function freshnessThresholdSeconds(now = Date.now()): number {
  return Math.floor((now - PRICE_FRESHNESS_MS) / 1000);
}

export function freshnessNumericFilter(now = Date.now()): string {
  return `lastSyncedAtTs >= ${freshnessThresholdSeconds(now)}`;
}

export function isPriceFresh(lastSyncedAt: string | null | undefined, now = Date.now()): boolean {
  if (!lastSyncedAt) return false;
  const time = Date.parse(lastSyncedAt);
  if (!Number.isFinite(time)) return false;
  return now - time <= PRICE_FRESHNESS_MS;
}

/** "Preço atualizado em DD/MM às HH:mm" in Brasília time. */
export function formatSyncedAt(lastSyncedAt: string | null | undefined): string | null {
  if (!lastSyncedAt) return null;
  const date = new Date(lastSyncedAt);
  if (Number.isNaN(date.getTime())) return null;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `Preço atualizado em ${parts["day"]}/${parts["month"]} às ${parts["hour"]}:${parts["minute"]}`;
}
