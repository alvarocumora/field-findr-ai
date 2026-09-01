CREATE OR REPLACE FUNCTION public.create_public_reservation(
  p_lot_id uuid,
  p_buyer_name text,
  p_buyer_email text,
  p_buyer_phone text DEFAULT NULL,
  p_buyer_rut text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lot record;
  v_amount numeric;
  v_id uuid;
BEGIN
  IF coalesce(trim(p_buyer_name), '') = '' OR coalesce(trim(p_buyer_email), '') = '' THEN
    RAISE EXCEPTION 'Nombre y email son obligatorios';
  END IF;
  IF p_buyer_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Email inválido';
  END IF;

  SELECT l.id, l.status, l.user_id, l.project_id, p.reservation_deposit
    INTO v_lot
  FROM public.lots l
  LEFT JOIN public.projects p ON p.id = l.project_id
  WHERE l.id = p_lot_id;

  IF v_lot.id IS NULL THEN
    RAISE EXCEPTION 'Parcela no encontrada';
  END IF;
  IF coalesce(v_lot.status, 'available') <> 'available' THEN
    RAISE EXCEPTION 'La parcela no está disponible';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.reservations r
    WHERE r.lot_id = p_lot_id
      AND r.status = 'pending_payment'
      AND r.expires_at > now()
  ) THEN
    RAISE EXCEPTION 'La parcela ya tiene una reserva en curso';
  END IF;

  v_amount := coalesce(v_lot.reservation_deposit, 500000);

  INSERT INTO public.reservations (
    lot_id, user_id, buyer_name, buyer_email, buyer_phone, buyer_rut,
    reservation_amount, currency, status, expires_at, notes
  ) VALUES (
    p_lot_id, v_lot.user_id, trim(p_buyer_name), lower(trim(p_buyer_email)),
    nullif(trim(coalesce(p_buyer_phone, '')), ''), nullif(trim(coalesce(p_buyer_rut, '')), ''),
    v_amount, 'CLP', 'pending_payment', now() + interval '48 hours',
    nullif(trim(coalesce(p_notes, '')), '')
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_reservation(uuid, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_reservation(uuid, text, text, text, text, text) TO anon, authenticated;