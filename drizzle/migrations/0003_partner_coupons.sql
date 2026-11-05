CREATE TABLE public.partner_coupons (id text PRIMARY KEY, source text NOT NULL CHECK(source IN ('lomadee','awin')), merchant_id text NOT NULL, store text NOT NULL, logo_url text, title text NOT NULL, description text, code text NOT NULL, affiliate_url text NOT NULL, starts_at timestamptz, expires_at timestamptz, status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','unavailable')), last_synced_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.partner_coupons TO anon, authenticated;
GRANT ALL ON public.partner_coupons TO service_role;
ALTER TABLE public.partner_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY active_coupon_read ON public.partner_coupons FOR SELECT TO anon, authenticated USING (status = 'active' AND (starts_at IS NULL OR starts_at <= now()) AND (expires_at IS NULL OR expires_at > now()));
CREATE INDEX partner_coupons_source_idx ON public.partner_coupons(source);
ALTER TABLE public.catalog_imports ADD COLUMN IF NOT EXISTS sync_cursor jsonb;