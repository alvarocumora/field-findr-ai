-- Canonical sales ledger
-- public.sales is the authoritative closed transaction record.
-- sales_closings remains a pre-sale/contract workflow and links to sales once closed.
-- Existing register_sale() remains API-compatible; DB triggers capture both current
-- reservation conversion and sales_closings flows without duplicating business logic.

CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  lot_id uuid NOT NULL REFERENCES public.lots(id) ON DELETE RESTRICT,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  reservation_id uuid UNIQUE REFERENCES public.reservations(id) ON DELETE SET NULL,
  source_quote_id uuid REFERENCES public.sales_quotes(id) ON DELETE SET NULL,
  closing_agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  originator_agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referring_agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  buyer_national_id text,
  sale_amount numeric NOT NULL CHECK (sale_amount > 0),
  currency text NOT NULL DEFAULT 'CLP',
  source text NOT NULL DEFAULT 'reservation'
    CHECK (source IN ('reservation', 'sales_closing', 'manual')),
  status text NOT NULL DEFAULT 'closed'
    CHECK (status IN ('closed', 'void')),
  notes text,
  closed_at timestamptz NOT NULL DEFAULT now(),
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS sales_one_closed_per_lot_idx
  ON public.sales(lot_id)
  WHERE status = 'closed';
CREATE INDEX IF NOT EXISTS sales_organization_closed_idx
  ON public.sales(organization_id, closed_at DESC);
CREATE INDEX IF NOT EXISTS sales_project_closed_idx
  ON public.sales(project_id, closed_at DESC);
CREATE INDEX IF NOT EXISTS sales_closing_agent_idx
  ON public.sales(closing_agent_id, closed_at DESC);
CREATE INDEX IF NOT EXISTS sales_originator_agent_idx
  ON public.sales(originator_agent_id, closed_at DESC);
CREATE INDEX IF NOT EXISTS sales_referring_agent_idx
  ON public.sales(referring_agent_id, closed_at DESC);
CREATE INDEX IF NOT EXISTS sales_opportunity_idx
  ON public.sales(opportunity_id)
  WHERE opportunity_id IS NOT NULL;

ALTER TABLE public.agent_commissions
  ADD COLUMN IF NOT EXISTS sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL;

ALTER TABLE public.sales_closings
  ADD COLUMN IF NOT EXISTS sale_id uuid REFERENCES public.sales(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS agent_commissions_sale_idx
  ON public.agent_commissions(sale_id)
  WHERE sale_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS sales_closings_sale_idx
  ON public.sales_closings(sale_id)
  WHERE sale_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.sale_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sale_events_sale_created_idx
  ON public.sale_events(sale_id, created_at DESC);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.sales TO authenticated;
GRANT SELECT ON public.sale_events TO authenticated;
GRANT ALL ON public.sales, public.sale_events TO service_role;

DROP POLICY IF EXISTS "Sales participants read canonical sales" ON public.sales;
CREATE POLICY "Sales participants read canonical sales"
ON public.sales FOR SELECT TO authenticated
USING (
  public.is_platform_admin()
  OR auth.uid() = closing_agent_id
  OR auth.uid() = originator_agent_id
  OR auth.uid() = referring_agent_id
  OR (
    organization_id IS NOT NULL
    AND public.organization_has_capability(organization_id, 'sales.read')
  )
  OR public.can_access_project(project_id, 'sales.read')
);

DROP POLICY IF EXISTS "Sales participants read sale events" ON public.sale_events;
CREATE POLICY "Sales participants read sale events"
ON public.sale_events FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sales sale
    WHERE sale.id = sale_events.sale_id
      AND (
        public.is_platform_admin()
        OR auth.uid() = sale.closing_agent_id
        OR auth.uid() = sale.originator_agent_id
        OR auth.uid() = sale.referring_agent_id
        OR (
          sale.organization_id IS NOT NULL
          AND public.organization_has_capability(sale.organization_id, 'sales.read')
        )
        OR public.can_access_project(sale.project_id, 'sales.read')
      )
  )
);

