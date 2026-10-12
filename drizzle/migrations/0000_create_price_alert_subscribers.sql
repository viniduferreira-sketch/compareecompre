CREATE TABLE public.price_alert_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'homepage_price_alert',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT price_alert_email_length CHECK (char_length(email) BETWEEN 3 AND 254),
  CONSTRAINT price_alert_email_normalized CHECK (email = lower(btrim(email)))
);
GRANT ALL ON public.price_alert_subscribers TO service_role;
REVOKE ALL ON public.price_alert_subscribers FROM anon, authenticated;
ALTER TABLE public.price_alert_subscribers ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.price_alert_subscribers IS 'Private email interest registrations for future personalized price alerts. Only validated server-side intake may write; no public subscriber access.';