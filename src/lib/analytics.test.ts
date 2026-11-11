import { afterEach, expect, it, vi } from 'vitest';
import { loadConsent, saveConsent } from './cookie-consent';
import { deleteAnalyticsCookies, syncAnalyticsAudience, trackEvent, trackOutbound, trackPageView } from './analytics';

afterEach(() => { syncAnalyticsAudience(false); vi.unstubAllGlobals(); });
it('sends no Google script until consent, records one page per navigation, gates events and stops on withdrawal', () => {
  let storage: string | null = null;
  vi.stubGlobal('localStorage', { getItem: () => storage, setItem: (_: string, v: string) => { storage = v; } });
  const appendChild = vi.fn(); const remove = vi.fn();
  const win = { location: { hostname: 'compareecompre.com', pathname: '/', search: '', origin: 'https://compareecompre.com' }, dataLayer: [] as unknown[] };
  const doc = { cookie: '', title: 'Ofertas | Compare e Compre', createElement: () => ({ remove }), head: { appendChild } };
  vi.stubGlobal('window', win); vi.stubGlobal('document', doc);
  loadConsent(); syncAnalyticsAudience(true); trackPageView('/'); expect(appendChild).not.toHaveBeenCalled();
  saveConsent(true, false); syncAnalyticsAudience(true); expect(appendChild).toHaveBeenCalledTimes(1);
  trackPageView('/'); trackPageView('/');
  const events = () => win.dataLayer.map(v => Array.from(v as ArrayLike<unknown>));
  expect(events().filter(v => v[0] === 'event' && v[1] === 'page_view')).toHaveLength(1);
  expect(events().find(v => v[0] === 'consent' && v[1] === 'default')?.[2]).toEqual({ analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  expect(events().find(v => v[0] === 'consent' && v[1] === 'update')?.[2]).toEqual({ analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  win.location.pathname = '/produto/awin:123'; doc.title = 'Notebook | Compare e Compre'; trackPageView('/produto/awin:123');
  expect(events().filter(v => v[1] === 'page_view')).toHaveLength(2);
  trackOutbound({ id: 'awin:123', store: 'KaBuM', category: 'Eletrônicos', title: 'Notebook', price: 2500 }, 'best_offer');
  expect(events().find(v => v[1] === 'outbound_click')?.[2]).toMatchObject({ loja: 'KaBuM', categoria: 'Eletrônicos', nome_produto: 'Notebook', value: 2500, currency: 'BRL', origem: 'oferta_pagina_produto' });
  const length = win.dataLayer.length;
  win.location.pathname = '/admin'; trackEvent('search', { search_term: 'ssd' }); expect(win.dataLayer).toHaveLength(length);
  win.location.pathname = '/'; saveConsent(false, false); syncAnalyticsAudience(true); expect(remove).toHaveBeenCalled();
  const revoked = win.dataLayer.length; trackEvent('search', { search_term: 'ssd' }); expect(win.dataLayer).toHaveLength(revoked);
});
it('expires every _ga cookie without touching essential cookies', () => {
  const writes: string[] = [];
  vi.stubGlobal('window', { location: { hostname: 'compareecompre.com' } });
  const doc = {};
  Object.defineProperty(doc, 'cookie', { get: () => '_ga=abc; _ga_5NB87FJ8PV=xyz; essential=keep', set: (v: string) => { writes.push(v); } });
  vi.stubGlobal('document', doc); deleteAnalyticsCookies();
  expect(writes.some(v => v.startsWith('_ga=; Max-Age=0'))).toBe(true);
  expect(writes.some(v => v.startsWith('_ga_5NB87FJ8PV=; Max-Age=0'))).toBe(true);
  expect(writes.some(v => v.startsWith('essential='))).toBe(false);
});