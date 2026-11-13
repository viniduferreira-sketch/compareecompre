import { normalizeAwinMerchantName } from './awin-allowlist';

export type AwinSyncScope = { feedId: string; merchants: string[] };

/** A malformed persisted scope must never silently turn a one-feed job into all feeds. */
export function awinSyncScope(cursor: unknown): AwinSyncScope | null {
  if (cursor == null) return null;
  if (typeof cursor !== 'object' || Array.isArray(cursor) || !('feedId' in cursor)
    || typeof cursor.feedId !== 'string' || !('merchants' in cursor)
    || !Array.isArray(cursor.merchants) || !cursor.merchants.length
    || !cursor.merchants.every((m): m is string => typeof m === 'string' && Boolean(normalizeAwinMerchantName(m)))) {
    throw new Error('Escopo da sincronização inválido. Nenhum feed foi lido.');
  }
  return { feedId: cursor.feedId, merchants: cursor.merchants };
}

export function assertAwinFeedRows(scope: AwinSyncScope | null, rows: Array<{ merchant_name?: string }>) {
  if (!scope) return;
  const allowed = new Set(scope.merchants.map(normalizeAwinMerchantName));
  if (rows.some(row => !allowed.has(normalizeAwinMerchantName(row.merchant_name ?? '')))) {
    throw new Error('O feed contém uma loja fora da seleção confirmada. Lote não importado; teste o feed novamente.');
  }
}

export function awinFeedOutcome(result: { status: string; erro: string | null; linhas: number } | null, job: { status: string; error: string | null } | null) {
  // A failure in another feed must not turn this feed's recorded completion into a failure.
  return result ? { status: result.status, error: result.erro, lines: result.linhas } : job ? { status: job.status, error: job.error, lines: null } : null;
}