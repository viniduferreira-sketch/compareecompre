import type { LomadeeBrand } from "./lomadee-catalog";

export type LomadeeCampaign = {
  id?: string; organizationId?: string; name?: string; description?: string;
  type?: string; code?: string; status?: string;
  period?: { startAt?: string; endAt?: string };
  channels?: Array<{ shortUrls?: string[] | null }>;
};

export function activeCouponDates(startsAt: string | null, expiresAt: string | null, now = Date.now()) {
  return (!startsAt || (Number.isFinite(Date.parse(startsAt)) && Date.parse(startsAt) <= now)) &&
    (!expiresAt || (Number.isFinite(Date.parse(expiresAt)) && Date.parse(expiresAt) > now));
}

const clean = (value?: string) => (value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
export function normalizeLomadeeCoupon(campaign: LomadeeCampaign, brand: LomadeeBrand | undefined, now: string) {
  const code = clean(campaign.code);
  const title = clean(campaign.name);
  const startsAt = campaign.period?.startAt ?? null;
  const expiresAt = campaign.period?.endAt ?? null;
  const affiliateUrl = campaign.channels?.flatMap((c) => c.shortUrls ?? []).find((url) => {
    try { return new URL(url).protocol === "https:"; } catch { return false; }
  });
  if (!campaign.id || !campaign.organizationId || !brand?.name || !title || !code || !affiliateUrl ||
    !["GenericCoupon", "PersonalCoupon"].includes(campaign.type ?? "") || campaign.status !== "onTime" ||
    !activeCouponDates(startsAt, expiresAt, Date.parse(now))) return null;
  return {
    id: `lomadee-${campaign.organizationId}-${campaign.id}`, source: "lomadee" as const,
    merchant_id: campaign.organizationId, store: brand.name, logo_url: brand.logo ?? null,
    title, description: clean(campaign.description) || null, code, affiliate_url: affiliateUrl,
    starts_at: startsAt, expires_at: expiresAt, status: "active", last_synced_at: now,
  };
}

export type Coupon = NonNullable<ReturnType<typeof normalizeLomadeeCoupon>>;