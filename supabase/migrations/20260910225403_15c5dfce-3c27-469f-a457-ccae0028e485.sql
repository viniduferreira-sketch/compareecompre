ALTER TABLE public.offers RENAME COLUMN store TO store_name;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS external_id text;
CREATE UNIQUE INDEX IF NOT EXISTS offers_product_store_idx ON public.offers (product_id, store_name);