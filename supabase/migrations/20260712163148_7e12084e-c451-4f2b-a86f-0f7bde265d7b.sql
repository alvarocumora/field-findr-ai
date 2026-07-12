
-- 1) lots: hide buyer PII from anon/authenticated via column-level GRANTs.
REVOKE SELECT ON public.lots FROM anon, authenticated;
GRANT SELECT (
  id, project_id, user_id, lot_number, name, description, area, price,
  price_per_sqm, status, latitude, longitude, polygon, features,
  reservation_date, sale_date, created_at, updated_at,
  elevation_avg, slope_category, images, listing_id
) ON public.lots TO anon, authenticated;
GRANT SELECT ON public.lots TO service_role;

-- 2) cached_listings: remove public read entirely (only edge functions use it).
DROP POLICY IF EXISTS "Public read cached listings" ON public.cached_listings;
REVOKE SELECT ON public.cached_listings FROM anon, authenticated;

-- 3) tasaciones_publicadas: replace public policy with SECURITY DEFINER RPCs.
DROP POLICY IF EXISTS "Anyone can view published appraisals" ON public.tasaciones_publicadas;
REVOKE SELECT ON public.tasaciones_publicadas FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_tasacion_by_id(p_id uuid)
RETURNS SETOF public.tasaciones_publicadas
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.tasaciones_publicadas WHERE id = p_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_tasacion_by_listing(p_listing_id uuid)
RETURNS TABLE (
  id uuid,
  listing_id uuid,
  valor_uf numeric,
  valor_clp numeric,
  fecha_emision text,
  tasador_nombre text,
  version integer,
  revoked_at timestamptz,
  blockchain_anchor jsonb,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, listing_id, valor_uf, valor_clp, fecha_emision, tasador_nombre,
         version, revoked_at, blockchain_anchor, created_at
  FROM public.tasaciones_publicadas
  WHERE listing_id = p_listing_id
    AND revoked_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_tasacion_by_id(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_tasacion_by_listing(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_tasacion_by_id(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tasacion_by_listing(uuid) TO anon, authenticated;

-- 4) Revoke EXECUTE from anon/authenticated on trigger-only / internal
--    SECURITY DEFINER functions so they cannot be invoked as RPCs.
DO $$
DECLARE
  fn text;
  trigger_fns text[] := ARRAY[
    'calculate_lead_score()',
    'create_closing_steps_on_paid()',
    'enqueue_listing_approval()',
    'enqueue_project_approval()',
    'handle_new_user()',
    'handle_reservation_status_change()',
    'notify_doc_deadline_approaching()',
    'notify_on_new_lead()',
    'notify_on_new_reservation()',
    'notify_on_reservation_paid()',
    'notify_on_visit_request()',
    'record_price_on_insert()',
    'record_price_on_update()',
    'sync_listing_from_lot()',
    'sync_listing_status_from_approval()',
    'sync_project_status_from_approval()',
    'update_next_payment_date()',
    'update_project_lot_counts()',
    'update_updated_at_column()',
    'mark_overdue_payments()',
    'expire_stale_reservations()'
  ];
BEGIN
  FOREACH fn IN ARRAY trigger_fns LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'skip missing function %', fn;
    END;
  END LOOP;
END $$;
