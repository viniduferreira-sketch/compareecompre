CREATE TABLE public.category_content (
 slug text PRIMARY KEY,
 introduction text NOT NULL DEFAULT '',
 faq jsonb NOT NULL DEFAULT '[]'::jsonb,
 guide_slugs text[] NOT NULL DEFAULT '{}',
 CONSTRAINT category_content_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 CONSTRAINT category_content_faq_array CHECK (jsonb_typeof(faq) = 'array')
);
GRANT SELECT ON public.category_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_content TO authenticated;
GRANT ALL ON public.category_content TO service_role;
ALTER TABLE public.category_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY category_content_public_read ON public.category_content FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY category_content_admin_write ON public.category_content FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));