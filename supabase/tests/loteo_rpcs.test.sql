-- Functional tests for the loteo RPCs. Each block raises on failure.
\set ON_ERROR_STOP on

-- Seed
INSERT INTO projects (id, user_id, name) VALUES
  ('00000000-0000-0000-0000-00000000cafe', '00000000-0000-0000-0000-0000000000aa', 'Loteo Test');
INSERT INTO lots (id, project_id, user_id, lot_number, area, price, status) VALUES
  ('00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-00000000cafe', '00000000-0000-0000-0000-0000000000aa', '1', 5000, 45000000, 'available'),
  ('00000000-0000-0000-0000-000000001002', '00000000-0000-0000-0000-00000000cafe', '00000000-0000-0000-0000-0000000000aa', '2', 6000, 50000000, 'available'),
  ('00000000-0000-0000-0000-000000001003', '00000000-0000-0000-0000-00000000cafe', '00000000-0000-0000-0000-0000000000aa', '3', 7000, NULL, 'reserved');
INSERT INTO reservations (id, lot_id, user_id, buyer_name, status, expires_at) VALUES
  -- stale pending (expired 2h ago)
  ('00000000-0000-0000-0000-000000000e01', '00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-0000000000bb', 'Stale Buyer', 'pending_payment', now() - interval '2 hours'),
  -- live pending
  ('00000000-0000-0000-0000-000000000e02', '00000000-0000-0000-0000-000000001002', '00000000-0000-0000-0000-0000000000bb', 'Live Buyer', 'pending_payment', now() + interval '10 hours'),
  -- paid, ready to convert
  ('00000000-0000-0000-0000-000000000e03', '00000000-0000-0000-0000-000000001003', '00000000-0000-0000-0000-0000000000bb', 'Paid Buyer', 'paid', now() + interval '10 hours');

-- ── 1. expire_stale_reservations flips only the stale one ──
DO $t$
DECLARE n int;
BEGIN
  SELECT public.expire_stale_reservations() INTO n;
  IF n <> 1 THEN RAISE EXCEPTION 'expected 1 expired, got %', n; END IF;
  IF (SELECT status FROM reservations WHERE id = '00000000-0000-0000-0000-000000000e01') <> 'expired' THEN
    RAISE EXCEPTION 'stale reservation not expired';
  END IF;
  IF (SELECT status FROM reservations WHERE id = '00000000-0000-0000-0000-000000000e02') <> 'pending_payment' THEN
    RAISE EXCEPTION 'live reservation should stay pending';
  END IF;
  -- idempotent second run
  SELECT public.expire_stale_reservations() INTO n;
  IF n <> 0 THEN RAISE EXCEPTION 'second sweep should expire 0, got %', n; END IF;
  RAISE NOTICE 'TEST 1 OK: expire_stale_reservations';
END $t$;

-- ── 2. extend_reservation: owner can extend, stranger cannot ──
SET test.uid = '00000000-0000-0000-0000-0000000000aa'; -- lot owner
DO $t$
DECLARE new_exp timestamptz;
BEGIN
  SELECT public.extend_reservation('00000000-0000-0000-0000-000000000e02', 48) INTO new_exp;
  IF new_exp < now() + interval '57 hours' THEN
    RAISE EXCEPTION 'expiry not extended by ~48h: %', new_exp;
  END IF;
  RAISE NOTICE 'TEST 2a OK: owner extended to %', new_exp;
END $t$;

SET test.uid = '00000000-0000-0000-0000-0000000000cc'; -- stranger
DO $t$
BEGIN
  BEGIN
    PERFORM public.extend_reservation('00000000-0000-0000-0000-000000000e02', 48);
    RAISE EXCEPTION 'stranger should not be able to extend';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%not owned%' OR SQLERRM LIKE '%not pending%' OR SQLERRM LIKE '%not found%' THEN
      RAISE NOTICE 'TEST 2b OK: stranger rejected (%)', SQLERRM;
    ELSE RAISE; END IF;
  END;
END $t$;