CREATE OR REPLACE FUNCTION public.record_sale_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.sale_events (
      sale_id, actor_id, event_type, from_status, to_status, details
    )
    VALUES (
      NEW.id,
      auth.uid(),
      'created',
      NULL,
      NEW.status,
      jsonb_build_object(
        'sale_amount', NEW.sale_amount,
        'currency', NEW.currency,
        'source', NEW.source,
        'project_id', NEW.project_id,
        'lot_id', NEW.lot_id,
        'reservation_id', NEW.reservation_id
      )
    );
  ELSIF OLD.status IS DISTINCT FROM NEW.status
     OR OLD.sale_amount IS DISTINCT FROM NEW.sale_amount THEN
    INSERT INTO public.sale_events (
      sale_id, actor_id, event_type, from_status, to_status, details
    )
    VALUES (
      NEW.id,
      auth.uid(),
      CASE
        WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status_changed'
        ELSE 'amount_adjusted'
      END,
      OLD.status,
      NEW.status,
      jsonb_build_object(
        'old_amount', OLD.sale_amount,
        'new_amount', NEW.sale_amount,
        'void_reason', NEW.void_reason
      )
    );
  END IF;

  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.record_sale_event()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_record_sale_event ON public.sales;
CREATE TRIGGER trg_record_sale_event
AFTER INSERT OR UPDATE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.record_sale_event();

DROP TRIGGER IF EXISTS trg_sales_updated_at ON public.sales;
CREATE TRIGGER trg_sales_updated_at
BEFORE UPDATE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Capture the existing reservation -> converted -> lot sold flow. The current
-- register_sale RPC updates the lot price after converting the reservation, so
-- this is an UPSERT: the first sold-state update creates the ledger row and the
-- final price update refreshes the negotiated amount in the same transaction.
CREATE OR REPLACE FUNCTION public.capture_sale_from_sold_lot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_res record;
  v_organization_id uuid;
  v_sale_amount numeric;
  v_closing_agent uuid;
  v_originator uuid;
