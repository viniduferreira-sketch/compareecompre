CREATE TABLE public.home_showcases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 title text NOT NULL,
 subtitle text NOT NULL DEFAULT '',
 category_slug text NOT NULL CHECK (category_slug IN ('eletronicos','moda','casa','celulares','games','beleza','esportes')),
 terms text[] NOT NULL DEFAULT '{}',
 sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
 active boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.home_showcases TO anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.home_showcases TO authenticated;
GRANT ALL ON public.home_showcases TO service_role;
ALTER TABLE public.home_showcases ENABLE ROW LEVEL SECURITY;
CREATE POLICY home_showcases_public_read ON public.home_showcases FOR SELECT TO anon,authenticated USING (active=true);
CREATE POLICY home_showcases_admin_all ON public.home_showcases FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin'));
CREATE INDEX home_showcases_active_order ON public.home_showcases (sort_order,id) WHERE active=true;