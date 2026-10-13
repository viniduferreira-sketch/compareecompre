CREATE TABLE public.offer_sync_category_leases (category text PRIMARY KEY, execution_id uuid NOT NULL, expires_at timestamptz NOT NULL);
GRANT ALL ON public.offer_sync_category_leases TO service_role;
REVOKE ALL ON public.offer_sync_category_leases FROM anon, authenticated;
ALTER TABLE public.offer_sync_category_leases ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.claim_offer_sync_category(_category text, _execution_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE claimed text;
BEGIN
 IF _category NOT IN ('Eletrônicos','Moda','Casa','Celulares','Games','Beleza','Esportes') THEN RAISE EXCEPTION 'Invalid category'; END IF;
 INSERT INTO public.offer_sync_category_leases(category, execution_id, expires_at) VALUES (_category, _execution_id, now() + interval '10 minutes')
 ON CONFLICT (category) DO UPDATE SET execution_id = EXCLUDED.execution_id, expires_at = EXCLUDED.expires_at WHERE offer_sync_category_leases.expires_at < now() RETURNING category INTO claimed;
 RETURN claimed IS NOT NULL;
END; $$;
CREATE OR REPLACE FUNCTION public.release_offer_sync_category(_category text, _execution_id uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ DELETE FROM public.offer_sync_category_leases WHERE category = _category AND execution_id = _execution_id; $$;
REVOKE ALL ON FUNCTION public.claim_offer_sync_category(text,uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_offer_sync_category(text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_offer_sync_category(text,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_offer_sync_category(text,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.configure_algolia_sync_job(_cron_secret text) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN RETURN (SELECT jobid FROM cron.job WHERE jobname = 'sync-algolia-six-hourly' LIMIT 1); END; $$;
REVOKE ALL ON FUNCTION public.configure_algolia_sync_job(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.configure_algolia_sync_job(text) TO service_role;