
-- === 1) sync_listing_from_lot trigger ===
CREATE OR REPLACE FUNCTION public.sync_listing_from_lot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.listing_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.listings AS l SET
    price = CASE
      WHEN NEW.price IS NOT NULL AND NEW.price IS DISTINCT FROM OLD.price THEN NEW.price
      ELSE l.price
    END,
    status = CASE
      WHEN l.status IN ('inactive', 'rejected') THEN l.status
      WHEN NEW.status = 'reserved' THEN 'reserved'
      WHEN NEW.status = 'sold' THEN 'sold'
      WHEN NEW.status = 'available' AND l.status IN ('reserved', 'sold') THEN 'active'
      ELSE l.status
    END,
    updated_at = now()
  WHERE l.id = NEW.listing_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_listing_from_lot ON public.lots;
CREATE TRIGGER trg_sync_listing_from_lot
  AFTER UPDATE OF price, status ON public.lots
  FOR EACH ROW
  WHEN (NEW.listing_id IS NOT NULL)
  EXECUTE FUNCTION public.sync_listing_from_lot();

-- === 2) agency showcase columns + public RPC ===
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS public_slug   text,
  ADD COLUMN IF NOT EXISTS logo_url      text,
  ADD COLUMN IF NOT EXISTS bio           text,
  ADD COLUMN IF NOT EXISTS is_public     boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_public_slug_key
  ON public.profiles (public_slug)
  WHERE public_slug IS NOT NULL;

-- Public read of showcase-visible agency profiles (only the safe columns are
-- returned by the RPC below — RLS still hides the full row).
CREATE OR REPLACE FUNCTION public.get_agency_by_slug(p_slug text)
RETURNS TABLE (
  user_id       uuid,
  company_name  text,
  public_slug   text,
  logo_url      text,
  bio           text,
  first_name    text,
  last_name     text,
  avatar_url    text,
  created_at    timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, company_name, public_slug, logo_url, bio,
         first_name, last_name, avatar_url, created_at
  FROM public.profiles
  WHERE public_slug = p_slug
    AND is_public = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_agency_by_slug(text) TO anon, authenticated;
