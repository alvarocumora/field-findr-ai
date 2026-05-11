
-- 1. Audit logs: restrict INSERT to admins only (service role bypasses RLS for system writes)
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Notifications: drop permissive insert; trigger functions are SECURITY DEFINER and bypass RLS
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- 3. Price history: drop permissive insert; populated exclusively via SECURITY DEFINER triggers
DROP POLICY IF EXISTS "System can insert price history" ON public.price_history;

-- 4. Visit requests: prevent spoofing of listing_owner_id
DROP POLICY IF EXISTS "Authenticated users can create visit requests" ON public.visit_requests;
CREATE POLICY "Authenticated users can create visit requests"
  ON public.visit_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    listing_owner_id = (SELECT user_id FROM public.listings WHERE id = listing_id)
  );
