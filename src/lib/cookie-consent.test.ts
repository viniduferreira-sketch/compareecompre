import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONSENT_KEY, createConsent, hasConsent, loadConsent, saveConsent, validConsent } from './cookie-consent';
import { allowedAnalyticsLocation, safeAnalyticsText } from './analytics';
beforeEach(() => { vi.stubGlobal('window', { dispatchEvent: vi.fn() }); });

afterEach(() => { vi.stubGlobal('localStorage', { getItem: () => null }); loadConsent(); vi.unstubAllGlobals(); });
describe('consent rules', () => {
  it('expires exactly twelve calendar months after the choice', () => {
    const choice = createConsent(true, false, new Date('2026-11-11T06:49:00Z'));
    expect(choice.expiresAt).toBe(Date.parse('2027-11-11T06:49:00Z'));
    expect(validConsent(choice, choice.expiresAt)).toBe(false);
  });
  it('denies optional categories before any choice', () => {
    vi.stubGlobal('localStorage', { getItem: () => null }); loadConsent();
    expect(hasConsent('analytics')).toBe(false); expect(hasConsent('ads')).toBe(false);
  });
  it('retains rejection and statistics-only choices independently', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } });
    saveConsent(false, false); loadConsent(); expect(hasConsent('analytics')).toBe(false); expect(hasConsent('ads')).toBe(false);
    saveConsent(true, false); loadConsent(); expect(hasConsent('analytics')).toBe(true); expect(hasConsent('ads')).toBe(false);
    expect(values.get(CONSENT_KEY)).toContain('"version":1'); expect(CONSENT_KEY).toBe('cec-cookie-consent');
  });
  it('handles blocked storage without crashing or silently granting on next visit', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } });
    expect(() => saveConsent(true, true)).not.toThrow(); expect(hasConsent('analytics')).toBe(true);
    // A blocked store preserves the current tab's answer, not a future visitor's answer.
    loadConsent(); expect(hasConsent('analytics')).toBe(true);
  });
  it('rejects expired, malformed and old-version decisions', () => {
    expect(validConsent({ ...createConsent(true, true), expiresAt: 0 })).toBe(false);
    expect(validConsent({ ...createConsent(true, true), analytics: 'true' })).toBe(false);
    expect(validConsent({ ...createConsent(true, true), version: 0 })).toBe(false);
  });
  it('Global Privacy Control overrides acceptance for both purposes', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } });
    vi.stubGlobal('navigator', { globalPrivacyControl: true });
    saveConsent(true, true);
    expect(hasConsent('analytics')).toBe(false);
    expect(hasConsent('ads')).toBe(false);
  });
  it('allows only both production hosts and refuses admin routes and admin users', () => {
    expect(allowedAnalyticsLocation('compareecompre.com', '/blog/guia', true)).toBe(true);
    expect(allowedAnalyticsLocation('www.compareecompre.com', '/', true)).toBe(true);
    expect(allowedAnalyticsLocation('compareecompre.lovable.app', '/', true)).toBe(false);
    expect(allowedAnalyticsLocation('localhost', '/', true)).toBe(false);
    expect(allowedAnalyticsLocation('compareecompre.com', '/admin/vitrines', true)).toBe(false);
    expect(allowedAnalyticsLocation('compareecompre.com', '/', false)).toBe(false);
  });
  it('drops emails, phone numbers and URLs from search events', () => {
    expect(safeAnalyticsText('ssd')).toBe('ssd');
    expect(safeAnalyticsText('meu@email.com')).toBe(''); expect(safeAnalyticsText('11999998888')).toBe(''); expect(safeAnalyticsText('https://example.com')).toBe('');
  });
});