-- ── 3. register_sale: converts, records price, creates commission ──
SET test.uid = '00000000-0000-0000-0000-0000000000aa';
DO $t$
DECLARE cid uuid; r record; l record; c record;
BEGIN
  SELECT public.register_sale('00000000-0000-0000-0000-000000000e03', 52000000, 3, 'Cierre test') INTO cid;
  SELECT * INTO r FROM reservations WHERE id = '00000000-0000-0000-0000-000000000e03';
  IF r.status <> 'converted' OR r.converted_at IS NULL THEN RAISE EXCEPTION 'reservation not converted'; END IF;
  SELECT * INTO l FROM lots WHERE id = '00000000-0000-0000-0000-000000001003';
  IF l.price <> 52000000 THEN RAISE EXCEPTION 'final price not recorded: %', l.price; END IF;
  IF l.price_per_sqm <> round(52000000 / 7000.0) THEN RAISE EXCEPTION 'price_per_sqm wrong: %', l.price_per_sqm; END IF;
  SELECT * INTO c FROM agent_commissions WHERE id = cid;
  IF c.commission_amount <> round(52000000 * 3 / 100.0) THEN RAISE EXCEPTION 'commission wrong: %', c.commission_amount; END IF;
  IF c.status <> 'pending' THEN RAISE EXCEPTION 'commission should be pending'; END IF;
  -- double conversion must fail
  BEGIN
    PERFORM public.register_sale('00000000-0000-0000-0000-000000000e03', 52000000, 3, NULL);
    RAISE EXCEPTION 'double conversion should fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%Only paid%' THEN RAISE NOTICE 'TEST 3b OK: double conversion rejected';
    ELSE RAISE; END IF;
  END;
  RAISE NOTICE 'TEST 3 OK: register_sale (commission %)', c.commission_amount;
END $t$;

-- ── 4. adjust_lot_prices: percent mode on available lots only ──
DO $t$
DECLARE n int; p1 numeric; p3 numeric;
BEGIN
  SELECT public.adjust_lot_prices('00000000-0000-0000-0000-00000000cafe', 'percent', 10, 'available') INTO n;
  IF n <> 2 THEN RAISE EXCEPTION 'expected 2 lots adjusted, got %', n; END IF;
  SELECT price INTO p1 FROM lots WHERE lot_number = '1';
  IF p1 <> round(45000000 * 1.10) THEN RAISE EXCEPTION 'lot 1 price wrong: %', p1; END IF;
  SELECT price INTO p3 FROM lots WHERE lot_number = '3';
  IF p3 <> 52000000 THEN RAISE EXCEPTION 'sold/reserved lot must not change: %', p3; END IF;
  RAISE NOTICE 'TEST 4 OK: adjust_lot_prices percent (+10%% on % lots)', n;
END $t$;

-- per_sqm mode
DO $t$
DECLARE n int; p2 numeric;
BEGIN
  SELECT public.adjust_lot_prices('00000000-0000-0000-0000-00000000cafe', 'per_sqm', 9000, 'available') INTO n;
  SELECT price INTO p2 FROM lots WHERE lot_number = '2';
  IF p2 <> 6000 * 9000 THEN RAISE EXCEPTION 'per_sqm price wrong: %', p2; END IF;
  RAISE NOTICE 'TEST 4b OK: adjust_lot_prices per_sqm';
END $t$;

-- stranger cannot adjust
SET test.uid = '00000000-0000-0000-0000-0000000000cc';
DO $t$
BEGIN
  BEGIN
    PERFORM public.adjust_lot_prices('00000000-0000-0000-0000-00000000cafe', 'percent', 10, NULL);
    RAISE EXCEPTION 'stranger should not adjust prices';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%not owned%' OR SQLERRM LIKE '%not found%' THEN RAISE NOTICE 'TEST 4c OK: stranger rejected';
    ELSE RAISE; END IF;
  END;
END $t$;

-- ── 5. mark_commission_paid: only the owning agent, only pending ──
SET test.uid = '00000000-0000-0000-0000-0000000000aa';
DO $t$
DECLARE cid uuid; ts timestamptz;
BEGIN
  SELECT id INTO cid FROM agent_commissions LIMIT 1;
  SELECT public.mark_commission_paid(cid) INTO ts;
  IF ts IS NULL THEN RAISE EXCEPTION 'paid_at not returned'; END IF;
  IF (SELECT status FROM agent_commissions WHERE id = cid) <> 'paid' THEN
    RAISE EXCEPTION 'commission not marked paid';
  END IF;
  -- second call must fail (no longer pending)
  BEGIN
    PERFORM public.mark_commission_paid(cid);
    RAISE EXCEPTION 'double payment should fail';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%not pending%' OR SQLERRM LIKE '%not found%' THEN RAISE NOTICE 'TEST 5b OK: double payment rejected';
    ELSE RAISE; END IF;
  END;
  RAISE NOTICE 'TEST 5 OK: mark_commission_paid';
END $t$;

SELECT 'ALL FUNCTIONAL TESTS PASSED' AS result;
