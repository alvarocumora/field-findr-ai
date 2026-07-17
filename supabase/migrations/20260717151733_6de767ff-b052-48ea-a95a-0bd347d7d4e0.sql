
-- visit_requests: add WITH CHECK to owner update policy
DROP POLICY IF EXISTS "Listing owners can update visit requests" ON public.visit_requests;
CREATE POLICY "Listing owners can update visit requests"
ON public.visit_requests FOR UPDATE
USING (auth.uid() = listing_owner_id)
WITH CHECK (auth.uid() = listing_owner_id);

-- closing_steps: add WITH CHECK to both ALL policies
DROP POLICY IF EXISTS "Reservation owners manage closing steps" ON public.closing_steps;
CREATE POLICY "Reservation owners manage closing steps"
ON public.closing_steps FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.reservations r
  JOIN public.lots l ON l.id = r.lot_id
  JOIN public.projects p ON p.id = l.project_id
  WHERE r.id = closing_steps.reservation_id AND p.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.reservations r
  JOIN public.lots l ON l.id = r.lot_id
  JOIN public.projects p ON p.id = l.project_id
  WHERE r.id = closing_steps.reservation_id AND p.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Admins manage all closing steps" ON public.closing_steps;
CREATE POLICY "Admins manage all closing steps"
ON public.closing_steps FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- credits: add WITH CHECK to sellers policy
DROP POLICY IF EXISTS "Sellers manage their credits" ON public.credits;
CREATE POLICY "Sellers manage their credits"
ON public.credits FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- messages: restrict UPDATE. Only recipient can mark read; sender can edit their own content. Split into two policies.
DROP POLICY IF EXISTS "Users can update their sent messages" ON public.messages;
CREATE POLICY "Senders can update their own messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can mark messages read"
ON public.messages FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);
