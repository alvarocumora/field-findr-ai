-- ============ BROKER APPLICATIONS ============
CREATE TABLE public.broker_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  country text NOT NULL DEFAULT 'CL',
  region text,
  city text,
  company_name text,
  tax_id text,
  experience_years integer,
  specialty text,
  socials text,
  motivation text,
  source text,
  invited_by_code text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT broker_applications_status_check CHECK (status IN ('pending','approved','rejected','archived'))
);

GRANT SELECT ON public.broker_applications TO authenticated;
GRANT UPDATE ON public.broker_applications TO authenticated;
GRANT ALL ON public.broker_applications TO service_role;

ALTER TABLE public.broker_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage broker applications"
  ON public.broker_applications FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

CREATE POLICY "Applicants read their own application"
  ON public.broker_applications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_broker_applications_status ON public.broker_applications(status, created_at DESC);

-- ============ BROKER PROFILES ============
CREATE TABLE public.broker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  level text NOT NULL DEFAULT 'starter',
  base_commission_rate numeric NOT NULL DEFAULT 3,
  network_override_rate numeric NOT NULL DEFAULT 0,
  zones text[] NOT NULL DEFAULT '{}',
  bio text,
  avatar_url text,
  phone text,
  email text,
  company_name text,
  invite_code text NOT NULL UNIQUE,
  referred_by uuid,
  is_active boolean NOT NULL DEFAULT true,
  is_public boolean NOT NULL DEFAULT true,
  onboarding_step integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT broker_profiles_level_check CHECK (level IN ('starter','pro','elite','partner'))
);

GRANT SELECT, INSERT, UPDATE ON public.broker_profiles TO authenticated;
GRANT SELECT ON public.broker_profiles TO anon;
GRANT ALL ON public.broker_profiles TO service_role;

ALTER TABLE public.broker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active public broker profiles"
  ON public.broker_profiles FOR SELECT TO anon, authenticated
  USING (is_active AND is_public);

CREATE POLICY "Brokers view their own profile"
  ON public.broker_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY "Brokers update their own profile"
  ON public.broker_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY "Admins insert broker profiles"
  ON public.broker_profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());

CREATE INDEX idx_broker_profiles_active ON public.broker_profiles(is_active, is_public);

-- ============ PROJECT BROKER ASSIGNMENTS ============
CREATE TABLE public.project_broker_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  broker_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  commission_rate numeric NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'pending',
  message text,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pba_status_check CHECK (status IN ('pending','approved','rejected','revoked')),
  CONSTRAINT pba_unique UNIQUE (project_id, broker_id)
);

GRANT SELECT, INSERT, UPDATE ON public.project_broker_assignments TO authenticated;
GRANT ALL ON public.project_broker_assignments TO service_role;

ALTER TABLE public.project_broker_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers and owners read assignments"
  ON public.project_broker_assignments FOR SELECT TO authenticated
  USING (broker_id = auth.uid() OR owner_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY "Owners and admins update assignments"
  ON public.project_broker_assignments FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_platform_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_platform_admin());

CREATE INDEX idx_pba_broker ON public.project_broker_assignments(broker_id, status);
CREATE INDEX idx_pba_owner ON public.project_broker_assignments(owner_id, status);

-- ============ COMMISSION RULES ============
CREATE TABLE public.commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  plan_type text,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  commission_rate numeric NOT NULL DEFAULT 3,
  referral_override_rate numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT commission_rules_scope_check CHECK (scope IN ('default','plan','project'))
);

GRANT SELECT ON public.commission_rules TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.commission_rules TO authenticated;
GRANT ALL ON public.commission_rules TO service_role;

ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read commission rules"
  ON public.commission_rules FOR SELECT TO authenticated USING (is_active);

CREATE POLICY "Admins manage commission rules"
  ON public.commission_rules FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

INSERT INTO public.commission_rules (scope, commission_rate, referral_override_rate, notes)
VALUES ('default', 3, 0.5, 'Comisión base por defecto de la plataforma');

