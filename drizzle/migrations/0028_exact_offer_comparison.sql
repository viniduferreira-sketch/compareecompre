CREATE TABLE public.product_comparison_offers (
 object_id text PRIMARY KEY, source text NOT NULL, comparison_key text, store text NOT NULL, price numeric NOT NULL, record jsonb NOT NULL, visible boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_comparison_offers TO anon, authenticated;
GRANT ALL ON public.product_comparison_offers TO service_role;
ALTER TABLE public.product_comparison_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_comparison_read ON public.product_comparison_offers FOR SELECT TO anon, authenticated USING (visible AND comparison_key IS NOT NULL);
CREATE INDEX product_comparison_key_price ON public.product_comparison_offers(comparison_key,price) WHERE visible;
CREATE FUNCTION public.capture_comparison_offer(_id text,_source text,_record jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE k text; g text; p numeric; safe jsonb;
BEGIN
 g:=regexp_replace(coalesce(nullif(_record->>'gtin',''),_record->>'ean',''),'[^0-9]','','g');
 k:=CASE WHEN length(g) BETWEEN 8 AND 14 THEN 'gtin:'||lpad(g,14,'0') ELSE nullif(_record->>'comparison_key','') END;
 IF k IS NOT NULL AND k NOT LIKE 'gtin:%' AND k NOT LIKE 'model:%' THEN k:=NULL; END IF;
 p:=CASE WHEN jsonb_typeof(_record->'price')='number' THEN (_record->>'price')::numeric ELSE 0 END;
 safe:=jsonb_build_object('objectID',_id,'source',_source,'store',coalesce(_record->>'store',_record->>'merchant_name','Loja parceira'),'price',p,
 'affiliateUrl',coalesce(_record->>'affiliateUrl',_record->>'aw_deep_link'),'storeLogoUrl',coalesce(_record->>'storeLogoUrl',_record->>'merchant_logo',_record->>'store_logo'),
 'gtin',CASE WHEN length(g) BETWEEN 8 AND 14 THEN lpad(g,14,'0') ELSE NULL END,'brand',_record->'brand','model',_record->'model','comparison_variant',_record->'comparison_variant',
 'freeShipping',_record->'freeShipping','shippingCost',_record->'shippingCost','sellerName',coalesce(_record->'sellerName',_record->'seller_nickname'), 'last_synced_at',_record->'last_synced_at');
 INSERT INTO public.product_comparison_offers(object_id,source,comparison_key,store,price,record,visible)
 VALUES(_id,_source,k,safe->>'store',p,safe,
 p>0 AND k IS NOT NULL AND _record->>'status'='active' AND coalesce(_record->>'inStock','true')<>'false' AND coalesce(_record->>'quality_status','')<>'rejected' AND coalesce(_record->>'price_review_status','')<>'pending' AND coalesce(_record->>'site_hidden','false')<>'true')
 ON CONFLICT(object_id) DO UPDATE SET source=excluded.source,comparison_key=excluded.comparison_key,store=excluded.store,price=excluded.price,record=excluded.record,visible=excluded.visible,updated_at=now();
END $$;
REVOKE ALL ON FUNCTION public.capture_comparison_offer(text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.capture_comparison_offer(text,text,jsonb) TO service_role;
CREATE FUNCTION public.capture_partner_comparison_trigger() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM public.capture_comparison_offer(NEW.object_id,NEW.source,NEW.record); RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.capture_partner_comparison_trigger() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER partner_catalog_comparison AFTER INSERT OR UPDATE ON public.partner_catalog FOR EACH ROW EXECUTE FUNCTION public.capture_partner_comparison_trigger();
INSERT INTO public.product_comparison_offers(object_id,source,comparison_key,store,price,record,visible)
SELECT object_id,source,NULL,coalesce(record->>'store','Loja parceira'),0,'{}'::jsonb,false FROM public.partner_catalog;
DO $$ DECLARE r record; BEGIN FOR r IN SELECT object_id,source,record FROM public.partner_catalog LOOP PERFORM public.capture_comparison_offer(r.object_id,r.source,r.record); END LOOP; END $$;