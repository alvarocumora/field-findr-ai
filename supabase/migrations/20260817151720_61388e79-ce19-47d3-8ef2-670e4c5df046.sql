-- 1) Árbol de referidos (red del broker)
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
      SELECT sum(ac.referral_amount) AS override_generated
        FROM public.agent_commissions ac
       WHERE ac.agent_id = t.user_id
         AND ac.referring_agent_id = t.parent_user_id
    ) o ON true
   ORDER BY t.depth, bp.display_name;
$$;

REVOKE ALL ON FUNCTION public.get_broker_referral_tree(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_broker_referral_tree(uuid, integer) TO authenticated;

-- 2) Métricas agregadas por broker
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
           COALESCE(sum(commission_amount) FILTER (WHERE status <> 'paid'), 0) AS pending
      FROM public.agent_commissions
     WHERE (SELECT ok FROM guard) AND agent_id = (SELECT uid FROM target)
  ), o AS (
    SELECT COALESCE(sum(referral_amount) FILTER (WHERE referral_status = 'paid'), 0) AS earned,
           COALESCE(sum(referral_amount) FILTER (WHERE referral_status = 'pending'), 0) AS pending
      FROM public.agent_commissions
     WHERE (SELECT ok FROM guard) AND referring_agent_id = (SELECT uid FROM target)
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

-- 3) Atribución por proyecto
CREATE OR REPLACE FUNCTION public.get_broker_project_attribution(p_broker_user uuid DEFAULT NULL)
RETURNS TABLE(
  project_id uuid,
  project_name text,
  assignment_status text,
  commission_rate numeric,
  leads_count integer,
  leads_won integer,
  sales_count integer,
  sales_volume numeric,
  commission_total numeric,
  commission_paid numeric,
  last_activity timestamptz
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
  ), scope AS (
    SELECT DISTINCT pid FROM (
      SELECT project_id AS pid FROM public.project_broker_assignments
       WHERE broker_id = (SELECT uid FROM target)
      UNION
      SELECT project_id FROM public.leads
       WHERE project_id IS NOT NULL
         AND (user_id = (SELECT uid FROM target) OR referring_agent_id = (SELECT uid FROM target))
      UNION
      SELECT project_id FROM public.agent_commissions
       WHERE project_id IS NOT NULL
         AND (agent_id = (SELECT uid FROM target) OR referring_agent_id = (SELECT uid FROM target))
    ) x
    WHERE (SELECT ok FROM guard) AND pid IS NOT NULL
  )
  SELECT pr.id,
         pr.name,
         a.status,
         COALESCE(a.commission_rate, 0),
         COALESCE(l.total, 0)::integer,
         COALESCE(l.won, 0)::integer,
         COALESCE(c.cnt, 0)::integer,
         COALESCE(c.volume, 0),
         COALESCE(c.total_commission, 0),
         COALESCE(c.paid_commission, 0),
         GREATEST(COALESCE(l.last_at, 'epoch'::timestamptz), COALESCE(c.last_at, 'epoch'::timestamptz))
    FROM scope s
    JOIN public.projects pr ON pr.id = s.pid
    LEFT JOIN public.project_broker_assignments a
           ON a.project_id = s.pid AND a.broker_id = (SELECT uid FROM target)
    LEFT JOIN LATERAL (
      SELECT count(*) AS total,
             count(*) FILTER (WHERE status = 'closed_won') AS won,
             max(created_at) AS last_at
        FROM public.leads le
       WHERE le.project_id = s.pid
         AND (le.user_id = (SELECT uid FROM target) OR le.referring_agent_id = (SELECT uid FROM target))
    ) l ON true
    LEFT JOIN LATERAL (
      SELECT count(*) AS cnt,
             sum(ac.sale_amount) AS volume,
             sum(CASE WHEN ac.agent_id = (SELECT uid FROM target)
                      THEN ac.commission_amount ELSE ac.referral_amount END) AS total_commission,
             sum(CASE WHEN ac.agent_id = (SELECT uid FROM target) AND ac.status = 'paid'
                      THEN ac.commission_amount
                      WHEN ac.referring_agent_id = (SELECT uid FROM target) AND ac.referral_status = 'paid'
                      THEN ac.referral_amount ELSE 0 END) AS paid_commission,
             max(ac.created_at) AS last_at
        FROM public.agent_commissions ac
       WHERE ac.project_id = s.pid
         AND (ac.agent_id = (SELECT uid FROM target) OR ac.referring_agent_id = (SELECT uid FROM target))
    ) c ON true
   ORDER BY COALESCE(c.volume, 0) DESC, pr.name;
$$;

REVOKE ALL ON FUNCTION public.get_broker_project_attribution(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_broker_project_attribution(uuid) TO authenticated;