-- ============ updated_at triggers ============
CREATE TRIGGER trg_broker_applications_updated_at BEFORE UPDATE ON public.broker_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_broker_profiles_updated_at BEFORE UPDATE ON public.broker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pba_updated_at BEFORE UPDATE ON public.project_broker_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_commission_rules_updated_at BEFORE UPDATE ON public.commission_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RPC: submit_broker_application (public) ============
CREATE OR REPLACE FUNCTION public.submit_broker_application(
  p_full_name text,
  p_email text,
  p_phone text DEFAULT NULL,
  p_country text DEFAULT 'CL',
  p_region text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_company_name text DEFAULT NULL,
  p_tax_id text DEFAULT NULL,
  p_experience_years integer DEFAULT NULL,
  p_specialty text DEFAULT NULL,
  p_socials text DEFAULT NULL,
  p_motivation text DEFAULT NULL,
  p_source text DEFAULT NULL,
  p_invited_by_code text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF p_full_name IS NULL OR length(trim(p_full_name)) < 2 OR length(p_full_name) > 120 THEN
    RAISE EXCEPTION 'Nombre inválido';
  END IF;
  IF p_email IS NULL OR p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(p_email) > 255 THEN
    RAISE EXCEPTION 'Email inválido';
  END IF;

  INSERT INTO public.broker_applications (
    user_id, full_name, email, phone, country, region, city, company_name, tax_id,
    experience_years, specialty, socials, motivation, source, invited_by_code
  ) VALUES (
    auth.uid(), trim(p_full_name), lower(trim(p_email)), left(coalesce(p_phone,''),40),
    coalesce(p_country,'CL'), p_region, p_city, left(coalesce(p_company_name,''),160), p_tax_id,
    p_experience_years, p_specialty, left(coalesce(p_socials,''),500),
    left(coalesce(p_motivation,''),2000), p_source, p_invited_by_code
  ) RETURNING id INTO v_id;

  RETURN v_id;
END; $$;

REVOKE ALL ON FUNCTION public.submit_broker_application(text,text,text,text,text,text,text,text,integer,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_broker_application(text,text,text,text,text,text,text,text,integer,text,text,text,text,text) TO anon, authenticated;

-- ============ RPC: approve_broker_application (admin) ============
CREATE OR REPLACE FUNCTION public.approve_broker_application(
  p_application_id uuid,
  p_user_id uuid,
  p_level text DEFAULT 'starter',
  p_base_commission_rate numeric DEFAULT 3
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_app public.broker_applications%ROWTYPE;
  v_slug text;
  v_code text;
  v_profile_id uuid;
  v_referrer uuid;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;

  SELECT * INTO v_app FROM public.broker_applications WHERE id = p_application_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Postulación no encontrada'; END IF;

  v_slug := public.project_slugify(v_app.full_name);
  IF v_slug IS NULL OR v_slug = '' THEN v_slug := 'broker'; END IF;
  WHILE EXISTS (SELECT 1 FROM public.broker_profiles WHERE slug = v_slug) LOOP
    v_slug := v_slug || '-' || substr(md5(random()::text), 1, 4);
  END LOOP;

  v_code := 'BK-' || upper(substr(md5(random()::text), 1, 6));
  WHILE EXISTS (SELECT 1 FROM public.broker_profiles WHERE invite_code = v_code) LOOP
    v_code := 'BK-' || upper(substr(md5(random()::text), 1, 6));
  END LOOP;

  IF v_app.invited_by_code IS NOT NULL THEN
    SELECT user_id INTO v_referrer FROM public.broker_profiles WHERE invite_code = v_app.invited_by_code;
  END IF;

  INSERT INTO public.broker_profiles (
    user_id, slug, display_name, level, base_commission_rate, invite_code,
    referred_by, phone, email, company_name
  ) VALUES (
    p_user_id, v_slug, v_app.full_name, coalesce(p_level,'starter'),
    coalesce(p_base_commission_rate,3), v_code, v_referrer, v_app.phone, v_app.email, v_app.company_name
  )
  ON CONFLICT (user_id) DO UPDATE SET is_active = true, updated_at = now()
  RETURNING id INTO v_profile_id;

  INSERT INTO public.user_roles (user_id, role) VALUES (p_user_id, 'agent')
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.broker_applications
     SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), user_id = p_user_id
   WHERE id = p_application_id;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), 'broker_application_approved', 'broker_applications', p_application_id::text,
          jsonb_build_object('broker_user_id', p_user_id, 'level', p_level));

  RETURN v_profile_id;
