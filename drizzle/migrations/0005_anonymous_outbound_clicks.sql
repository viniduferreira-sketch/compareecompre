CREATE TABLE public.outbound_clicks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT now(),
 offer_id text NOT NULL, source text NOT NULL CHECK(source IN ('mercadolivre','lomadee','awin')),
 store_name text NOT NULL, category text,
 page_type text NOT NULL CHECK(page_type IN ('produto','home','cupom','busca')),
 placement text NOT NULL, referrer_host text, utm_source text, utm_medium text, utm_campaign text,
 device text NOT NULL CHECK(device IN ('mobile','desktop'))
);
GRANT SELECT ON public.outbound_clicks TO authenticated;
GRANT ALL ON public.outbound_clicks TO service_role;
ALTER TABLE public.outbound_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_click_read ON public.outbound_clicks FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin'));
CREATE INDEX outbound_clicks_created_at_idx ON public.outbound_clicks(created_at DESC);
CREATE TABLE public.outbound_click_budget (singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), minute timestamptz NOT NULL, used integer NOT NULL);
GRANT ALL ON public.outbound_click_budget TO service_role;
ALTER TABLE public.outbound_click_budget ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.record_outbound_click(payload jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE allowed integer;
BEGIN
 INSERT INTO public.outbound_click_budget(singleton,minute,used) VALUES(true,date_trunc('minute',now()),1)
 ON CONFLICT(singleton) DO UPDATE SET minute=excluded.minute, used=CASE WHEN outbound_click_budget.minute=excluded.minute THEN outbound_click_budget.used+1 ELSE 1 END
 WHERE outbound_click_budget.minute<>excluded.minute OR outbound_click_budget.used<300
 RETURNING used INTO allowed;
 IF allowed IS NULL THEN RETURN false; END IF;
 INSERT INTO public.outbound_clicks(offer_id,source,store_name,category,page_type,placement,referrer_host,utm_source,utm_medium,utm_campaign,device)
 VALUES(payload->>'offer_id',payload->>'source',payload->>'store_name',payload->>'category',payload->>'page_type',payload->>'placement',payload->>'referrer_host',payload->>'utm_source',payload->>'utm_medium',payload->>'utm_campaign',payload->>'device');
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.record_outbound_click(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_outbound_click(jsonb) TO service_role;
CREATE FUNCTION public.outbound_click_report() RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE result jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
 WITH recent AS (SELECT * FROM public.outbound_clicks WHERE created_at>=now()-interval '30 days'),
 sources AS (SELECT source AS label,count(*) AS count FROM recent GROUP BY source ORDER BY count DESC),
 stores AS (SELECT store_name AS label,count(*) AS count FROM recent GROUP BY store_name ORDER BY count DESC,store_name LIMIT 10),
 categories AS (SELECT coalesce(category,'Sem categoria') AS label,count(*) AS count FROM recent GROUP BY category ORDER BY count DESC),
 placements AS (SELECT page_type||' / '||placement AS label,count(*) AS count FROM recent GROUP BY page_type,placement ORDER BY count DESC),
 items AS (SELECT offer_id,source,store_name,CASE WHEN page_type='cupom' THEN 'cupom' ELSE 'produto' END AS kind,count(*) AS count FROM recent GROUP BY offer_id,source,store_name,CASE WHEN page_type='cupom' THEN 'cupom' ELSE 'produto' END ORDER BY count DESC,offer_id LIMIT 20)
 SELECT jsonb_build_object('today',(SELECT count(*) FROM recent WHERE created_at>=date_trunc('day',now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo'),'days7',(SELECT count(*) FROM recent WHERE created_at>=now()-interval '7 days'),'days30',(SELECT count(*) FROM recent),'sources',coalesce((SELECT jsonb_agg(sources) FROM sources),'[]'::jsonb),'stores',coalesce((SELECT jsonb_agg(stores) FROM stores),'[]'::jsonb),'categories',coalesce((SELECT jsonb_agg(categories) FROM categories),'[]'::jsonb),'placements',coalesce((SELECT jsonb_agg(placements) FROM placements),'[]'::jsonb),'items',coalesce((SELECT jsonb_agg(items) FROM items),'[]'::jsonb)) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.outbound_click_report() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.outbound_click_report() TO authenticated;