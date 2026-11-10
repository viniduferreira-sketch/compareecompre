ALTER TABLE public.partner_stores ADD COLUMN group_variants boolean NOT NULL DEFAULT false;
UPDATE public.partner_stores SET group_variants = true WHERE lower(trim(merchant_name)) IN ('nike','nike br','adidas','adidas br');
CREATE OR REPLACE FUNCTION public.patch_store_groups(_updates jsonb, _network text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE affected integer;
BEGIN
  UPDATE public.partner_catalog AS c SET record = c.record || jsonb_build_object('group_key', u.value->>'group_key') FROM jsonb_array_elements(_updates) AS u(value) WHERE c.object_id = u.value->>'objectID' AND c.source = _network;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END; $$;
REVOKE ALL ON FUNCTION public.patch_store_groups(jsonb,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.patch_store_groups(jsonb,text) TO service_role;