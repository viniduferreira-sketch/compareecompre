CREATE TABLE public.partner_stores (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), network text NOT NULL CHECK(network IN ('awin','lomadee','mercadolivre')), external_id text NOT NULL, merchant_name text NOT NULL DEFAULT '', name text NOT NULL DEFAULT '', logo_url text, description text NOT NULL DEFAULT '', import_enabled boolean NOT NULL DEFAULT true, display_enabled boolean NOT NULL DEFAULT true, enrollment_status text NOT NULL DEFAULT 'unknown' CHECK(enrollment_status IN ('authorized','not_enrolled','unknown','disabled')), notes text NOT NULL DEFAULT '', metadata_origin jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(network,external_id)
);
GRANT SELECT,INSERT,UPDATE ON public.partner_stores TO authenticated;
GRANT ALL ON public.partner_stores TO service_role;
ALTER TABLE public.partner_stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY partner_stores_admin_all ON public.partner_stores FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin'::text)) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin'::text));