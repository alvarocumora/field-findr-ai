-- Visión total del super administrador de plataforma.
-- Solo lectura salvo donde la gestión lo exige (organizaciones, suscripciones).

CREATE POLICY "Platform admins view all organizations"
  ON public.organizations FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins manage organizations"
  ON public.organizations FOR UPDATE TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins view all org members"
  ON public.organization_members FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins manage org members"
  ON public.organization_members FOR ALL TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins view all projects"
  ON public.projects FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins view all leads"
  ON public.leads FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins view all visits"
  ON public.visits FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins view all reservations"
  ON public.reservations FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins view all closings"
  ON public.sales_closings FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins view all payments"
  ON public.payments FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins update subscriptions"
  ON public.subscriptions FOR UPDATE TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins view all broker profiles"
  ON public.broker_profiles FOR SELECT TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins view all lots"
  ON public.lots FOR SELECT TO authenticated
  USING (public.is_platform_admin());