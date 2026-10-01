CREATE TABLE IF NOT EXISTS public.buyer_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_name text NOT NULL, customer_email text, customer_phone text, region text, commune text,
  budget_min numeric CHECK (budget_min IS NULL OR budget_min >= 0),
  budget_max numeric CHECK (budget_max IS NULL OR budget_max >= 0),
  area_min numeric CHECK (area_min IS NULL OR area_min >= 0),
  area_max numeric CHECK (area_max IS NULL OR area_max >= 0),
  property_type text, purpose text, financing text,
  urgency text NOT NULL DEFAULT 'normal' CHECK (urgency IN ('immediate','30_days','90_days','exploring','normal')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','matched','converted','archived')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max),
  CHECK (area_min IS NULL OR area_max IS NULL OR area_min <= area_max)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buyer_requirements TO authenticated;
GRANT ALL ON public.buyer_requirements TO service_role;
CREATE INDEX IF NOT EXISTS buyer_requirements_broker_created_idx ON public.buyer_requirements(broker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS buyer_requirements_location_idx ON public.buyer_requirements(region, commune) WHERE status = 'active';
ALTER TABLE public.buyer_requirements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Team reads buyer requirements" ON public.buyer_requirements;
CREATE POLICY "Team reads buyer requirements" ON public.buyer_requirements FOR SELECT TO authenticated USING (broker_id = auth.uid() OR public.same_organization(broker_id));
DROP POLICY IF EXISTS "Brokers create own buyer requirements" ON public.buyer_requirements;
CREATE POLICY "Brokers create own buyer requirements" ON public.buyer_requirements FOR INSERT TO authenticated WITH CHECK (broker_id = auth.uid());
DROP POLICY IF EXISTS "Brokers update own buyer requirements" ON public.buyer_requirements;
CREATE POLICY "Brokers update own buyer requirements" ON public.buyer_requirements FOR UPDATE TO authenticated USING (broker_id = auth.uid()) WITH CHECK (broker_id = auth.uid());
DROP POLICY IF EXISTS "Brokers delete own buyer requirements" ON public.buyer_requirements;
CREATE POLICY "Brokers delete own buyer requirements" ON public.buyer_requirements FOR DELETE TO authenticated USING (broker_id = auth.uid());

CREATE OR REPLACE FUNCTION public.match_buyer_requirement(p_requirement_id uuid, p_limit integer DEFAULT 20)
RETURNS TABLE(lot_id uuid, project_id uuid, project_name text, lot_name text, lot_number text, area numeric, price numeric, region text, commune text, score integer, criteria jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE req public.buyer_requirements%ROWTYPE;
BEGIN
  SELECT * INTO req FROM public.buyer_requirements br
  WHERE br.id = p_requirement_id AND (br.broker_id = auth.uid() OR public.same_organization(br.broker_id));
  IF NOT FOUND THEN RAISE EXCEPTION 'Requerimiento no encontrado o sin acceso'; END IF;
  RETURN QUERY
  SELECT l.id, l.project_id, p.name, l.name, l.lot_number::text, l.area, l.price, p.region, p.city,
    (CASE WHEN req.region IS NULL OR lower(p.region) = lower(req.region) THEN 25 ELSE 0 END +
     CASE WHEN req.commune IS NULL OR lower(p.city) = lower(req.commune) THEN 20 ELSE 0 END +
     CASE WHEN req.budget_max IS NULL OR l.price <= req.budget_max THEN 30 ELSE 0 END +
     CASE WHEN req.budget_min IS NULL OR l.price >= req.budget_min THEN 5 ELSE 0 END +
     CASE WHEN req.area_min IS NULL OR l.area >= req.area_min THEN 15 ELSE 0 END +
     CASE WHEN req.area_max IS NULL OR l.area <= req.area_max THEN 5 ELSE 0 END)::integer,
    jsonb_build_object('region', req.region IS NULL OR lower(p.region) = lower(req.region),
      'commune', req.commune IS NULL OR lower(p.city) = lower(req.commune),
      'budget_max', req.budget_max IS NULL OR l.price <= req.budget_max,
      'budget_min', req.budget_min IS NULL OR l.price >= req.budget_min,
      'area_min', req.area_min IS NULL OR l.area >= req.area_min,
      'area_max', req.area_max IS NULL OR l.area <= req.area_max)
  FROM public.lots l JOIN public.projects p ON p.id = l.project_id
  WHERE l.status = 'available' AND l.price IS NOT NULL AND l.area IS NOT NULL
  ORDER BY 10 DESC, l.price ASC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
END; $$;
REVOKE ALL ON FUNCTION public.match_buyer_requirement(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_buyer_requirement(uuid, integer) TO authenticated;
DROP TRIGGER IF EXISTS trg_buyer_requirements_updated_at ON public.buyer_requirements;
CREATE TRIGGER trg_buyer_requirements_updated_at BEFORE UPDATE ON public.buyer_requirements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.agent_commissions
  ADD COLUMN IF NOT EXISTS originator_agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS closing_agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
UPDATE public.agent_commissions
SET originator_agent_id = COALESCE(originator_agent_id, referring_agent_id, agent_id),
    closing_agent_id = COALESCE(closing_agent_id, agent_id),
    status = CASE WHEN status = 'pending' THEN 'earned' ELSE status END
WHERE originator_agent_id IS NULL OR closing_agent_id IS NULL OR status = 'pending';
ALTER TABLE public.agent_commissions ALTER COLUMN status SET DEFAULT 'potential', DROP CONSTRAINT IF EXISTS agent_commissions_status_check;
ALTER TABLE public.agent_commissions ADD CONSTRAINT agent_commissions_status_check CHECK (status IN ('potential','reserved','earned','approved','paid','cancelled')) NOT VALID;
CREATE INDEX IF NOT EXISTS agent_commissions_originator_idx ON public.agent_commissions(originator_agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_commissions_closer_idx ON public.agent_commissions(closing_agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.commission_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid NOT NULL REFERENCES public.agent_commissions(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL, from_status text, to_status text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.commission_events TO authenticated;
GRANT ALL ON public.commission_events TO service_role;
CREATE INDEX IF NOT EXISTS commission_events_commission_created_idx ON public.commission_events(commission_id, created_at DESC);
ALTER TABLE public.commission_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants read commission events" ON public.commission_events;
CREATE POLICY "Participants read commission events" ON public.commission_events FOR SELECT TO authenticated
  USING (public.is_platform_admin() OR EXISTS (SELECT 1 FROM public.agent_commissions c WHERE c.id = commission_id AND auth.uid() IN (c.agent_id, c.referring_agent_id, c.originator_agent_id, c.closing_agent_id)));

CREATE OR REPLACE FUNCTION public.normalize_commission_ledger() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'pending' THEN NEW.status := 'earned'; END IF;
  NEW.originator_agent_id := COALESCE(NEW.originator_agent_id, NEW.referring_agent_id, NEW.agent_id);
  NEW.closing_agent_id := COALESCE(NEW.closing_agent_id, NEW.agent_id);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_normalize_commission_ledger ON public.agent_commissions;
CREATE TRIGGER trg_normalize_commission_ledger BEFORE INSERT OR UPDATE ON public.agent_commissions FOR EACH ROW EXECUTE FUNCTION public.normalize_commission_ledger();

CREATE OR REPLACE FUNCTION public.record_commission_event() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.commission_events (commission_id, actor_id, event_type, from_status, to_status, details)
    VALUES (NEW.id, auth.uid(), 'created', NULL, NEW.status, jsonb_build_object('sale_amount', NEW.sale_amount, 'commission_amount', NEW.commission_amount, 'originator_agent_id', NEW.originator_agent_id, 'closing_agent_id', NEW.closing_agent_id));
  ELSIF OLD.status IS DISTINCT FROM NEW.status OR OLD.commission_amount IS DISTINCT FROM NEW.commission_amount OR OLD.commission_rate IS DISTINCT FROM NEW.commission_rate OR OLD.originator_agent_id IS DISTINCT FROM NEW.originator_agent_id OR OLD.closing_agent_id IS DISTINCT FROM NEW.closing_agent_id THEN
    INSERT INTO public.commission_events (commission_id, actor_id, event_type, from_status, to_status, details)
    VALUES (NEW.id, auth.uid(), CASE WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status_changed' ELSE 'adjusted' END, OLD.status, NEW.status,
      jsonb_build_object('old_rate', OLD.commission_rate, 'new_rate', NEW.commission_rate, 'old_amount', OLD.commission_amount, 'new_amount', NEW.commission_amount, 'originator_agent_id', NEW.originator_agent_id, 'closing_agent_id', NEW.closing_agent_id));
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_record_commission_event ON public.agent_commissions;
CREATE TRIGGER trg_record_commission_event AFTER INSERT OR UPDATE ON public.agent_commissions FOR EACH ROW EXECUTE FUNCTION public.record_commission_event();

INSERT INTO public.commission_events (commission_id, actor_id, event_type, from_status, to_status, details, created_at)
SELECT c.id, NULL, 'migrated', NULL, c.status, jsonb_build_object('sale_amount', c.sale_amount, 'commission_amount', c.commission_amount, 'originator_agent_id', c.originator_agent_id, 'closing_agent_id', c.closing_agent_id), c.created_at
FROM public.agent_commissions c WHERE NOT EXISTS (SELECT 1 FROM public.commission_events e WHERE e.commission_id = c.id);

CREATE OR REPLACE FUNCTION public.admin_update_commission(p_commission_id uuid, p_commission_rate numeric DEFAULT NULL, p_commission_amount numeric DEFAULT NULL, p_status text DEFAULT NULL, p_notes text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_before jsonb; v_current_status text; v_allowed boolean;
BEGIN
  IF NOT public.is_platform_admin() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  IF p_status IS NOT NULL AND p_status NOT IN ('potential','reserved','earned','approved','paid','cancelled') THEN RAISE EXCEPTION 'Estado inválido'; END IF;
  SELECT to_jsonb(c), c.status INTO v_before, v_current_status FROM public.agent_commissions c WHERE c.id = p_commission_id FOR UPDATE;
  IF v_before IS NULL THEN RAISE EXCEPTION 'Comisión no encontrada'; END IF;
  IF p_status IS NOT NULL AND p_status <> v_current_status THEN
    v_allowed := p_status = 'cancelled'
      OR (v_current_status = 'potential' AND p_status = 'reserved')
      OR (v_current_status = 'reserved' AND p_status = 'earned')
      OR (v_current_status = 'earned' AND p_status = 'approved')
      OR (v_current_status = 'approved' AND p_status = 'paid');
    IF NOT v_allowed THEN RAISE EXCEPTION 'Transición inválida: % → %', v_current_status, p_status; END IF;
  END IF;
  UPDATE public.agent_commissions SET
    commission_rate = COALESCE(p_commission_rate, commission_rate),
    commission_amount = COALESCE(p_commission_amount, commission_amount),
    status = COALESCE(p_status, status),
    paid_at = CASE WHEN p_status = 'paid' THEN COALESCE(paid_at, now()) ELSE paid_at END,
    notes = COALESCE(p_notes, notes), updated_at = now()
  WHERE id = p_commission_id;
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), 'commission_updated', 'agent_commissions', p_commission_id::text, jsonb_build_object('before', v_before, 'rate', p_commission_rate, 'amount', p_commission_amount, 'status', p_status));
  RETURN p_commission_id;
END; $$;
REVOKE ALL ON FUNCTION public.admin_update_commission(uuid,numeric,numeric,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_commission(uuid,numeric,numeric,text,text) TO authenticated;