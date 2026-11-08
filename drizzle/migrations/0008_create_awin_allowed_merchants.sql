CREATE TABLE public.awin_allowed_merchants (
  merchant_name text PRIMARY KEY CHECK (char_length(btrim(merchant_name)) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.awin_allowed_merchants TO authenticated;
GRANT ALL ON public.awin_allowed_merchants TO service_role;
ALTER TABLE public.awin_allowed_merchants ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_awin_allowlist_read ON public.awin_allowed_merchants FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY admin_awin_allowlist_insert ON public.awin_allowed_merchants FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY admin_awin_allowlist_delete ON public.awin_allowed_merchants FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));