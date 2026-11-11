import { hasConsent } from './cookie-consent';

const MEASUREMENT_ID = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY'] || 'G-5NB87FJ8PV';
type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
let audienceAllowed = false;
let lastPage: string | null = null;
let script: HTMLScriptElement | null = null;
let configured = false;
const origins = new Map<string, string>();

export function allowedAnalyticsLocation(host: string, path: string, allowed: boolean) {
  return allowed && ['compareecompre.com', 'www.compareecompre.com'].includes(host) && !/^\/(?:admin|_authenticated\/admin)(?:\/|$)/.test(path);
}
export function analyticsAllowed() {
  return typeof window !== 'undefined' && hasConsent('analytics') && allowedAnalyticsLocation(window.location.hostname, window.location.pathname, audienceAllowed);
}
function gaWindow() { return window as AnalyticsWindow; }
function command(...args: unknown[]) { gaWindow().gtag?.(...args); }
function consentSignals() {
  return { analytics_storage: hasConsent('analytics') ? 'granted' : 'denied', ad_storage: hasConsent('ads') ? 'granted' : 'denied', ad_user_data: hasConsent('ads') ? 'granted' : 'denied', ad_personalization: hasConsent('ads') ? 'granted' : 'denied' };
}
export function deleteAnalyticsCookies() {
  for (const part of document.cookie.split(';')) {
    const name = part.trim().split('=')[0]; if (!name?.startsWith('_ga')) continue;
    for (const domain of ['', window.location.hostname, '.compareecompre.com', 'compareecompre.com']) {
      document.cookie = `${name}=; Max-Age=0; path=/;${domain ? ` domain=${domain};` : ''}`;
    }
  }
}
export function syncAnalyticsAudience(allowed: boolean) { audienceAllowed = allowed; reconcileAnalytics(); }
export function reconcileAnalytics() {
  const target = gaWindow();
  const disabled = !analyticsAllowed();
  Object.assign(target, { [`ga-disable-${MEASUREMENT_ID}`]: disabled });
  if (disabled) {
    if (target.dataLayer) target.dataLayer.length = 0;
    if (configured) command('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    if (!hasConsent('analytics')) deleteAnalyticsCookies();
    script?.remove(); script = null; lastPage = null;
    return;
  }
  if (!configured) {
    target.dataLayer = [];
    target.gtag = function (..._args: unknown[]) { target.dataLayer?.push(arguments); };
    command('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    command('set', 'developer_id.dZjgwMW', true);
    command('js', new Date());
    command('consent', 'update', consentSignals());
    command('config', MEASUREMENT_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, cookie_path: '/', cookie_domain: 'auto' });
    configured = true;
  } else command('consent', 'update', consentSignals());
  if (!script) {
    script = document.createElement('script'); script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
    document.head.appendChild(script);
  }
}
// Drop apparent personal data, URLs and long/freeform input rather than transmitting it.
export function safeAnalyticsText(value: string) {
  const trimmed = value.trim().slice(0, 150);
  return /@|https?:|\b\d{3}[. -]?\d{3}[. -]?\d{3}[- ]?\d{2}\b|(?:\+?\d[\s().-]*){10,}/i.test(trimmed) ? '' : trimmed;
}
export function trackEvent(name: 'outbound_click' | 'search' | 'blog_cta_click', params: Record<string, string | number>) {
  if (!analyticsAllowed()) return;
  command('event', name, { ...params, page_location: window.location.origin + window.location.pathname, page_referrer: '', transport_type: 'beacon' });
}
export function trackPageView(key: string) {
  reconcileAnalytics();
  if (!analyticsAllowed() || key === lastPage) return;
  lastPage = key;
  command('event', 'page_view', { page_title: document.title, page_location: window.location.origin + window.location.pathname, page_path: window.location.pathname, page_referrer: '' });
}
export function rememberProductOrigin(id: string, origin: string) { if (analyticsAllowed()) origins.set(id, origin); }
export function outboundOrigin(id: string, placement: string) {
  if (placement === 'blog_card') return 'blog_card';
  const path = window.location.pathname;
  if (path.startsWith('/blog/')) return 'blog';
  if (path.startsWith('/categoria/')) return 'categoria';
  if (new URLSearchParams(window.location.search).has('q')) return 'busca';
  if (path.startsWith('/produto/')) return placement === 'best_offer' ? origins.get(id) || 'oferta_pagina_produto' : 'oferta_pagina_produto';
  return origins.get(id) || 'oferta_pagina_produto';
}
export function trackOutbound(item: { id: string; store: string; category?: string | null | undefined; title?: string | undefined; price?: number | null | undefined }, placement: string, editorial?: { articleSlug?: string }) {
  trackEvent('outbound_click', { loja: safeAnalyticsText(item.store), categoria: safeAnalyticsText(item.category || ''), nome_produto: safeAnalyticsText(item.title || ''), ...(typeof item.price === 'number' && Number.isFinite(item.price) ? { value: item.price } : {}), currency: 'BRL', origem: outboundOrigin(item.id, placement), ...(placement === 'blog_card' && editorial?.articleSlug ? { artigo: safeAnalyticsText(editorial.articleSlug) } : {}) });
}