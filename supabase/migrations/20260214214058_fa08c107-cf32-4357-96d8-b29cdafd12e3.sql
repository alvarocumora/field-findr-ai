
-- Fix permissive INSERT policy - require authentication
DROP POLICY "Anyone authenticated can create visit requests" ON public.visit_requests;
CREATE POLICY "Authenticated users can create visit requests"
  ON public.visit_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);