END; $$;

REVOKE ALL ON FUNCTION public.approve_broker_application(uuid,uuid,text,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_broker_application(uuid,uuid,text,numeric) TO authenticated;

-- ============ RPC: request_project_assignment (broker) ============
CREATE OR REPLACE FUNCTION public.request_project_assignment(
  p_project_id uuid,
  p_message text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid; v_id uuid; v_rate numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Requiere sesión'; END IF;

  SELECT user_id INTO v_owner FROM public.projects WHERE id = p_project_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Proyecto no encontrado'; END IF;
  IF v_owner = auth.uid() THEN RAISE EXCEPTION 'Ya eres dueño de este proyecto'; END IF;

  SELECT commission_rate INTO v_rate FROM public.commission_rules
   WHERE is_active AND scope = 'project' AND project_id = p_project_id LIMIT 1;
  IF v_rate IS NULL THEN
    SELECT commission_rate INTO v_rate FROM public.commission_rules
     WHERE is_active AND scope = 'default' LIMIT 1;
  END IF;

  INSERT INTO public.project_broker_assignments (project_id, broker_id, owner_id, commission_rate, message)
  VALUES (p_project_id, auth.uid(), v_owner, coalesce(v_rate, 3), left(coalesce(p_message,''), 1000))
  ON CONFLICT (project_id, broker_id) DO UPDATE SET status = 'pending', updated_at = now()
  RETURNING id INTO v_id;

  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (v_owner, 'broker_request', 'Nueva solicitud de broker',
          'Un broker solicitó vender tu proyecto.', '/asesor/projects');

  RETURN v_id;
END; $$;

REVOKE ALL ON FUNCTION public.request_project_assignment(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_project_assignment(uuid,text) TO authenticated;

-- ============ RPC: admin_update_commission ============
CREATE OR REPLACE FUNCTION public.admin_update_commission(
  p_commission_id uuid,
  p_commission_rate numeric DEFAULT NULL,
  p_commission_amount numeric DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_before jsonb;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  IF p_status IS NOT NULL AND p_status NOT IN ('pending','approved','paid','cancelled') THEN
    RAISE EXCEPTION 'Estado inválido';
  END IF;

  SELECT to_jsonb(c) INTO v_before FROM public.agent_commissions c WHERE c.id = p_commission_id;
  IF v_before IS NULL THEN RAISE EXCEPTION 'Comisión no encontrada'; END IF;

  UPDATE public.agent_commissions SET
    commission_rate = coalesce(p_commission_rate, commission_rate),
    commission_amount = coalesce(p_commission_amount, commission_amount),
    status = coalesce(p_status, status),
    paid_at = CASE WHEN p_status = 'paid' THEN coalesce(paid_at, now()) ELSE paid_at END,
    notes = coalesce(p_notes, notes),
    updated_at = now()
  WHERE id = p_commission_id;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), 'commission_updated', 'agent_commissions', p_commission_id::text,
          jsonb_build_object('before', v_before, 'rate', p_commission_rate,
                             'amount', p_commission_amount, 'status', p_status));

  RETURN p_commission_id;
END; $$;

REVOKE ALL ON FUNCTION public.admin_update_commission(uuid,numeric,numeric,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_commission(uuid,numeric,numeric,text,text) TO authenticated;

-- ============ RPC: admin_register_manual_sale ============
CREATE OR REPLACE FUNCTION public.admin_register_manual_sale(
  p_agent_id uuid,
  p_sale_amount numeric,
  p_commission_rate numeric DEFAULT 3,
  p_project_id uuid DEFAULT NULL,
  p_lot_id uuid DEFAULT NULL,
  p_listing_id uuid DEFAULT NULL,
  p_referring_agent_id uuid DEFAULT NULL,
  p_referral_rate numeric DEFAULT 0,
  p_notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_amount numeric; v_ref numeric;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  IF p_sale_amount IS NULL OR p_sale_amount <= 0 THEN RAISE EXCEPTION 'Monto de venta inválido'; END IF;
  IF p_agent_id IS NULL THEN RAISE EXCEPTION 'Debes indicar el agente'; END IF;

  v_amount := round(p_sale_amount * coalesce(p_commission_rate, 3) / 100.0);
  v_ref := round(p_sale_amount * coalesce(p_referral_rate, 0) / 100.0);

  INSERT INTO public.agent_commissions (
    agent_id, project_id, lot_id, listing_id, sale_amount, commission_rate, commission_amount,
    status, notes, referring_agent_id, referral_rate, referral_amount, referral_status
  ) VALUES (
    p_agent_id, p_project_id, p_lot_id, p_listing_id, p_sale_amount,
    coalesce(p_commission_rate, 3), v_amount, 'pending', p_notes,
    p_referring_agent_id, coalesce(p_referral_rate, 0), v_ref,
    CASE WHEN p_referring_agent_id IS NULL THEN 'none' ELSE 'pending' END
  ) RETURNING id INTO v_id;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), 'manual_sale_registered', 'agent_commissions', v_id::text,
          jsonb_build_object('agent_id', p_agent_id, 'sale_amount', p_sale_amount));

  RETURN v_id;
END; $$;

REVOKE ALL ON FUNCTION public.admin_register_manual_sale(uuid,numeric,numeric,uuid,uuid,uuid,uuid,numeric,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_register_manual_sale(uuid,numeric,numeric,uuid,uuid,uuid,uuid,numeric,text) TO authenticated;

-- ============ RPC: admin_void_sale ============
CREATE OR REPLACE FUNCTION public.admin_void_sale(
  p_commission_id uuid,
  p_reason text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 3 THEN RAISE EXCEPTION 'Indica un motivo'; END IF;

  UPDATE public.agent_commissions
     SET status = 'cancelled', referral_status = 'cancelled',
         notes = coalesce(notes, '') || E'\n[Anulada] ' || p_reason,
         updated_at = now()
   WHERE id = p_commission_id;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), 'sale_voided', 'agent_commissions', p_commission_id::text,
          jsonb_build_object('reason', p_reason));

  RETURN p_commission_id;
END; $$;

REVOKE ALL ON FUNCTION public.admin_void_sale(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_void_sale(uuid,text) TO authenticated;

-- ============ RPC: get_broker_ranking (public) ============
CREATE OR REPLACE FUNCTION public.get_broker_ranking(p_limit integer DEFAULT 20)
RETURNS TABLE(
  slug text, display_name text, company_name text, avatar_url text, level text,
  zones text[], bio text, sales_count bigint, projects_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT bp.slug, bp.display_name, bp.company_name, bp.avatar_url, bp.level,
         bp.zones, bp.bio,
         (SELECT count(*) FROM public.agent_commissions ac
           WHERE ac.agent_id = bp.user_id AND ac.status <> 'cancelled') AS sales_count,
         (SELECT count(*) FROM public.project_broker_assignments pa
           WHERE pa.broker_id = bp.user_id AND pa.status = 'approved') AS projects_count
    FROM public.broker_profiles bp
   WHERE bp.is_active AND bp.is_public
   ORDER BY sales_count DESC, projects_count DESC, bp.created_at ASC
   LIMIT least(coalesce(p_limit, 20), 100);
$$;

REVOKE ALL ON FUNCTION public.get_broker_ranking(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_broker_ranking(integer) TO anon, authenticated;