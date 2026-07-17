
-- 1) Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated/PUBLIC
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_reservation_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_price_on_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_price_on_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_closing_steps_on_paid() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_next_payment_date() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.calculate_lead_score() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_new_lead() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_doc_deadline_approaching() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_visit_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_new_reservation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_reservation_paid() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_listing_status_from_approval() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_project_status_from_approval() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_listing_from_lot() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_project_approval() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_listing_approval() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_project_lot_counts() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_commercial_plan_leads_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_overdue_payments() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_stale_reservations() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_featured_projects() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.system_activate_featured(uuid, integer, text) FROM PUBLIC, anon, authenticated;

-- 2) visit_requests: add requester_user_id and require match with auth.uid()
ALTER TABLE public.visit_requests
  ADD COLUMN IF NOT EXISTS requester_user_id uuid;

UPDATE public.visit_requests SET requester_user_id = listing_owner_id WHERE requester_user_id IS NULL;

ALTER TABLE public.visit_requests
  ALTER COLUMN requester_user_id SET NOT NULL,
  ALTER COLUMN requester_user_id SET DEFAULT auth.uid();

DROP POLICY IF EXISTS "Authenticated users can create visit requests" ON public.visit_requests;
CREATE POLICY "Authenticated users can create visit requests"
ON public.visit_requests
FOR INSERT
TO authenticated
WITH CHECK (
  requester_user_id = auth.uid()
  AND listing_owner_id = (SELECT user_id FROM public.listings WHERE id = visit_requests.listing_id)
);

-- Allow requesters to see their own submitted requests
DROP POLICY IF EXISTS "Requesters can view their own visit requests" ON public.visit_requests;
CREATE POLICY "Requesters can view their own visit requests"
ON public.visit_requests
FOR SELECT
TO authenticated
USING (requester_user_id = auth.uid());

-- 3) commercial_plan_leads: replace WITH CHECK (true) with minimal validation
DROP POLICY IF EXISTS "Public can create commercial plan leads" ON public.commercial_plan_leads;
CREATE POLICY "Public can create commercial plan leads"
ON public.commercial_plan_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  contact_name IS NOT NULL
  AND length(btrim(contact_name)) BETWEEN 2 AND 200
);
