CREATE TABLE public.price_review_items (
  object_id text PRIMARY KEY,
  source text,
  store text,
  title text NOT NULL,
  price numeric NOT NULL,
  median_price numeric,
  peer_count integer NOT NULL DEFAULT 0,
  reason text NOT NULL CHECK (reason IN ('below_minimum', 'below_median')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  detected_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
GRANT SELECT ON public.price_review_items TO authenticated;
GRANT ALL ON public.price_review_items TO service_role;
ALTER TABLE public.price_review_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Administradores leem revisões de preço" ON public.price_review_items
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE OR REPLACE FUNCTION public.patch_catalog_price_review(_updates jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  IF jsonb_typeof(_updates) <> 'array' OR jsonb_array_length(_updates) > 500 THEN
    RAISE EXCEPTION 'Invalid batch';
  END IF;
  UPDATE public.partner_catalog p
  SET record =
    (CASE WHEN u->>'popularity_score' IS NOT NULL
      THEN jsonb_set(p.record, '{popularity_score}', to_jsonb(greatest(0, least(100, (u->>'popularity_score')::numeric))))
      ELSE p.record
    END) ||
    (CASE WHEN u ? 'price_review_status'
      THEN jsonb_build_object(
        'price_review_status', u->>'price_review_status',
        'price_review_reason', u->>'price_review_reason',
        'price_review_median', NULLIF(u->>'price_review_median', '')::numeric,
        'price_review_peer_count', COALESCE(NULLIF(u->>'price_review_peer_count', '')::integer, 0),
        'price_reviewed_at', u->>'price_reviewed_at'
      )
      ELSE '{}'::jsonb
    END)
  FROM jsonb_array_elements(_updates) u
  WHERE p.object_id = u->>'objectID';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.patch_catalog_price_review(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.patch_catalog_price_review(jsonb) TO service_role;