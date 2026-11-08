CREATE TABLE public.awin_merchant_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant text NOT NULL UNIQUE CHECK (char_length(merchant) BETWEEN 1 AND 200),
  category_terms text[] NOT NULL DEFAULT '{}',
  max_products integer NOT NULL CHECK (max_products BETWEEN 1 AND 100000),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.awin_merchant_rules TO authenticated;
GRANT ALL ON public.awin_merchant_rules TO service_role;
ALTER TABLE public.awin_merchant_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_awin_rules_all ON public.awin_merchant_rules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE TABLE public.awin_import_merchant_slots (
  import_id uuid NOT NULL REFERENCES public.catalog_imports(id) ON DELETE CASCADE,
  batch integer NOT NULL,
  merchant text NOT NULL,
  granted integer NOT NULL CHECK (granted >= 0),
  PRIMARY KEY (import_id, batch, merchant)
);
GRANT SELECT ON public.awin_import_merchant_slots TO authenticated;
GRANT ALL ON public.awin_import_merchant_slots TO service_role;
ALTER TABLE public.awin_import_merchant_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_awin_slots_read ON public.awin_import_merchant_slots FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE OR REPLACE FUNCTION public.claim_awin_merchant_slots(_import_id uuid, _batch integer, _merchant text, _requested integer, _limit integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing integer; used integer; grant_n integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(_import_id::text || '|' || _merchant));
  SELECT granted INTO existing FROM awin_import_merchant_slots WHERE import_id = _import_id AND batch = _batch AND merchant = _merchant;
  IF FOUND THEN RETURN existing; END IF;
  SELECT coalesce(sum(granted), 0) INTO used FROM awin_import_merchant_slots WHERE import_id = _import_id AND merchant = _merchant;
  grant_n := greatest(0, least(_requested, _limit - used));
  INSERT INTO awin_import_merchant_slots(import_id, batch, merchant, granted) VALUES (_import_id, _batch, _merchant, grant_n);
  RETURN grant_n;
END $$;
REVOKE ALL ON FUNCTION public.claim_awin_merchant_slots(uuid, integer, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_awin_merchant_slots(uuid, integer, text, integer, integer) TO service_role;