/** Missing partner copy must stay missing, never replaced with promotional templates. */
export function partnerDescription(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}