BEGIN
  IF NEW.status <> 'sold' THEN
    RETURN NEW;
  END IF;

  SELECT reservation.*
    INTO v_res
  FROM public.reservations AS reservation
  WHERE reservation.lot_id = NEW.id
    AND reservation.status = 'converted'
  ORDER BY reservation.converted_at DESC NULLS LAST, reservation.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  v_sale_amount := NULLIF(NEW.price, 0);
  IF v_sale_amount IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT project.organization_id
    INTO v_organization_id
  FROM public.projects AS project
  WHERE project.id = NEW.project_id;

  SELECT COALESCE(commission.closing_agent_id, commission.agent_id)
    INTO v_closing_agent
  FROM public.agent_commissions AS commission
  WHERE commission.reservation_id = v_res.id
  ORDER BY commission.created_at DESC
  LIMIT 1;

  v_closing_agent := COALESCE(v_closing_agent, auth.uid(), NEW.user_id);
  v_originator := COALESCE(v_res.referring_agent_id, v_closing_agent);

  INSERT INTO public.sales (
    organization_id,
    project_id,
    lot_id,
    listing_id,
    lead_id,
    reservation_id,
    source_quote_id,
    closing_agent_id,
    originator_agent_id,
    referring_agent_id,
    buyer_name,
    buyer_email,
    buyer_phone,
    buyer_national_id,
    sale_amount,
    currency,
    source,
    status,
    notes,
    closed_at
  )
  VALUES (
    v_organization_id,
    NEW.project_id,
    NEW.id,
    NEW.listing_id,
    v_res.lead_id,
    v_res.id,
    v_res.source_quote_id,
    v_closing_agent,
    v_originator,
    v_res.referring_agent_id,
    v_res.buyer_name,
    v_res.buyer_email,
    v_res.buyer_phone,
    v_res.buyer_rut,
    v_sale_amount,
    COALESCE(v_res.currency, 'CLP'),
    'reservation',
    'closed',
    v_res.notes,
    COALESCE(v_res.converted_at, NEW.sale_date, now())
  )
  ON CONFLICT (reservation_id)
  DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    project_id = EXCLUDED.project_id,
    lot_id = EXCLUDED.lot_id,
    listing_id = EXCLUDED.listing_id,
    lead_id = COALESCE(EXCLUDED.lead_id, public.sales.lead_id),
    source_quote_id = COALESCE(EXCLUDED.source_quote_id, public.sales.source_quote_id),
    closing_agent_id = COALESCE(public.sales.closing_agent_id, EXCLUDED.closing_agent_id),
    originator_agent_id = COALESCE(public.sales.originator_agent_id, EXCLUDED.originator_agent_id),
    referring_agent_id = COALESCE(public.sales.referring_agent_id, EXCLUDED.referring_agent_id),
    buyer_name = COALESCE(EXCLUDED.buyer_name, public.sales.buyer_name),
    buyer_email = COALESCE(EXCLUDED.buyer_email, public.sales.buyer_email),
    buyer_phone = COALESCE(EXCLUDED.buyer_phone, public.sales.buyer_phone),
    buyer_national_id = COALESCE(EXCLUDED.buyer_national_id, public.sales.buyer_national_id),
    sale_amount = EXCLUDED.sale_amount,
    currency = EXCLUDED.currency,
    notes = COALESCE(EXCLUDED.notes, public.sales.notes),
    closed_at = COALESCE(public.sales.closed_at, EXCLUDED.closed_at),
    updated_at = now();

  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.capture_sale_from_sold_lot()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_capture_sale_from_sold_lot ON public.lots;
CREATE TRIGGER trg_capture_sale_from_sold_lot
AFTER UPDATE OF status, price, sale_date ON public.lots
FOR EACH ROW EXECUTE FUNCTION public.capture_sale_from_sold_lot();

-- sales_closings remains the contract/closing workflow. When it reaches closed,
-- link it to (or create) the canonical sale transaction.
CREATE OR REPLACE FUNCTION public.link_sales_closing_to_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_sale_id uuid;
  v_organization_id uuid;
  v_originator uuid;
