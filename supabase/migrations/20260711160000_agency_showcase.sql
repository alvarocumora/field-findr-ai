-- Public agency showcase ("vitrina") — a branded public page per inmobiliaria.
--
-- Profiles are private (only the owner can SELECT their row), so we add opt-in
-- branding columns and expose ONLY the public subset through a SECURITY DEFINER
-- RPC keyed by a slug. No blanket public SELECT on profiles (that would leak
-- email/phone). Active projects are already publicly readable via their own RLS,
-- so the page joins them client-side by the returned user_id.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS public_slug text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- Slugs are unique when set (partial index ignores NULLs).
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_public_slug
  ON public.profiles(public_slug) WHERE public_slug IS NOT NULL;

-- Public read of the showcase subset only, for opted-in agencies.
CREATE OR REPLACE FUNCTION public.get_agency_by_slug(p_slug text)
RETURNS TABLE (user_id uuid, company_name text, logo_url text, bio text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, company_name, logo_url, bio
  FROM public.profiles
  WHERE is_public = true AND public_slug = p_slug
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_agency_by_slug(text) TO anon, authenticated;
