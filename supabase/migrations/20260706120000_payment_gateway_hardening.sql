-- Payment gateway hardening
--
-- 1) subscriptions.valid_plan_type only allowed ('free','professional','enterprise')
--    but the checkout/webhook now sell 'starter'/'growth'/'scale' — every approved
--    payment for those plans failed the CHECK when the webhook wrote the
--    subscription. Widen the constraint to the current catalog.
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS valid_plan_type;
ALTER TABLE public.subscriptions ADD CONSTRAINT valid_plan_type
  CHECK (plan_type IN ('free', 'starter', 'growth', 'scale', 'enterprise', 'professional'));

-- 2) Webhook idempotency: MercadoPago retries notifications, and payments had no
--    unique key on the MP payment id, so each retry inserted a duplicate row and
--    inflated revenue stats. Dedupe (keep the earliest row) and enforce uniqueness.
DELETE FROM public.payments p
USING public.payments q
WHERE p.mercadopago_payment_id IS NOT NULL
  AND p.mercadopago_payment_id = q.mercadopago_payment_id
  AND (q.created_at < p.created_at
       OR (q.created_at = p.created_at AND q.id < p.id));

-- NOT a partial index: ON CONFLICT (mercadopago_payment_id) — what the
-- webhook's upsert issues via PostgREST — cannot match a partial index.
-- A plain unique index still allows unlimited NULLs (manual/offline rows).
CREATE UNIQUE INDEX IF NOT EXISTS payments_mercadopago_payment_id_key
  ON public.payments (mercadopago_payment_id);

-- 3) Refunds/chargebacks: a paid reservation cancelled by the webhook left the lot
--    stuck in 'reserved' — the release branch only covered pending_payment. Extend
--    the trigger to free the lot (and clear buyer data) when a PAID reservation is
--    cancelled, without touching lots already sold.
CREATE OR REPLACE FUNCTION public.handle_reservation_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- When reservation is paid, update lot to reserved
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
        UPDATE public.lots
        SET status = 'reserved',
            reservation_date = now(),
            buyer_name = NEW.buyer_name,
            buyer_email = NEW.buyer_email,
            buyer_phone = NEW.buyer_phone
        WHERE id = NEW.lot_id;
    END IF;

    -- When reservation expires or is cancelled, release the lot
    IF NEW.status IN ('expired', 'cancelled') AND OLD.status = 'pending_payment' THEN
        UPDATE public.lots
        SET status = 'available',
            reservation_date = NULL
        WHERE id = NEW.lot_id AND status = 'reserved';
    END IF;

    -- Refund/chargeback: a paid reservation cancelled must free the lot too,
    -- clearing the buyer snapshot, but never downgrade a sold lot.
    IF NEW.status = 'cancelled' AND OLD.status = 'paid' THEN
        UPDATE public.lots
        SET status = 'available',
            reservation_date = NULL,
            buyer_name = NULL,
            buyer_email = NULL,
            buyer_phone = NULL
        WHERE id = NEW.lot_id AND status = 'reserved';
    END IF;

    -- When reservation is converted to contract, update lot to sold
    IF NEW.status = 'converted' AND OLD.status = 'paid' THEN
        UPDATE public.lots
        SET status = 'sold',
            sale_date = now()
        WHERE id = NEW.lot_id;
    END IF;

    RETURN NEW;
END;
$$;
