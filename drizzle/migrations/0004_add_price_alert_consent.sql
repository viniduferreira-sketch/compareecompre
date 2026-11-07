ALTER TABLE public.price_alert_subscribers
  ADD COLUMN consent_at timestamptz NULL,
  ADD COLUMN consent_text_version text NULL;