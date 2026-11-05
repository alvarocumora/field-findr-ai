-- Formulario de reserva público (OfertaTerrenos).
--
-- Digitaliza el formulario de reserva en papel: datos completos de hasta dos
-- compradores y sus cónyuges/convivientes civiles, fecha estimada de
-- escritura y aceptación expresa de las condiciones. Todo queda en la misma
-- tabla `reservations`, de modo que el panel del vendedor, el bloqueo de
-- "una reserva activa por lote" y el paso a `reserved` al confirmar el pago
-- siguen funcionando sin cambios.
--
-- Aditivo: no modifica create_public_reservation ni create-reservation-payment.

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS buyer_details jsonb,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text;

COMMENT ON COLUMN public.reservations.buyer_details IS
  'Formulario de reserva: compradores, cónyuges, fecha estimada de escritura. Ver src/lib/reservations/reservationForm.ts';

-- Stock reservable para el formulario: lotes de proyectos activos,
-- disponibles, con precio publicado y sin una reserva activa vigente.
-- Sólo expone datos comerciales (sin datos de compradores).
CREATE OR REPLACE FUNCTION public.get_reservable_lots(p_project_id uuid)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  lot_number text,
  name text,
  area numeric,
  price numeric,
  reservation_amount numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id, l.project_id, l.lot_number, l.name, l.area, l.price,
    coalesce(p.reservation_deposit, 500000) AS reservation_amount
  FROM public.lots l
  JOIN public.projects p ON p.id = l.project_id
  WHERE p.status = 'active'
    AND l.project_id = p_project_id
    AND coalesce(l.status, 'available') = 'available'
    AND l.price IS NOT NULL AND l.price > 0
    AND NOT EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.lot_id = l.id
        AND (
          r.status = 'paid'::public.reservation_status
          OR (r.status = 'pending_payment'::public.reservation_status AND r.expires_at > now())
        )
    )
  ORDER BY l.lot_number;
$$;

REVOKE ALL ON FUNCTION public.get_reservable_lots(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reservable_lots(uuid) TO anon, authenticated;

-- Crea la reserva desde el formulario completo. El monto se toma del
-- proyecto (nunca del cliente) y la disponibilidad se revalida con el lote
-- bloqueado, para que dos compradores no reserven la misma parcela.
CREATE OR REPLACE FUNCTION public.create_public_reservation_form(
  p_lot_id uuid,
  p_buyer_name text,
  p_buyer_email text,
  p_buyer_phone text,
  p_buyer_rut text,
  p_buyer_details jsonb,
  p_terms_version text,
  p_notes text DEFAULT NULL
)
RETURNS TABLE (
  reservation_id uuid,
  reservation_amount numeric,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lot record;
  v_amount numeric;
  v_id uuid;
  v_expires timestamptz := now() + interval '48 hours';
BEGIN
  IF coalesce(trim(p_buyer_name), '') = '' OR coalesce(trim(p_buyer_email), '') = '' THEN
    RAISE EXCEPTION 'Nombre y email son obligatorios';
  END IF;
  IF p_buyer_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Email inválido';
  END IF;
  IF coalesce(trim(p_buyer_rut), '') = '' THEN
    RAISE EXCEPTION 'El RUT del comprador es obligatorio';
  END IF;
  IF coalesce(trim(p_terms_version), '') = '' THEN
    RAISE EXCEPTION 'Debes aceptar las condiciones de la reserva';
  END IF;
  IF p_buyer_details IS NULL OR jsonb_typeof(p_buyer_details) <> 'object' THEN
    RAISE EXCEPTION 'Faltan los datos del formulario';
  END IF;
  IF length(p_buyer_details::text) > 20000 THEN
    RAISE EXCEPTION 'El formulario excede el tamaño permitido';
  END IF;

  SELECT l.id, l.status, l.user_id, l.price, p.status AS project_status, p.reservation_deposit
    INTO v_lot
  FROM public.lots l
  JOIN public.projects p ON p.id = l.project_id
  WHERE l.id = p_lot_id
  FOR UPDATE OF l;

  IF v_lot.id IS NULL OR v_lot.project_status <> 'active' THEN
    RAISE EXCEPTION 'Parcela no encontrada';
  END IF;
  IF coalesce(v_lot.status, 'available') <> 'available' OR v_lot.price IS NULL OR v_lot.price <= 0 THEN
    RAISE EXCEPTION 'La parcela no está disponible';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.reservations r
    WHERE r.lot_id = p_lot_id
      AND (
        r.status = 'paid'::public.reservation_status
        OR (r.status = 'pending_payment'::public.reservation_status AND r.expires_at > now())
      )
  ) THEN
    RAISE EXCEPTION 'La parcela ya tiene una reserva en curso';
  END IF;

  v_amount := coalesce(v_lot.reservation_deposit, 500000);

  -- Una reserva pendiente ya vencida pero aún no barrida ocuparía el índice
  -- único de "una activa por lote"; se marca vencida antes de insertar.
  -- Columnas calificadas: reservation_amount y expires_at también son
  -- variables de salida de RETURNS TABLE y PL/pgSQL las daría por ambiguas.
  UPDATE public.reservations stale
     SET status = 'expired'::public.reservation_status
   WHERE stale.lot_id = p_lot_id
     AND stale.status = 'pending_payment'::public.reservation_status
     AND stale.expires_at <= now();

  BEGIN
    INSERT INTO public.reservations (
      lot_id, user_id, buyer_name, buyer_email, buyer_phone, buyer_rut,
      reservation_amount, currency, status, expires_at, notes,
      buyer_details, terms_accepted_at, terms_version
    ) VALUES (
      p_lot_id, v_lot.user_id, trim(p_buyer_name), lower(trim(p_buyer_email)),
      nullif(trim(coalesce(p_buyer_phone, '')), ''), trim(p_buyer_rut),
      v_amount, 'CLP', 'pending_payment', v_expires,
      nullif(trim(coalesce(p_notes, '')), ''),
      p_buyer_details, now(), trim(p_terms_version)
    ) RETURNING id INTO v_id;
  EXCEPTION WHEN unique_violation THEN
    -- reservations_one_active_per_lot: un vencido aún no barrido o una carrera.
    RAISE EXCEPTION 'La parcela ya tiene una reserva en curso';
  END;

  RETURN QUERY SELECT v_id, v_amount, v_expires;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_reservation_form(uuid, text, text, text, text, jsonb, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_public_reservation_form(uuid, text, text, text, text, jsonb, text, text) TO anon, authenticated;
