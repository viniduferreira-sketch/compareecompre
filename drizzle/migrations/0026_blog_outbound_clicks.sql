ALTER TABLE public.outbound_clicks DROP CONSTRAINT outbound_clicks_page_type_check;
ALTER TABLE public.outbound_clicks ADD CONSTRAINT outbound_clicks_page_type_check CHECK(page_type IN ('produto','home','cupom','busca','blog'));
ALTER TABLE public.outbound_clicks ADD COLUMN IF NOT EXISTS article_slug text;
COMMENT ON COLUMN public.outbound_clicks.article_slug IS 'Editorial article slug; no visitor identifier.';
CREATE OR REPLACE FUNCTION public.record_outbound_click(payload jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE allowed integer;
BEGIN
 INSERT INTO public.outbound_click_budget(singleton,minute,used) VALUES(true,date_trunc('minute',now()),1)
 ON CONFLICT(singleton) DO UPDATE SET minute=excluded.minute, used=CASE WHEN outbound_click_budget.minute=excluded.minute THEN outbound_click_budget.used+1 ELSE 1 END
 WHERE outbound_click_budget.minute<>excluded.minute OR outbound_click_budget.used<300
 RETURNING used INTO allowed;
 IF allowed IS NULL THEN RETURN false; END IF;
 INSERT INTO public.outbound_clicks(offer_id,source,store_name,category,page_type,placement,referrer_host,utm_source,utm_medium,utm_campaign,device,article_slug)
 VALUES(payload->>'offer_id',payload->>'source',payload->>'store_name',payload->>'category',payload->>'page_type',payload->>'placement',payload->>'referrer_host',payload->>'utm_source',payload->>'utm_medium',payload->>'utm_campaign',payload->>'device',payload->>'article_slug');
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.record_outbound_click(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_outbound_click(jsonb) TO service_role;