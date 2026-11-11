import { z } from "zod";
import { trackOutbound } from './analytics';

const campaignToken = z.string().max(80).regex(/^[a-zA-Z0-9_-]+$/).nullable();
export const outboundClickSchema = z.object({
  offer_id: z.string().min(1).max(160).regex(/^[a-zA-Z0-9_:.-]+$/),
  source: z.enum(["mercadolivre", "lomadee", "awin"]),
  store_name: z.string().trim().min(1).max(100).regex(/^[\p{L}\p{N} &.'()_-]+$/u),
  category: z.string().trim().min(1).max(100).regex(/^[\p{L}\p{N} &.'()_-]+$/u).nullable(),
  page_type: z.enum(["produto", "home", "cupom", "busca"]),
  placement: z.enum(["best_offer", "compare_store", "compare_dialog_best", "compare_dialog_alternative", "coupon_store"]),
  referrer_host: z.string().max(253).regex(/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/).nullable(),
  utm_source: campaignToken, utm_medium: campaignToken, utm_campaign: campaignToken,
  device: z.enum(["mobile", "desktop"]),
}).strict();

export type OutboundClick = z.infer<typeof outboundClickSchema>;

export function clickContext(url: string, referrer: string, mobile: boolean) {
  const params = new URL(url).searchParams;
  const token = (name: string) => {
    const value = params.get(name);
    return campaignToken.safeParse(value).success ? value : null;
  };
  let host: string | null = null;
  try { host = new URL(referrer).hostname; } catch { /* No referrer. */ }
  return { referrer_host: host, utm_source: token("utm_source"), utm_medium: token("utm_medium"), utm_campaign: token("utm_campaign"), device: mobile ? "mobile" as const : "desktop" as const };
}

/** No navigation interception, cookies, storage, IP or user-agent collection. */
export function recordOutboundClick(item: { id: string; source?: string | undefined; store: string; category?: string | null | undefined; title?: string | undefined; price?: number | null | undefined }, placement: OutboundClick["placement"]) {
  try { trackOutbound(item, placement); } catch { /* Analytics must never block the anonymous record or navigation. */ }
  try {
    const path = window.location.pathname;
    const page_type = path.startsWith("/produto/") ? "produto" : path === "/cupons" ? "cupom" : new URLSearchParams(window.location.search).has("q") ? "busca" : "home";
    const parsed = outboundClickSchema.safeParse({ offer_id: item.id, source: item.source, store_name: item.store, category: item.category || null, placement, page_type,
      ...clickContext(window.location.href, document.referrer, window.matchMedia("(max-width: 767px)").matches),
    });
    if (!parsed.success) return;
    const body = JSON.stringify(parsed.data);
    if (navigator.sendBeacon?.("/api/public/outbound-click", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/public/outbound-click", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true, credentials: "omit" }).catch(() => {});
  } catch { /* A failed measurement must never affect a partner link. */ }
}

const bucket = z.array(z.object({ label: z.string(), count: z.number() }));
export const outboundReportSchema = z.object({ today: z.number(), days7: z.number(), days30: z.number(), sources: bucket, stores: bucket, categories: bucket, placements: bucket,
  items: z.array(z.object({ offer_id: z.string(), source: z.string(), store_name: z.string(), kind: z.enum(["produto", "cupom"]), count: z.number() })),
});