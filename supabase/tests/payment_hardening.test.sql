-- Functional assertions for 20260706120000_payment_gateway_hardening.sql.
-- Runs AFTER stub_payments.sql + the migration. Any failed assertion raises.
\set ON_ERROR_STOP on

DO $$
DECLARE
  n int;
  v_lot uuid := '00000000-0000-0000-0000-00000000ab01';
  v_lot_sold uuid := '00000000-0000-0000-0000-00000000ab02';
  v_res uuid := '00000000-0000-0000-0000-00000000ac01';
  v_res_sold uuid := '00000000-0000-0000-0000-00000000ac02';
  v_prj uuid := '00000000-0000-0000-0000-00000000aa01';
  v_usr uuid := '00000000-0000-0000-0000-000000000901';
  lot_row record;
BEGIN
  ------------------------------------------------------------------
  -- 1) Plan CHECK now accepts the current catalog and rejects junk
  ------------------------------------------------------------------
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (v_usr, 'growth', 'active');
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (gen_random_uuid(), 'starter', 'active');
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (gen_random_uuid(), 'scale', 'active');

  BEGIN
    INSERT INTO public.subscriptions (user_id, plan_type) VALUES (gen_random_uuid(), 'bogus');
    RAISE EXCEPTION 'FAIL: plan CHECK accepted an unknown plan_type';
  EXCEPTION WHEN check_violation THEN
    NULL; -- expected
  END;
  RAISE NOTICE 'OK: valid_plan_type accepts starter/growth/scale, rejects unknown';

  ------------------------------------------------------------------
  -- 2) payments deduped and unique index enforced
  ------------------------------------------------------------------
  SELECT count(*) INTO n FROM public.payments WHERE mercadopago_payment_id = 'mp-777';
  IF n <> 1 THEN
    RAISE EXCEPTION 'FAIL: expected 1 row for mp-777 after dedupe, got %', n;
  END IF;
  -- the survivor must be the earliest row
  SELECT count(*) INTO n FROM public.payments
  WHERE mercadopago_payment_id = 'mp-777' AND created_at = '2026-07-01T10:00:00Z';
  IF n <> 1 THEN
    RAISE EXCEPTION 'FAIL: dedupe did not keep the earliest mp-777 row';
  END IF;

  BEGIN
    INSERT INTO public.payments (user_id, amount, currency, status, mercadopago_payment_id, description)
    VALUES (v_usr, 500000, 'CLP', 'approved', 'mp-777', 'retry');
    RAISE EXCEPTION 'FAIL: duplicate mercadopago_payment_id was allowed';
  EXCEPTION WHEN unique_violation THEN
    NULL; -- expected
  END;

  -- webhook upsert path: retry updates status instead of duplicating
  INSERT INTO public.payments (user_id, amount, currency, status, mercadopago_payment_id, description)
  VALUES (v_usr, 500000, 'CLP', 'refunded', 'mp-777', 'retry')
  ON CONFLICT (mercadopago_payment_id) DO UPDATE SET status = EXCLUDED.status;
  SELECT count(*) INTO n FROM public.payments WHERE mercadopago_payment_id = 'mp-777';
  IF n <> 1 THEN
    RAISE EXCEPTION 'FAIL: upsert duplicated mp-777';
  END IF;
  IF (SELECT status FROM public.payments WHERE mercadopago_payment_id = 'mp-777') <> 'refunded' THEN
    RAISE EXCEPTION 'FAIL: upsert did not update payment status';
  END IF;
  -- NULL payment ids (manual/offline records) stay unconstrained
  INSERT INTO public.payments (user_id, amount, currency, status, description) VALUES (v_usr, 1, 'CLP', 'approved', 'manual 1');
  INSERT INTO public.payments (user_id, amount, currency, status, description) VALUES (v_usr, 2, 'CLP', 'approved', 'manual 2');
  RAISE NOTICE 'OK: payments idempotency (dedupe kept earliest, unique index, upsert, NULLs free)';

  ------------------------------------------------------------------
  -- 3) refund of a PAID reservation frees the lot and clears buyer data
  ------------------------------------------------------------------
  INSERT INTO public.projects (id, user_id, name) VALUES (v_prj, v_usr, 'P');
  INSERT INTO public.lots (id, project_id, user_id, lot_number, status)
  VALUES (v_lot, v_prj, v_usr, 'L-1', 'available');
  INSERT INTO public.reservations (id, lot_id, user_id, buyer_name, buyer_email, buyer_phone, status, expires_at)
  VALUES (v_res, v_lot, v_usr, 'Ana', 'ana@x.cl', '+569', 'pending_payment', now() + interval '48 hours');

  UPDATE public.reservations SET status = 'paid' WHERE id = v_res;
  SELECT * INTO lot_row FROM public.lots WHERE id = v_lot;
  IF lot_row.status <> 'reserved' OR lot_row.buyer_name <> 'Ana' THEN
    RAISE EXCEPTION 'FAIL: paid reservation did not reserve the lot';
  END IF;

  -- refund/chargeback path: paid -> cancelled
  UPDATE public.reservations SET status = 'cancelled' WHERE id = v_res;
  SELECT * INTO lot_row FROM public.lots WHERE id = v_lot;
  IF lot_row.status <> 'available' THEN
    RAISE EXCEPTION 'FAIL: refunded reservation left lot as %', lot_row.status;
  END IF;
  IF lot_row.buyer_name IS NOT NULL OR lot_row.buyer_email IS NOT NULL OR lot_row.reservation_date IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: refund did not clear buyer snapshot on the lot';
  END IF;
  RAISE NOTICE 'OK: paid->cancelled frees the lot and clears buyer data';

  ------------------------------------------------------------------
  -- 4) but a SOLD lot is never downgraded by a late cancellation
  ------------------------------------------------------------------
  INSERT INTO public.lots (id, project_id, user_id, lot_number, status)
  VALUES (v_lot_sold, v_prj, v_usr, 'L-2', 'available');
  INSERT INTO public.reservations (id, lot_id, user_id, buyer_name, status, expires_at)
  VALUES (v_res_sold, v_lot_sold, v_usr, 'Beto', 'pending_payment', now() + interval '48 hours');
  UPDATE public.reservations SET status = 'paid' WHERE id = v_res_sold; -- lot -> reserved
  -- The sale closes outside the reservation (register_sale marks the lot sold)
  UPDATE public.lots SET status = 'sold' WHERE id = v_lot_sold;
  -- A late refund cancels the reservation, but the sold lot must be untouched
  UPDATE public.reservations SET status = 'cancelled' WHERE id = v_res_sold;
  IF (SELECT status FROM public.lots WHERE id = v_lot_sold) <> 'sold' THEN
    RAISE EXCEPTION 'FAIL: cancellation downgraded a sold lot';
  END IF;
  RAISE NOTICE 'OK: sold lots survive stray cancellations';
END $$;

SELECT 'ALL PAYMENT HARDENING TESTS PASSED' AS result;
