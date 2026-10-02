CREATE UNIQUE INDEX IF NOT EXISTS reservations_one_active_per_lot
  ON public.reservations (lot_id)
  WHERE status IN ('pending_payment'::reservation_status, 'paid'::reservation_status);