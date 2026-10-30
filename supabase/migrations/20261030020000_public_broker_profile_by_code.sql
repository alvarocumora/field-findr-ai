-- Broker-attributed marketing material: a visitor arriving via a broker's
-- ?ref=<invite_code> link needs that broker's public contact to appear on
-- generated PDFs/CTAs instead of the project's generic contact. Mirrors
-- get_public_broker_profile(p_slug) exactly, keyed by invite_code instead —
-- same opt-in gate (public_contact_opt_in), same is_active/is_public filter,
-- no direct table access.

CREATE OR REPLACE FUNCTION public.get_public_broker_profile_by_code(p_invite_code text)
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
  WHERE bp.invite_code = p_invite_code
    AND bp.is_active
    AND bp.is_public
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_broker_profile_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_broker_profile_by_code(text) TO anon, authenticated;
