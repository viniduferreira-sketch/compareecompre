CREATE OR REPLACE FUNCTION public.set_awin_quality_mark(_ids text[], _reason text, _mark boolean)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF _mark THEN
    UPDATE partner_catalog SET record = record || jsonb_build_object('quality_status', 'rejected', 'quality_reason', _reason, 'quality_marked_at', now())
    WHERE source = 'awin' AND object_id = ANY(_ids);
  ELSE
    UPDATE partner_catalog SET record = record - 'quality_status' - 'quality_reason' - 'quality_marked_at'
    WHERE source = 'awin' AND object_id = ANY(_ids) AND record->>'quality_reason' = _reason;
  END IF;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.set_awin_quality_mark(text[], text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_awin_quality_mark(text[], text, boolean) TO service_role;