export const ADMIN_HISTORY_LIMIT = 10;
export const ADMIN_HISTORY_SOURCES = ["awin", "lomadee", "mercadolivre"] as const;
export function recentImportsPerSource<T extends { source: string; created_at: string }>(rows: T[]): T[] {
  const counts = new Map<string, number>();
  return [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at)).filter((row) => {
    const count = counts.get(row.source) ?? 0;
    if (count >= ADMIN_HISTORY_LIMIT) return false;
    counts.set(row.source, count + 1);
    return true;
  });
}
