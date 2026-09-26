-- Referral Engine V2: commission economics and network overrides
-- Normalizes referral_rate as a percentage of SALE AMOUNT and creates a
-- dedicated ledger for upline broker network overrides.

CREATE TABLE IF NOT EXISTS public.broker_network_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid NOT NULL REFERENCES public.agent_commissions(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  source_broker_id uuid NOT NULL,
  beneficiary_broker_id uuid NOT NULL,
  depth integer NOT NULL DEFAULT 1,
  override_rate numeric NOT NULL,
  override_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT broker_network_overrides_depth_check CHECK (depth BETWEEN 1 AND 10),
  CONSTRAINT broker_network_overrides_rate_check CHECK (override_rate >= 0 AND override_rate <= 100),
  CONSTRAINT broker_network_overrides_amount_check CHECK (override_amount >= 0),
  CONSTRAINT broker_network_overrides_status_check CHECK (status IN ('pending','paid','cancelled')),
  CONSTRAINT broker_network_overrides_unique UNIQUE (commission_id, beneficiary_broker_id, depth)
);

CREATE INDEX IF NOT EXISTS broker_network_overrides_beneficiary_idx
  ON public.broker_network_overrides(beneficiary_broker_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS broker_network_overrides_source_idx
  ON public.broker_network_overrides(source_broker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS broker_network_overrides_project_idx
  ON public.broker_network_overrides(project_id, created_at DESC);

ALTER TABLE public.broker_network_overrides ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.broker_network_overrides TO authenticated;
GRANT ALL ON public.broker_network_overrides TO service_role;

DROP POLICY IF EXISTS "Brokers read related network overrides"
  ON public.broker_network_overrides;
CREATE POLICY "Brokers read related network overrides"
  ON public.broker_network_overrides FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR auth.uid() = beneficiary_broker_id
    OR auth.uid() = source_broker_id
  );

DROP TRIGGER IF EXISTS trg_broker_network_overrides_updated_at
  ON public.broker_network_overrides;
CREATE TRIGGER trg_broker_network_overrides_updated_at
  BEFORE UPDATE ON public.broker_network_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.register_sale(
  p_reservation_id uuid,
  p_sale_amount numeric,
  p_commission_rate numeric DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_referring_agent_id uuid DEFAULT NULL,
  p_referral_rate numeric DEFAULT NULL,
  p_lead_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_res record;
  v_commission_id uuid;
  v_referring uuid := p_referring_agent_id;
  v_ref_rate numeric := p_referral_rate;
  v_ref_amount numeric := 0;
  v_ref_status text := 'none';
  v_listing_id uuid;
  v_parent_broker uuid;
  v_parent_override_rate numeric := 0;
  v_parent_override_amount numeric := 0;
BEGIN
  IF p_sale_amount IS NULL OR p_sale_amount <= 0 THEN
    RAISE EXCEPTION 'Sale amount must be positive';
  END IF;
  IF p_commission_rate IS NOT NULL AND (p_commission_rate < 0 OR p_commission_rate > 50) THEN
    RAISE EXCEPTION 'Commission rate out of range (0-50)';
  END IF;
  IF v_ref_rate IS NOT NULL AND (v_ref_rate < 0 OR v_ref_rate > 100) THEN
    RAISE EXCEPTION 'Referral rate out of range (0-100)';
  END IF;

  SELECT
    r.*,
    l.user_id AS lot_owner,
    l.area AS lot_area,
    l.project_id AS lot_project_id,
    l.listing_id AS lot_listing_id
  INTO v_res
  FROM public.reservations r
  JOIN public.lots l ON l.id = r.lot_id
  WHERE r.id = p_reservation_id
  FOR UPDATE OF r;

  IF v_res IS NULL
     OR NOT public.can_access_project(v_res.lot_project_id, 'sales.write') THEN
    RAISE EXCEPTION 'Reservation not found or sales write access denied';
  END IF;
  IF v_res.status <> 'paid' THEN
    RAISE EXCEPTION 'Only paid reservations can be converted to a sale';
  END IF;

  v_referring := COALESCE(v_referring, v_res.referring_agent_id);

  IF p_lead_id IS NOT NULL THEN
    SELECT COALESCE(l.referring_agent_id, v_referring), l.listing_id
      INTO v_referring, v_listing_id
    FROM public.leads l
    WHERE l.id = p_lead_id
      AND (
        l.project_id = v_res.lot_project_id
        OR l.lot_id = v_res.lot_id
        OR (
          v_res.lot_listing_id IS NOT NULL
          AND l.listing_id = v_res.lot_listing_id
        )
      );

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Lead does not belong to the reservation project or lot';
    END IF;
  END IF;

  -- Resolve the referral commission automatically when the caller does not
  -- override it. Project-specific commercial rules win over the default rule.
  IF v_referring IS NOT NULL AND v_ref_rate IS NULL THEN
    SELECT cr.referral_override_rate
      INTO v_ref_rate
    FROM public.commission_rules cr
    WHERE cr.is_active
      AND cr.scope = 'project'
      AND cr.project_id = v_res.lot_project_id
    ORDER BY cr.updated_at DESC
    LIMIT 1;

    IF v_ref_rate IS NULL THEN
      SELECT cr.referral_override_rate
        INTO v_ref_rate
      FROM public.commission_rules cr
      WHERE cr.is_active
        AND cr.scope = 'default'
      ORDER BY cr.updated_at DESC
      LIMIT 1;
    END IF;
  END IF;

  v_ref_rate := COALESCE(v_ref_rate, 0);

  UPDATE public.reservations
  SET status = 'converted',
      converted_at = now(),
      notes = COALESCE(p_notes, notes),
      lead_id = COALESCE(p_lead_id, lead_id)
  WHERE id = p_reservation_id;

  UPDATE public.lots
  SET price = p_sale_amount,
      price_per_sqm = CASE
        WHEN area > 0 THEN round(p_sale_amount / area)
        ELSE price_per_sqm
      END
  WHERE id = v_res.lot_id;

  IF p_commission_rate IS NOT NULL AND p_commission_rate > 0 THEN
    IF v_referring IS NOT NULL AND v_ref_rate > 0 THEN
      -- referral_rate is a percentage of the sale amount (e.g. 0.5 = 0.5%).
      v_ref_amount := round(p_sale_amount * v_ref_rate / 100);
      v_ref_status := 'pending';
    END IF;

    INSERT INTO public.agent_commissions (
      agent_id, reservation_id, lot_id, project_id, listing_id, lead_id,
      sale_amount, commission_rate, commission_amount, status, notes,
      referring_agent_id, referral_rate, referral_amount, referral_status,
      closing_agent_id
    )
    VALUES (
      auth.uid(), p_reservation_id, v_res.lot_id, v_res.lot_project_id,
      v_listing_id, p_lead_id,
      p_sale_amount, p_commission_rate,
      round(p_sale_amount * p_commission_rate / 100),
      'earned', p_notes,
      v_referring, v_ref_rate, v_ref_amount, v_ref_status,
      auth.uid()
    )
    RETURNING id INTO v_commission_id;

    IF v_referring IS NOT NULL AND v_ref_amount > 0 THEN
      INSERT INTO public.notifications (
        user_id, type, title, message, link, metadata
      )
      VALUES (
        v_referring,
        'payment',
        'Comisión por referido generada',
        'Se generó una comisión de referido por $' || v_ref_amount || ' pendiente de pago.',
        '/asesor/comisiones',
        jsonb_build_object(
          'commission_id', v_commission_id,
          'amount', v_ref_amount,
          'rate', v_ref_rate
        )
      );

      -- One-level upline override. The parent relationship is stored as a UUID
      -- in broker_profiles.referred_by. Only active parents with a positive
      -- configured network_override_rate accrue an override.
      SELECT bp.referred_by
        INTO v_parent_broker
      FROM public.broker_profiles bp
      WHERE bp.user_id = v_referring
        AND bp.is_active
      LIMIT 1;

      IF v_parent_broker IS NOT NULL
         AND v_parent_broker <> v_referring
         AND v_parent_broker <> auth.uid() THEN
        SELECT bp.network_override_rate
          INTO v_parent_override_rate
        FROM public.broker_profiles bp
        WHERE bp.user_id = v_parent_broker
          AND bp.is_active
        LIMIT 1;

        v_parent_override_rate := COALESCE(v_parent_override_rate, 0);

        IF v_parent_override_rate > 0 THEN
          v_parent_override_amount := round(
            p_sale_amount * v_parent_override_rate / 100
          );

          IF v_parent_override_amount > 0 THEN
            INSERT INTO public.broker_network_overrides (
              commission_id,
              project_id,
              reservation_id,
              source_broker_id,
              beneficiary_broker_id,
              depth,
              override_rate,
              override_amount,
              status
            )
            VALUES (
              v_commission_id,
              v_res.lot_project_id,
              p_reservation_id,
              v_referring,
              v_parent_broker,
              1,
              v_parent_override_rate,
              v_parent_override_amount,
              'pending'
            )
            ON CONFLICT (commission_id, beneficiary_broker_id, depth)
            DO NOTHING;

            INSERT INTO public.notifications (
              user_id, type, title, message, link, metadata
            )
            VALUES (
              v_parent_broker,
              'payment',
              'Override de red generado',
              'Tu red generó un override de $' || v_parent_override_amount || ' pendiente de pago.',
              '/asesor/red',
              jsonb_build_object(
                'commission_id', v_commission_id,
                'source_broker_id', v_referring,
                'amount', v_parent_override_amount,
                'rate', v_parent_override_rate,
                'depth', 1
              )
            );
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  IF p_lead_id IS NOT NULL THEN
    UPDATE public.leads
    SET status = 'converted'
    WHERE id = p_lead_id;
  END IF;

  RETURN v_commission_id;
END;
$fn$;

REVOKE ALL ON FUNCTION public.register_sale(
  uuid, numeric, numeric, text, uuid, numeric, uuid
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_sale(
  uuid, numeric, numeric, text, uuid, numeric, uuid
) TO authenticated;

-- Network analytics now read from the dedicated override ledger rather than
-- overloading referral_amount.
CREATE OR REPLACE FUNCTION public.get_broker_referral_tree(
  p_root_user uuid DEFAULT NULL,
  p_max_depth integer DEFAULT 5
)
RETURNS TABLE(
  user_id uuid,
  parent_user_id uuid,
  depth integer,
  display_name text,
  slug text,
  level text,
  is_active boolean,
  joined_at timestamptz,
  sales_count integer,
  sales_volume numeric,
  commission_volume numeric,
  override_generated numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE root AS (
    SELECT COALESCE(p_root_user, auth.uid()) AS uid
  ), guard AS (
    SELECT CASE
      WHEN (SELECT uid FROM root) = auth.uid() OR public.is_platform_admin() THEN true
      ELSE false
    END AS ok
  ), tree AS (
    SELECT bp.user_id, bp.referred_by AS parent_user_id, 1 AS depth
      FROM public.broker_profiles bp
     WHERE (SELECT ok FROM guard)
       AND bp.referred_by = (SELECT uid FROM root)
    UNION ALL
    SELECT c.user_id, c.referred_by, t.depth + 1
      FROM public.broker_profiles c
      JOIN tree t ON c.referred_by = t.user_id
     WHERE t.depth < GREATEST(1, LEAST(COALESCE(p_max_depth, 5), 10))
  )
  SELECT t.user_id,
         t.parent_user_id,
         t.depth,
         bp.display_name,
         bp.slug,
         bp.level,
         bp.is_active,
         bp.created_at,
         COALESCE(s.sales_count, 0)::integer,
         COALESCE(s.sales_volume, 0),
         COALESCE(s.commission_volume, 0),
         COALESCE(o.override_generated, 0)
    FROM tree t
    JOIN public.broker_profiles bp ON bp.user_id = t.user_id
    LEFT JOIN LATERAL (
      SELECT count(*) AS sales_count,
             sum(ac.sale_amount) AS sales_volume,
             sum(ac.commission_amount) AS commission_volume
        FROM public.agent_commissions ac
       WHERE ac.agent_id = t.user_id
    ) s ON true
    LEFT JOIN LATERAL (
      SELECT sum(bno.override_amount) AS override_generated
        FROM public.broker_network_overrides bno
       WHERE bno.source_broker_id = t.user_id
         AND bno.beneficiary_broker_id = t.parent_user_id
         AND bno.status <> 'cancelled'
    ) o ON true
   ORDER BY t.depth, bp.display_name;
$$;

REVOKE ALL ON FUNCTION public.get_broker_referral_tree(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_broker_referral_tree(uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_broker_metrics(p_broker_user uuid DEFAULT NULL)
RETURNS TABLE(
  broker_user_id uuid,
  leads_total integer,
  leads_won integer,
  leads_active integer,
  sales_count integer,
  sales_volume numeric,
  commission_paid numeric,
  commission_pending numeric,
  override_earned numeric,
  override_pending numeric,
  network_direct integer,
  network_total integer,
  projects_assigned integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH target AS (
    SELECT COALESCE(p_broker_user, auth.uid()) AS uid
  ), guard AS (
    SELECT (SELECT uid FROM target) = auth.uid() OR public.is_platform_admin() AS ok
  ), l AS (
    SELECT count(*) AS total,
           count(*) FILTER (WHERE status = 'closed_won') AS won,
           count(*) FILTER (WHERE status NOT IN ('closed_won','closed_lost','discarded')) AS active
      FROM public.leads
     WHERE (SELECT ok FROM guard)
       AND (user_id = (SELECT uid FROM target) OR referring_agent_id = (SELECT uid FROM target))
  ), c AS (
    SELECT count(*) AS sales_count,
           COALESCE(sum(sale_amount), 0) AS sales_volume,
           COALESCE(sum(commission_amount) FILTER (WHERE status = 'paid'), 0) AS paid,
           COALESCE(sum(commission_amount) FILTER (WHERE status <> 'paid' AND status <> 'cancelled'), 0) AS pending
      FROM public.agent_commissions
     WHERE (SELECT ok FROM guard) AND agent_id = (SELECT uid FROM target)
  ), o AS (
    SELECT COALESCE(sum(override_amount) FILTER (WHERE status = 'paid'), 0) AS earned,
           COALESCE(sum(override_amount) FILTER (WHERE status = 'pending'), 0) AS pending
      FROM public.broker_network_overrides
     WHERE (SELECT ok FROM guard)
       AND beneficiary_broker_id = (SELECT uid FROM target)
  ), n AS (
    SELECT count(*) FILTER (WHERE depth = 1) AS direct, count(*) AS total
      FROM public.get_broker_referral_tree((SELECT uid FROM target), 5)
  ), p AS (
    SELECT count(*) AS assigned
      FROM public.project_broker_assignments
     WHERE (SELECT ok FROM guard)
       AND broker_id = (SELECT uid FROM target)
       AND status = 'approved'
  )
  SELECT (SELECT uid FROM target),
         l.total::integer, l.won::integer, l.active::integer,
         c.sales_count::integer, c.sales_volume, c.paid, c.pending,
         o.earned, o.pending,
         n.direct::integer, n.total::integer,
         p.assigned::integer
    FROM l, c, o, n, p;
$$;

REVOKE ALL ON FUNCTION public.get_broker_metrics(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_broker_metrics(uuid) TO authenticated;

COMMENT ON TABLE public.broker_network_overrides IS
  'Dedicated ledger for upline broker overrides generated from attributed sales.';
COMMENT ON COLUMN public.agent_commissions.referral_rate IS
  'Referral commission percentage applied to sale_amount (0.5 means 0.5% of the sale).';
