CREATE TABLE public.product_price_history (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, object_id text NOT NULL, source text NOT NULL, store text NOT NULL, price numeric NOT NULL CHECK (price > 0), observed_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.product_price_history TO anon, authenticated;
GRANT ALL ON public.product_price_history TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.product_price_history_id_seq TO service_role;
ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public real price observations" ON public.product_price_history FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX product_price_history_lookup ON public.product_price_history (object_id, store, observed_at DESC, id DESC);
CREATE FUNCTION public.record_real_product_price(_object_id text, _source text, _store text, _price numeric) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE previous_price numeric;
BEGIN
 IF _price IS NULL OR _price <= 0 OR _object_id IS NULL OR _store IS NULL OR _source IS NULL THEN RETURN false; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_object_id || ':' || _store, 0));
 SELECT price INTO previous_price FROM public.product_price_history WHERE object_id = _object_id AND store = _store ORDER BY observed_at DESC, id DESC LIMIT 1;
 IF previous_price IS NOT DISTINCT FROM _price THEN RETURN false; END IF;
 INSERT INTO public.product_price_history(object_id, source, store, price) VALUES (_object_id, _source, _store, _price);
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.record_real_product_price(text,text,text,numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_real_product_price(text,text,text,numeric) TO service_role;
CREATE FUNCTION public.capture_partner_real_price() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.record->>'status' = 'unavailable' OR NEW.record->>'inStock' = 'false' THEN RETURN NEW; END IF;
 IF jsonb_typeof(NEW.record->'price') = 'number' AND coalesce(NEW.record->>'store','') <> '' THEN
  PERFORM public.record_real_product_price(NEW.object_id, NEW.source, NEW.record->>'store', (NEW.record->>'price')::numeric);
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.capture_partner_real_price() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER capture_partner_real_price AFTER INSERT OR UPDATE OF last_synced_at ON public.partner_catalog FOR EACH ROW EXECUTE FUNCTION public.capture_partner_real_price();
COMMENT ON TABLE public.product_price_history IS 'Real observed prices from installation forward. Only first observation and changes per product/store are stored; no historical backfill.';