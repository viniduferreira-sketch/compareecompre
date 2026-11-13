ALTER TABLE public.catalog_imports DROP CONSTRAINT catalog_imports_status_check;
ALTER TABLE public.catalog_imports ADD CONSTRAINT catalog_imports_status_check CHECK (status IN ('queued','running','completed','failed','cancelled','expired'));
CREATE OR REPLACE FUNCTION public.expire_idle_awin_jobs() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE changed integer;
BEGIN
 UPDATE public.catalog_imports SET status='expired',finished_at=now(),error='Execução expirada após mais de 60 minutos sem progresso.' WHERE source='awin' AND status IN ('queued','running') AND updated_at < now()-interval '60 minutes';
 GET DIAGNOSTICS changed=ROW_COUNT; RETURN changed;
END; $$;
REVOKE ALL ON FUNCTION public.expire_idle_awin_jobs() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.expire_idle_awin_jobs() TO service_role;