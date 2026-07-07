
-- Revoke EXECUTE from anon/authenticated/PUBLIC on trigger-only SECURITY DEFINER functions.
-- Triggers run with definer privileges regardless of grants.
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'handle_reservation_status_change()',
    'record_price_on_update()',
    'record_price_on_insert()',
    'create_closing_steps_on_paid()',
    'update_next_payment_date()',
    'calculate_lead_score()',
    'notify_on_new_lead()',
    'update_updated_at_column()',
    'notify_doc_deadline_approaching()',
    'notify_on_visit_request()',
    'handle_new_user()',
    'notify_on_new_reservation()',
    'sync_listing_status_from_approval()',
    'enqueue_listing_approval()',
    'update_project_lot_counts()',
    'notify_on_reservation_paid()',
    'mark_overdue_payments()',
    'expire_stale_reservations()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;

-- RPCs invoked from the client: restrict to authenticated only (remove anon + PUBLIC).
REVOKE ALL ON FUNCTION public.extend_reservation(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.extend_reservation(uuid, integer) TO authenticated;

REVOKE ALL ON FUNCTION public.mark_commission_paid(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_commission_paid(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.register_sale(uuid, numeric, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_sale(uuid, numeric, numeric, text) TO authenticated;

REVOKE ALL ON FUNCTION public.adjust_lot_prices(uuid, text, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_lot_prices(uuid, text, numeric, text) TO authenticated;

-- has_role is used inside RLS policies. Keep executable for authenticated; revoke from anon/PUBLIC.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- Publicly reachable lookups (intentional): keep anon+authenticated.
REVOKE ALL ON FUNCTION public.get_shared_design(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_design(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.find_tasacion_by_hash(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_tasacion_by_hash(text) TO anon, authenticated;
