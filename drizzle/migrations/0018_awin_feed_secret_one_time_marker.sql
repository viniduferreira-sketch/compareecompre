CREATE TABLE public.awin_feed_settings (singleton boolean PRIMARY KEY DEFAULT true, secret_migrated boolean NOT NULL DEFAULT false);
GRANT ALL ON public.awin_feed_settings TO service_role;
REVOKE ALL ON public.awin_feed_settings FROM anon, authenticated;
ALTER TABLE public.awin_feed_settings ENABLE ROW LEVEL SECURITY;
ALTER FUNCTION public.save_awin_feed(uuid,text,text,jsonb,boolean) RENAME TO save_awin_feed_internal;
REVOKE ALL ON FUNCTION public.save_awin_feed_internal(uuid,text,text,jsonb,boolean) FROM PUBLIC, anon, authenticated;
CREATE FUNCTION public.save_awin_feed(_nome text, _url text, _merchants jsonb, _id uuid DEFAULT NULL, _secret boolean DEFAULT false) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE fid uuid;
BEGIN
 IF _secret THEN
 INSERT INTO public.awin_feed_settings(singleton,secret_migrated) VALUES(true,false) ON CONFLICT DO NOTHING;
 PERFORM 1 FROM public.awin_feed_settings WHERE singleton=true FOR UPDATE;
 IF (SELECT secret_migrated FROM public.awin_feed_settings WHERE singleton=true) THEN RAISE EXCEPTION 'Current feed already migrated'; END IF;
 END IF;
 fid := public.save_awin_feed_internal(_id,_nome,_url,_merchants,_secret);
 IF _secret THEN UPDATE public.awin_feed_settings SET secret_migrated=true WHERE singleton=true; END IF;
 RETURN fid;
END $$;
REVOKE ALL ON FUNCTION public.save_awin_feed(text,text,jsonb,uuid,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_awin_feed(text,text,jsonb,uuid,boolean) TO service_role;