-- 1. Leads: datos completos
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS national_id text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS interest_type text,
  ADD COLUMN IF NOT EXISTS preferred_contact text,
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;

-- 2. Visitas
CREATE TABLE IF NOT EXISTS public.visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  lot_id uuid REFERENCES public.lots(id) ON DELETE SET NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  visitor_name text NOT NULL,
  visitor_email text,
  visitor_phone text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  mode text NOT NULL DEFAULT 'presencial',
  status text NOT NULL DEFAULT 'scheduled',
  outcome text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.visits TO authenticated;
GRANT ALL ON public.visits TO service_role;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their visits" ON public.visits
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_platform_admin())
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_visits_user_sched ON public.visits(user_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_lead ON public.visits(lead_id);

-- 3. Cierres
CREATE TABLE IF NOT EXISTS public.sales_closings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  lot_id uuid REFERENCES public.lots(id) ON DELETE SET NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  buyer_name text NOT NULL,
  buyer_email text,
  buyer_phone text,
  buyer_national_id text,
  sale_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'CLP',
  contract_url text,
  contract_signed_at timestamptz,
  commission_rate numeric NOT NULL DEFAULT 3,
  commission_amount numeric NOT NULL DEFAULT 0,
  referring_agent_id uuid,
  referral_rate numeric,
  status text NOT NULL DEFAULT 'draft',
  closed_at timestamptz,
  commission_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_closings TO authenticated;
GRANT ALL ON public.sales_closings TO service_role;
ALTER TABLE public.sales_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their closings" ON public.sales_closings
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_platform_admin())
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Referring agent can view closings" ON public.sales_closings
  FOR SELECT TO authenticated
  USING (auth.uid() = referring_agent_id);

CREATE TRIGGER update_sales_closings_updated_at BEFORE UPDATE ON public.sales_closings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_closings_user ON public.sales_closings(user_id, created_at DESC);

-- 4. Comision automatica al cerrar
CREATE OR REPLACE FUNCTION public.closing_generate_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission_id uuid;
BEGIN
  NEW.commission_amount := ROUND(COALESCE(NEW.sale_amount,0) * COALESCE(NEW.commission_rate,0) / 100.0);

  IF NEW.status = 'closed' AND COALESCE(OLD.status,'') <> 'closed' THEN
    IF NEW.closed_at IS NULL THEN NEW.closed_at := now(); END IF;
    IF NEW.commission_id IS NULL THEN
      INSERT INTO public.agent_commissions (
        agent_id, reservation_id, lot_id, project_id, listing_id, lead_id,
        sale_amount, commission_rate, commission_amount, status,
        referring_agent_id, referral_rate, referral_amount, referral_status, notes
      ) VALUES (
        NEW.user_id, NEW.reservation_id, NEW.lot_id, NEW.project_id, NEW.listing_id, NEW.lead_id,
        NEW.sale_amount, NEW.commission_rate, NEW.commission_amount, 'pending',
        NEW.referring_agent_id, NEW.referral_rate,
        CASE WHEN NEW.referring_agent_id IS NOT NULL
             THEN ROUND(COALESCE(NEW.sale_amount,0) * COALESCE(NEW.referral_rate,0) / 100.0)
             ELSE NULL END,
        CASE WHEN NEW.referring_agent_id IS NOT NULL THEN 'pending' ELSE NULL END,
        NEW.notes
      ) RETURNING id INTO v_commission_id;
      NEW.commission_id := v_commission_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.closing_generate_commission() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_closing_generate_commission
  BEFORE INSERT OR UPDATE ON public.sales_closings
  FOR EACH ROW EXECUTE FUNCTION public.closing_generate_commission();