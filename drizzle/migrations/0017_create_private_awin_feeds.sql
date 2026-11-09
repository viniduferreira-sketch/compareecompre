CREATE TABLE public.awin_feeds (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL DEFAULT 'Feed Awin', url text NOT NULL, anunciantes text[] NOT NULL DEFAULT '{}', ativo boolean NOT NULL DEFAULT true, ultimo_teste_em timestamptz, ultimo_teste_status text, ultima_importacao_em timestamptz, ultima_importacao_linhas integer, created_at timestamptz NOT NULL DEFAULT now(), origem_segredo boolean NOT NULL DEFAULT false
);
GRANT ALL ON public.awin_feeds TO service_role;
REVOKE ALL ON public.awin_feeds FROM anon, authenticated;
ALTER TABLE public.awin_feeds ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX awin_feeds_secret_once ON public.awin_feeds (origem_segredo) WHERE origem_segredo;
CREATE TABLE public.awin_feed_import_results (
 import_id uuid NOT NULL REFERENCES public.catalog_imports(id), feed_id uuid NOT NULL, linhas integer NOT NULL DEFAULT 0, status text NOT NULL, erro text, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(import_id,feed_id)
);
GRANT ALL ON public.awin_feed_import_results TO service_role;
REVOKE ALL ON public.awin_feed_import_results FROM anon, authenticated;
ALTER TABLE public.awin_feed_import_results ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.save_awin_feed(_id uuid, _nome text, _url text, _merchants jsonb, _secret boolean DEFAULT false) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE fid uuid; m jsonb; names text[]; canonical text;
BEGIN
 SELECT coalesce(array_agg(value->>'name'), '{}') INTO names FROM jsonb_array_elements(_merchants);
 IF _id IS NULL THEN
 INSERT INTO public.awin_feeds(nome,url,anunciantes,ultimo_teste_em,ultimo_teste_status,origem_segredo) VALUES(_nome,_url,names,now(),'ok',_secret) RETURNING id INTO fid;
 ELSE
 UPDATE public.awin_feeds SET nome=_nome,url=_url,anunciantes=names,ultimo_teste_em=now(),ultimo_teste_status='ok' WHERE id=_id RETURNING id INTO fid;
 IF fid IS NULL THEN RAISE EXCEPTION 'Feed not found'; END IF;
 END IF;
 FOR m IN SELECT value FROM jsonb_array_elements(_merchants) LOOP
 canonical := regexp_replace(lower(unaccent_name), '\s+br$', '') FROM (SELECT m->>'name' AS unaccent_name) x;
 IF NOT EXISTS(SELECT 1 FROM public.awin_allowed_merchants WHERE regexp_replace(lower(merchant_name), '\s+br$', '')=canonical) THEN
 INSERT INTO public.awin_allowed_merchants(merchant_name) VALUES(m->>'name') ON CONFLICT DO NOTHING;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.awin_merchant_rules WHERE merchant=m->>'id' OR regexp_replace(lower(merchant), '\s+br$', '')=canonical) THEN
 INSERT INTO public.awin_merchant_rules(merchant,category_terms,excluded_category_terms,max_products) VALUES(m->>'name',ARRAY['*'],ARRAY['gift card','cartão presente'],20000) ON CONFLICT DO NOTHING;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.partner_stores WHERE network='awin' AND (external_id=m->>'id' OR regexp_replace(lower(merchant_name), '\s+br$', '')=canonical)) THEN
 INSERT INTO public.partner_stores(network,external_id,merchant_name,name,enrollment_status,metadata_origin) VALUES('awin',m->>'id',m->>'name',m->>'name','unknown','{"name":"awin_feed"}'::jsonb) ON CONFLICT DO NOTHING;
 END IF;
 END LOOP;
 RETURN fid;
END $$;
REVOKE ALL ON FUNCTION public.save_awin_feed(uuid,text,text,jsonb,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_awin_feed(uuid,text,text,jsonb,boolean) TO service_role;