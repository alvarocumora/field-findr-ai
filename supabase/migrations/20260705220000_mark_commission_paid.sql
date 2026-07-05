-- Mark an agent commission as paid. agent_commissions lost its UPDATE policy
-- in an earlier hardening migration, so (like register_sale for INSERT) this
-- SECURITY DEFINER RPC is the controlled write path: only the owning agent
-- can flip their own pending commission to paid.
CREATE OR REPLACE FUNCTION public.mark_commission_paid(p_commission_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_paid_at timestamptz;
BEGIN
  UPDATE public.agent_commissions
  SET status = 'paid',
      paid_at = now(),
      updated_at = now()
  WHERE id = p_commission_id
    AND agent_id = auth.uid()
    AND status = 'pending'
  RETURNING paid_at INTO v_paid_at;

  IF v_paid_at IS NULL THEN
    RAISE EXCEPTION 'Commission not found, not pending, or not owned by caller';
  END IF;
  RETURN v_paid_at;
END;
$fn$;

REVOKE ALL ON FUNCTION public.mark_commission_paid(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.mark_commission_paid(uuid) TO authenticated;
