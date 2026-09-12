CREATE OR REPLACE FUNCTION public.configure_algolia_sync_job(_cron_secret text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault, cron, net
AS $$
DECLARE
  _secret_id uuid;
  _job_id bigint;
BEGIN
  IF _cron_secret IS NULL OR length(_cron_secret) < 32 THEN
    RAISE EXCEPTION 'Invalid cron secret';
  END IF;

  SELECT id INTO _secret_id FROM vault.secrets WHERE name = 'LOVABLE_CRON_SECRET' LIMIT 1;
  IF _secret_id IS NULL THEN
    PERFORM vault.create_secret(_cron_secret, 'LOVABLE_CRON_SECRET', 'Managed daily Algolia synchronization');
  ELSE
    PERFORM vault.update_secret(_secret_id, _cron_secret, 'LOVABLE_CRON_SECRET', 'Managed daily Algolia synchronization');
  END IF;

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'sync-algolia-daily';
  SELECT cron.schedule(
    'sync-algolia-daily',
    '0 4 * * *',
    $job$
    SELECT net.http_post(
      url := 'https://project--257b71df-dcb0-431d-b3aa-761b624fd528.lovable.app/api/public/hooks/sync-algolia',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'LOVABLE_CRON_SECRET' LIMIT 1)
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 300000
    );
    $job$
  ) INTO _job_id;

  RETURN _job_id;
END;
$$;
REVOKE ALL ON FUNCTION public.configure_algolia_sync_job(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.configure_algolia_sync_job(text) TO service_role;