BEGIN
  IF NEW.status <> 'closed' THEN
    RETURN NEW;
  END IF;

  IF NEW.project_id IS NULL OR NEW.lot_id IS NULL
     OR NEW.sale_amount IS NULL OR NEW.sale_amount <= 0 THEN
    RAISE EXCEPTION 'Closed sales workflow requires project, lot and positive sale amount';
  END IF;

  SELECT project.organization_id
    INTO v_organization_id
  FROM public.projects AS project
  WHERE project.id = NEW.project_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sales closing project not found';
  END IF;

  IF NEW.reservation_id IS NOT NULL THEN
    SELECT sale.id
      INTO v_sale_id
    FROM public.sales AS sale
    WHERE sale.reservation_id = NEW.reservation_id
    LIMIT 1;
  END IF;

  IF v_sale_id IS NULL THEN
    SELECT sale.id
      INTO v_sale_id
    FROM public.sales AS sale
    WHERE sale.lot_id = NEW.lot_id
      AND sale.status = 'closed'
    ORDER BY sale.closed_at DESC
    LIMIT 1;
  END IF;

  v_originator := COALESCE(NEW.referring_agent_id, NEW.user_id);

  IF v_sale_id IS NULL THEN
    INSERT INTO public.sales (
      organization_id,
      project_id,
      lot_id,
      listing_id,
      lead_id,
      reservation_id,
      closing_agent_id,
      originator_agent_id,
      referring_agent_id,
      buyer_name,
      buyer_email,
      buyer_phone,
      buyer_national_id,
      sale_amount,
      currency,
      source,
      status,
      notes,
      closed_at
    )
    VALUES (
      v_organization_id,
      NEW.project_id,
      NEW.lot_id,
      NEW.listing_id,
      NEW.lead_id,
      NEW.reservation_id,
      NEW.user_id,
      v_originator,
      NEW.referring_agent_id,
      NEW.buyer_name,
      NEW.buyer_email,
      NEW.buyer_phone,
      NEW.buyer_national_id,
      NEW.sale_amount,
      COALESCE(NEW.currency, 'CLP'),
      'sales_closing',
      'closed',
      NEW.notes,
      COALESCE(NEW.closed_at, now())
    )
    RETURNING id INTO v_sale_id;
  ELSE
    UPDATE public.sales
    SET
      organization_id = v_organization_id,
      project_id = NEW.project_id,
      lot_id = NEW.lot_id,
      listing_id = COALESCE(NEW.listing_id, listing_id),
      lead_id = COALESCE(NEW.lead_id, lead_id),
      reservation_id = COALESCE(NEW.reservation_id, reservation_id),
      closing_agent_id = COALESCE(NEW.user_id, closing_agent_id),
      originator_agent_id = COALESCE(originator_agent_id, v_originator),
      referring_agent_id = COALESCE(referring_agent_id, NEW.referring_agent_id),
      buyer_name = COALESCE(NEW.buyer_name, buyer_name),
      buyer_email = COALESCE(NEW.buyer_email, buyer_email),
      buyer_phone = COALESCE(NEW.buyer_phone, buyer_phone),
      buyer_national_id = COALESCE(NEW.buyer_national_id, buyer_national_id),
      sale_amount = NEW.sale_amount,
      currency = COALESCE(NEW.currency, currency),
      notes = COALESCE(NEW.notes, notes),
      closed_at = COALESCE(NEW.closed_at, closed_at),
      updated_at = now()
    WHERE id = v_sale_id;
  END IF;

  NEW.sale_id := v_sale_id;
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.link_sales_closing_to_sale()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_link_sales_closing_to_sale
  ON public.sales_closings;
CREATE TRIGGER trg_link_sales_closing_to_sale
BEFORE INSERT OR UPDATE ON public.sales_closings
FOR EACH ROW EXECUTE FUNCTION public.link_sales_closing_to_sale();

-- Commission rows attach to the canonical sale automatically, preserving all
-- existing commission/referral APIs.
CREATE OR REPLACE FUNCTION public.link_commission_to_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NEW.sale_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.reservation_id IS NOT NULL THEN
    SELECT sale.id
      INTO NEW.sale_id
    FROM public.sales AS sale
    WHERE sale.reservation_id = NEW.reservation_id
    LIMIT 1;
  END IF;

  IF NEW.sale_id IS NULL AND NEW.lot_id IS NOT NULL THEN
    SELECT sale.id
      INTO NEW.sale_id
    FROM public.sales AS sale
    WHERE sale.lot_id = NEW.lot_id
      AND sale.status = 'closed'
    ORDER BY sale.closed_at DESC
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.link_commission_to_sale()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_link_commission_to_sale
  ON public.agent_commissions;
CREATE TRIGGER trg_link_commission_to_sale
BEFORE INSERT OR UPDATE OF reservation_id, lot_id
ON public.agent_commissions
FOR EACH ROW EXECUTE FUNCTION public.link_commission_to_sale();

COMMENT ON TABLE public.sales IS
  'Canonical immutable-by-default transaction ledger. Closed sales are captured from reservation conversion or sales_closings.';
COMMENT ON TABLE public.sales_closings IS
  'Contract/closing workflow. public.sales is the canonical closed financial transaction; sale_id links the workflow to it.';
COMMENT ON COLUMN public.agent_commissions.sale_id IS
  'Canonical sale transaction that generated this commission.';
