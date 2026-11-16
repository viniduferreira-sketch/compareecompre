import { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { getConsent, hasConsent, loadConsent, saveConsent, subscribeConsent } from '@/lib/cookie-consent';
import { rememberProductOrigin, safeAnalyticsText, syncAnalyticsAudience, trackEvent, trackPageView } from '@/lib/analytics';
import { onConsentChange } from '@/lib/consent';

export function CookieConsent() {
  const router = useRouter();
  const banner = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false), [choice, setChoice] = useState(getConsent());
  const [open, setOpen] = useState(false), [analytics, setAnalytics] = useState(false), [ads, setAds] = useState(false);
  useEffect(() => {
    loadConsent(); setChoice(getConsent()); setReady(true);
    const preferences = () => { setAnalytics(hasConsent('analytics')); setAds(hasConsent('ads')); setOpen(true); };
    window.addEventListener('cec-cookie-preferences', preferences);
    const unsubscribe = subscribeConsent(() => { setChoice(getConsent()); });
    const signals = onConsentChange(() => { loadConsent(); setChoice(getConsent()); });
    const storage = (event: StorageEvent) => { if (event.key === 'cec-cookie-consent' || event.key === null) loadConsent(); };
    window.addEventListener('storage', storage);
    return () => { unsubscribe(); signals(); window.removeEventListener('storage', storage); window.removeEventListener('cec-cookie-preferences', preferences); };
  }, []);
  useEffect(() => {
    let cancelled = false, generation = 0, frame = 0, audience = false;
    const page = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => { if (!cancelled) trackPageView(window.location.pathname + window.location.search); }); }); };
    const consentChanged = () => { syncAnalyticsAudience(audience); page(); };
    const checkUser = async () => {
      const run = ++generation; audience = false; syncAnalyticsAudience(false);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (cancelled || run !== generation || error) return;
        if (!data.session) audience = true;
        else {
          const role = await supabase.from('user_roles').select('role').eq('user_id', data.session.user.id).eq('role', 'admin').maybeSingle();
          if (cancelled || run !== generation) return;
          audience = !role.error && !role.data;
        }
        consentChanged();
      } catch { /* Unknown role/session fails closed. */ }
    };
    void checkUser();
    const auth = supabase.auth.onAuthStateChange(() => { audience = false; syncAnalyticsAudience(false); setTimeout(() => { if (!cancelled) void checkUser(); }, 0); });
    const unsubscribeConsent = subscribeConsent(consentChanged);
    const unsubscribeRoute = router.subscribe('onResolved', page);
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a') : null;
      if (!target) return;
      const url = new URL(target.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      if (url.pathname.startsWith('/produto/')) {
        const section = target.closest('section[aria-label]')?.getAttribute('aria-label') || '';
        const origin = window.location.pathname.startsWith('/blog/') ? 'blog' : window.location.pathname.startsWith('/categoria/') ? 'categoria' : new URLSearchParams(window.location.search).has('q') ? 'busca' : section === 'Alternativas para comparar' ? 'relacionados_alternativas' : section.startsWith('Mais em ') ? 'relacionados_categoria' : section ? `vitrine_${section.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : 'oferta_pagina_produto';
        rememberProductOrigin(decodeURIComponent(url.pathname.slice('/produto/'.length)), origin);
      }
      const slug = /^\/blog\/([^/]+)$/.exec(window.location.pathname)?.[1];
      if (slug && url.pathname === '/' && /compar(?:e|ar) preços|buscar ofertas/i.test(target.textContent || '')) trackEvent('blog_cta_click', { slug: safeAnalyticsText(slug) });
    };
    document.addEventListener('click', click, true);
    const expiry = window.setInterval(() => { if (getConsent() === null) { loadConsent(); consentChanged(); } }, 60_000);
    return () => { cancelled = true; generation++; cancelAnimationFrame(frame); auth.data.subscription.unsubscribe(); unsubscribeConsent(); unsubscribeRoute(); document.removeEventListener('click', click, true); clearInterval(expiry); syncAnalyticsAudience(false); };
  }, [router]);
  const privacySignal = ready && typeof navigator !== 'undefined' && (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
  useEffect(() => { if (ready && !choice && !open && !privacySignal) banner.current?.focus(); }, [ready, choice, open, privacySignal]);
  const save = (statistics: boolean, advertising: boolean) => { saveConsent(statistics, advertising); setOpen(false); };
  return <>
    {ready && !choice && !open && !privacySignal && <aside ref={banner} tabIndex={-1} aria-label="Aviso de cookies" className="fixed inset-x-2 bottom-2 z-50 mx-auto max-h-[33dvh] max-w-7xl overflow-y-auto rounded-lg border border-border bg-card p-3 text-foreground shadow-lg sm:inset-x-5 sm:bottom-4 sm:p-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-6">
        <p className="text-xs leading-5 sm:text-sm">Contamos visitas sem cookies. Com sua permissão, medimos também cliques e usamos cookies de estatísticas e de publicidade. Cookies essenciais mantêm o site funcionando. Saiba mais na <Link to="/politica-de-privacidade" className="font-semibold text-primary underline">Política de Privacidade</Link>.</p>
        <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-3">
          <Button variant="hero" className="h-auto min-h-9 whitespace-normal px-2 py-2 text-xs sm:text-sm" onClick={() => save(true, true)}>Aceitar todos</Button>
          <Button variant="hero" className="h-auto min-h-9 whitespace-normal px-2 py-2 text-xs sm:text-sm" onClick={() => save(false, false)}>Recusar não essenciais</Button>
          <Button variant="outline" className="col-span-2 h-9 text-xs sm:text-sm lg:col-span-1" onClick={() => { setAnalytics(false); setAds(false); setOpen(true); }}>Gerenciar</Button>
        </div>
      </div>
    </aside>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg">
      <DialogHeader><DialogTitle>Preferências de cookies</DialogTitle><DialogDescription>Escolha quais categorias você permite. Você pode mudar sua escolha a qualquer momento.</DialogDescription></DialogHeader>
      <div className="divide-y divide-border">
        <div className="py-4"><h3 className="font-semibold">Essenciais · sempre ativos</h3><p className="mt-1 text-sm text-muted-foreground">Mantêm o site funcionando, protegem o acesso ao painel e guardam sua escolha de cookies.</p></div>
        <div className="flex items-center justify-between gap-4 py-4"><div><label htmlFor="consent-analytics" className="font-semibold">Estatísticas</label><p className="mt-1 text-sm text-muted-foreground">Medições fornecidas por Lovable e Google Analytics para melhorar o site.</p></div><Switch id="consent-analytics" checked={analytics} onCheckedChange={setAnalytics} disabled={privacySignal} /></div>
        <div className="flex items-center justify-between gap-4 py-4"><div><label htmlFor="consent-ads" className="font-semibold">Publicidade</label><p className="mt-1 text-sm text-muted-foreground">Cookies de terceiros do Google AdSense para anúncios e personalização.</p></div><Switch id="consent-ads" checked={ads} onCheckedChange={setAds} disabled={privacySignal} /></div>
      </div>{privacySignal && <p className="text-sm text-muted-foreground">O sinal de privacidade do seu navegador mantém as opções desativadas.</p>}<div className="grid grid-cols-2 gap-2"><Button variant="hero" onClick={() => save(true, true)}>Aceitar todos</Button><Button variant="hero" onClick={() => save(false, false)}>Recusar não essenciais</Button></div><Button variant="outline" onClick={() => save(analytics, ads)}>Salvar preferências</Button>
    </DialogContent></Dialog>
  </>;
}