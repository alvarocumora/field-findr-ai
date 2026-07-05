
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_status_check;
ALTER TABLE public.listings ADD CONSTRAINT listings_status_check
  CHECK (status = ANY (ARRAY['active','reserved','sold','inactive','pending_review','rejected']));
