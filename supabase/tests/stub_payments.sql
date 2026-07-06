-- Stub for the payment-gateway hardening migration: reproduces the relevant
-- pre-migration state (old plan CHECK, payments without unique index, the
-- original reservation trigger) so 20260706120000 can be functionally tested.

-- subscriptions as created by 20260204152123 (old, stale plan CHECK)
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_type text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  mercadopago_payer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_plan_type CHECK (plan_type IN ('free', 'professional', 'enterprise'))
);

-- payments as created by 20260204152123 (no unique index on the MP id)
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'CLP',
  status text NOT NULL,
  mercadopago_payment_id text,
  mercadopago_preference_id text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Columns the reservation trigger touches (kept minimal in stub_env.sql)
ALTER TABLE public.lots
  ADD COLUMN reservation_date timestamptz,
  ADD COLUMN buyer_name text,
  ADD COLUMN buyer_email text,
  ADD COLUMN buyer_phone text;
ALTER TABLE public.reservations
  ADD COLUMN buyer_email text,
  ADD COLUMN buyer_phone text,
  ADD COLUMN mercadopago_payment_id text,
  ADD COLUMN paid_at timestamptz;

-- Original trigger function + trigger from 20260207213350 (the migration
-- CREATE OR REPLACEs the function; the trigger itself must already exist).
CREATE OR REPLACE FUNCTION public.handle_reservation_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
        UPDATE public.lots
        SET status = 'reserved',
            reservation_date = now(),
            buyer_name = NEW.buyer_name,
            buyer_email = NEW.buyer_email,
            buyer_phone = NEW.buyer_phone
        WHERE id = NEW.lot_id;
    END IF;

    IF NEW.status IN ('expired', 'cancelled') AND OLD.status = 'pending_payment' THEN
        UPDATE public.lots
        SET status = 'available',
            reservation_date = NULL
        WHERE id = NEW.lot_id AND status = 'reserved';
    END IF;

    IF NEW.status = 'converted' AND OLD.status = 'paid' THEN
        UPDATE public.lots
        SET status = 'sold',
            sale_date = now()
        WHERE id = NEW.lot_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_reservation_status_change
AFTER INSERT OR UPDATE OF status ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.handle_reservation_status_change();

-- Pre-migration data: webhook retries created duplicated payment rows.
INSERT INTO public.payments (user_id, amount, currency, status, mercadopago_payment_id, description, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000901', 500000, 'CLP', 'approved', 'mp-777', 'Reserva de lote', '2026-07-01T10:00:00Z'),
  ('00000000-0000-0000-0000-000000000901', 500000, 'CLP', 'approved', 'mp-777', 'Reserva de lote', '2026-07-01T10:05:00Z'),
  ('00000000-0000-0000-0000-000000000901', 500000, 'CLP', 'approved', 'mp-777', 'Reserva de lote', '2026-07-01T10:10:00Z'),
  ('00000000-0000-0000-0000-000000000902', 75000, 'CLP', 'approved', 'mp-888', 'Suscripción starter', '2026-07-02T09:00:00Z');
