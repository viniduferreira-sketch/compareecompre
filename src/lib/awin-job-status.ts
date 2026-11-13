export const AWIN_IDLE_TIMEOUT_MS = 60 * 60_000;
export const activeAwinJob = (status: string) => status === 'queued' || status === 'running';
export function expiredAwinJob(status: string, updatedAt: string, now = Date.now()) {
  return activeAwinJob(status) && now - Date.parse(updatedAt) > AWIN_IDLE_TIMEOUT_MS;
}
export function githubAwinConclusion(conclusion: string | null | undefined) {
  if (conclusion === 'cancelled') return 'cancelled';
  if (conclusion && conclusion !== 'success') return 'failed';
  return null;
}