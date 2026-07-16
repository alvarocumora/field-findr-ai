
-- Blanket revoke on all SECURITY DEFINER functions in public schema
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
      r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- Public RPCs (unauthenticated marketplace surfaces)
GRANT EXECUTE ON FUNCTION public.get_public_lots(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_design(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_agency_by_slug(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_lead(text, text, text, text, text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_tasacion_by_hash(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tasacion_by_id(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tasacion_by_listing(uuid) TO anon, authenticated;

-- Authenticated-only RPCs
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.extend_reservation(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_lot_prices(uuid, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_sale(uuid, numeric, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_sale(uuid, numeric, numeric, text, uuid, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_referral_lead(uuid, text, text, text, text, text, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_commission_paid(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_referral_paid(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_project_featured(uuid, boolean, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_owner_lot_buyer(uuid) TO authenticated;
