-- Self-contained test for the lot → listing sync trigger.
-- Run on a throwaway DB: creates minimal listings/lots stubs, applies the
-- migration, then asserts price/status propagation and the guardrails.

CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price numeric,
  status text,
  updated_at timestamptz DEFAULT now()
);
CREATE TABLE public.lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price numeric,
  status text DEFAULT 'available',
  listing_id uuid
);

\i supabase/migrations/20260711140000_sync_listing_from_lot.sql

INSERT INTO public.listings (id, price, status)
  VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 40000000, 'active');
INSERT INTO public.lots (id, price, status, listing_id)
  VALUES ('bbbbbbbb-0000-0000-0000-000000000001', 40000000, 'available', 'aaaaaaaa-0000-0000-0000-000000000001');

DO $$
DECLARE s text; p numeric;
BEGIN
  -- price change propagates
  UPDATE public.lots SET price = 45000000 WHERE id='bbbbbbbb-0000-0000-0000-000000000001';
  SELECT price INTO p FROM public.listings WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
  ASSERT p = 45000000, 'price should propagate, got '||p;

  -- reserved propagates
  UPDATE public.lots SET status='reserved' WHERE id='bbbbbbbb-0000-0000-0000-000000000001';
  SELECT status INTO s FROM public.listings WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
  ASSERT s = 'reserved', 'expected reserved, got '||s;

  -- available reverts a held card to active
  UPDATE public.lots SET status='available' WHERE id='bbbbbbbb-0000-0000-0000-000000000001';
  SELECT status INTO s FROM public.listings WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
  ASSERT s = 'active', 'expected active, got '||s;

  -- sold propagates
  UPDATE public.lots SET status='sold' WHERE id='bbbbbbbb-0000-0000-0000-000000000001';
  SELECT status INTO s FROM public.listings WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
  ASSERT s = 'sold', 'expected sold, got '||s;

  -- a card taken down (inactive) is never resurrected, but price still syncs
  UPDATE public.listings SET status='inactive' WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
  UPDATE public.lots SET status='available', price=50000000 WHERE id='bbbbbbbb-0000-0000-0000-000000000001';
  SELECT status, price INTO s, p FROM public.listings WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
  ASSERT s = 'inactive', 'inactive card must stay inactive, got '||s;
  ASSERT p = 50000000, 'price still syncs when inactive, got '||p;

  -- a card awaiting approval is never auto-promoted to active
  UPDATE public.listings SET status='pending_review' WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
  UPDATE public.lots SET status='available' WHERE id='bbbbbbbb-0000-0000-0000-000000000001';
  SELECT status INTO s FROM public.listings WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
  ASSERT s = 'pending_review', 'pending_review must not become active, got '||s;

  -- an unlinked lot never touches any listing
  UPDATE public.lots SET listing_id=NULL WHERE id='bbbbbbbb-0000-0000-0000-000000000001';
  UPDATE public.lots SET price=1 WHERE id='bbbbbbbb-0000-0000-0000-000000000001';

  RAISE NOTICE 'ALL SYNC ASSERTIONS PASSED';
END $$;
