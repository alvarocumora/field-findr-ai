-- Capture a project-authorized broker on public reservation forms.
-- No commission is accrued or paid by this trigger: conversion remains a
-- separate privileged sale operation. Unknown/unapproved codes are ignored.
-- Compatible with environments where older referral migrations are pending.
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS referring_agent_id uuid,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referral_landing_path text;

CREATE OR REPLACE FUNCTION public.resolve_public_reservation_broker()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_code text;
  v_landing_path text;
  v_user_id uuid;
BEGIN
  IF NEW.buyer_details IS NULL
     OR NEW.buyer_details->>'source' IS DISTINCT FROM 'formulario_reserva'
     OR jsonb_typeof(NEW.buyer_details) IS DISTINCT FROM 'object'
  THEN
    RETURN NEW;
  END IF;

  v_code := nullif(btrim(NEW.buyer_details->>'brokerReferralCode'), '');
  IF v_code IS NULL
    OR length(v_code) > 80
    OR v_code !~ '^[A-Za-z0-9_-]+$'
  THEN
    RETURN NEW;
  END IF;

  -- Invite code is NOT an authorization. Confirm both the active broker
  -- and approval to sell the exact project of this reserved lot.
  SELECT bp.user_id
    INTO v_user_id
  FROM public.broker_profiles bp
  JOIN public.project_broker_assignments pa
    ON pa.broker_id = bp.user_id AND pa.status = 'approved'
  JOIN public.lots l
    ON l.project_id = pa.project_id AND l.id = NEW.lot_id
  WHERE bp.invite_code = v_code
    AND bp.is_active = true
    AND bp.user_id IS DISTINCT FROM NEW.user_id
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_landing_path := nullif(btrim(NEW.buyer_details->>'brokerReferralLandingPath'), '');
  IF v_landing_path IS NOT NULL AND
     (length(v_landing_path) > 500 OR left(v_landing_path, 1) <> '/') THEN
    v_landing_path := NULL;
  END IF;

  NEW.referring_agent_id := v_user_id;
  NEW.referral_code := v_code;
  NEW.referral_landing_path := v_landing_path;
  RETURN NEW;
END;
$fn$;

REVOKE ALL ON FUNCTION public.resolve_public_reservation_broker()
  FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_resolve_public_reservation_broker ON public.reservations;
CREATE TRIGGER trg_resolve_public_reservation_broker
  BEFORE INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.resolve_public_reservation_broker();

COMMENT ON FUNCTION public.resolve_public_reservation_broker() IS
  'Validates first-touch broker referral for public reservation; no money or commission side effects.';
