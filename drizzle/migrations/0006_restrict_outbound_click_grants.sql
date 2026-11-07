REVOKE ALL ON public.outbound_clicks FROM anon,authenticated;
GRANT SELECT ON public.outbound_clicks TO authenticated;
GRANT ALL ON public.outbound_clicks TO service_role;
REVOKE ALL ON public.outbound_click_budget FROM anon,authenticated;
GRANT ALL ON public.outbound_click_budget TO service_role;