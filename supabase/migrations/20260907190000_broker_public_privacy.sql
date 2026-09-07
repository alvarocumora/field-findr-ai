-- P3 Community — protect broker contact data and enrich public profiles.
-- Public discovery goes through a narrow SECURITY DEFINER RPC; direct table
-- access remains available only to the profile owner and platform admins.

ALTER TABLE public.broker_profiles
  ADD COLUMN IF NOT EXISTS specialties text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS public_contact_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

DROP POLICY IF EXISTS "Public can view active public broker profiles" ON public.broker_profiles;
REVOKE SELECT ON public.broker_profiles FROM anon;

CREATE OR REPLACE FUNCTION public.get_public_broker_profile(p_slug text)
RETURNS TABLE(
  slug text,
  display_name text,
  company_name text,
  bio text,
  avatar_url text,
  level text,
  zones text[],
  specialties text[],
  is_verified boolean,
  phone text,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    bp.slug,
    bp.display_name,
    bp.company_name,
    bp.bio,
    bp.avatar_url,
    bp.level,
    bp.zones,
    bp.specialties,
    bp.verified_at IS NOT NULL AS is_verified,
    CASE WHEN bp.public_contact_opt_in THEN bp.phone ELSE NULL END,
    CASE WHEN bp.public_contact_opt_in THEN bp.email ELSE NULL END
  FROM public.broker_profiles bp
  WHERE bp.slug = p_slug
    AND bp.is_active
    AND bp.is_public
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_broker_profile(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_broker_profile(text) TO anon, authenticated;

COMMENT ON COLUMN public.broker_profiles.public_contact_opt_in IS
  'Explicit consent to expose phone and email through the public broker profile RPC.';
