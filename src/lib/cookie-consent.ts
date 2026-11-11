export const CONSENT_KEY = 'cec-cookie-consent';
export const CONSENT_VERSION = 1;
export type ConsentCategory = 'analytics' | 'ads';
export type CookieConsent = { version: number; analytics: boolean; ads: boolean; expiresAt: number };
let current: CookieConsent | null = null;
const listeners = new Set<() => void>();

export function validConsent(value: unknown, now = Date.now()): value is CookieConsent {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<CookieConsent>;
  return row.version === CONSENT_VERSION && typeof row.analytics === 'boolean' && typeof row.ads === 'boolean' && typeof row.expiresAt === 'number' && Number.isFinite(row.expiresAt) && row.expiresAt > now;
}
export function createConsent(analytics: boolean, ads: boolean, now = new Date()): CookieConsent {
  const expiry = new Date(now); expiry.setMonth(expiry.getMonth() + 12);
  return { version: CONSENT_VERSION, analytics, ads, expiresAt: expiry.getTime() };
}
export function loadConsent() {
  try { const value: unknown = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'); current = validConsent(value) ? value : null; } catch { current = null; }
  listeners.forEach(fn => fn());
  return current;
}
export function getConsent() { return current && validConsent(current) ? current : null; }
export function hasConsent(category: ConsentCategory) { return getConsent()?.[category] === true; }
export function saveConsent(analytics: boolean, ads: boolean) {
  current = createConsent(analytics, ads);
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(current)); } catch { /* Choice remains valid for this visit when storage is blocked. */ }
  listeners.forEach(fn => fn());
}
export function subscribeConsent(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
export function openCookiePreferences() { window.dispatchEvent(new Event('cec-cookie-preferences')); }