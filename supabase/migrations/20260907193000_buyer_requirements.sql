-- P5 Buyer Demand — structured requirements and explainable deterministic matching.

CREATE TABLE IF NOT EXISTS public.buyer_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  region text,
  commune text,
  budget_min numeric CHECK (budget_min IS NULL OR budget_min >= 0),
  budget_max numeric CHECK (budget_max IS NULL OR budget_max >= 0),
  area_min numeric CHECK (area_min IS NULL OR area_min >= 0),
  area_max numeric CHECK (area_max IS NULL OR area_max >= 0),
  property_type text,
  purpose text,
  financing text,
  urgency text NOT NULL DEFAULT 'normal'
    CHECK (urgency IN ('immediate','30_days','90_days','exploring','normal')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','matched','converted','archived')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max),
  CHECK (area_min IS NULL OR area_max IS NULL OR area_min <= area_max)
);

CREATE INDEX IF NOT EXISTS buyer_requirements_broker_created_idx
  ON public.buyer_requirements(broker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS buyer_requirements_location_idx
  ON public.buyer_requirements(region, commune) WHERE status = 'active';

ALTER TABLE public.buyer_requirements ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buyer_requirements TO authenticated;
GRANT ALL ON public.buyer_requirements TO service_role;

DROP POLICY IF EXISTS "Team reads buyer requirements" ON public.buyer_requirements;
CREATE POLICY "Team reads buyer requirements"
  ON public.buyer_requirements FOR SELECT TO authenticated
  USING (broker_id = auth.uid() OR public.same_organization(broker_id));

DROP POLICY IF EXISTS "Brokers create own buyer requirements" ON public.buyer_requirements;
CREATE POLICY "Brokers create own buyer requirements"
  ON public.buyer_requirements FOR INSERT TO authenticated
  WITH CHECK (broker_id = auth.uid());

DROP POLICY IF EXISTS "Brokers update own buyer requirements" ON public.buyer_requirements;
CREATE POLICY "Brokers update own buyer requirements"
  ON public.buyer_requirements FOR UPDATE TO authenticated
  USING (broker_id = auth.uid())
  WITH CHECK (broker_id = auth.uid());

DROP POLICY IF EXISTS "Brokers delete own buyer requirements" ON public.buyer_requirements;
CREATE POLICY "Brokers delete own buyer requirements"
  ON public.buyer_requirements FOR DELETE TO authenticated
  USING (broker_id = auth.uid());

CREATE OR REPLACE FUNCTION public.match_buyer_requirement(
  p_requirement_id uuid,
  p_limit integer DEFAULT 20
)
RETURNS TABLE(
  lot_id uuid,
  project_id uuid,
  project_name text,
  lot_name text,
  lot_number text,
  area numeric,
  price numeric,
  region text,
  commune text,
  score integer,
  criteria jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req public.buyer_requirements%ROWTYPE;
BEGIN
  SELECT * INTO req
  FROM public.buyer_requirements br
  WHERE br.id = p_requirement_id
    AND (br.broker_id = auth.uid() OR public.same_organization(br.broker_id));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Requerimiento no encontrado o sin acceso';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.project_id,
    p.name,
    l.name,
    l.lot_number::text,
    l.area,
    l.price,
    p.region,
    p.city,
    (
      CASE WHEN req.region IS NULL OR lower(p.region) = lower(req.region) THEN 25 ELSE 0 END +
      CASE WHEN req.commune IS NULL OR lower(p.city) = lower(req.commune) THEN 20 ELSE 0 END +
      CASE WHEN req.budget_max IS NULL OR l.price <= req.budget_max THEN 30 ELSE 0 END +
      CASE WHEN req.budget_min IS NULL OR l.price >= req.budget_min THEN 5 ELSE 0 END +
      CASE WHEN req.area_min IS NULL OR l.area >= req.area_min THEN 15 ELSE 0 END +
      CASE WHEN req.area_max IS NULL OR l.area <= req.area_max THEN 5 ELSE 0 END
    )::integer,
    jsonb_build_object(
      'region', req.region IS NULL OR lower(p.region) = lower(req.region),
      'commune', req.commune IS NULL OR lower(p.city) = lower(req.commune),
      'budget_max', req.budget_max IS NULL OR l.price <= req.budget_max,
      'budget_min', req.budget_min IS NULL OR l.price >= req.budget_min,
      'area_min', req.area_min IS NULL OR l.area >= req.area_min,
      'area_max', req.area_max IS NULL OR l.area <= req.area_max
    )
  FROM public.lots l
  JOIN public.projects p ON p.id = l.project_id
  WHERE l.status = 'available'
    AND l.price IS NOT NULL
    AND l.area IS NOT NULL
  ORDER BY 10 DESC, l.price ASC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
END;
$$;

REVOKE ALL ON FUNCTION public.match_buyer_requirement(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_buyer_requirement(uuid, integer) TO authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_buyer_requirements_updated_at'
  ) THEN
    CREATE TRIGGER trg_buyer_requirements_updated_at
      BEFORE UPDATE ON public.buyer_requirements
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END;
$$;
