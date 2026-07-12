-- Showcase polish: featured projects + a public phone for WhatsApp.
--
-- Adds projects.featured (to highlight/sort projects on the public vitrina) and
-- extends get_agency_by_slug to also return the agency phone so the showcase can
-- offer a direct WhatsApp button. DROP-first keeps db push safe against the
-- prior return-type of the function.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

DROP FUNCTION IF EXISTS public.get_agency_by_slug(text);
CREATE OR REPLACE FUNCTION public.get_agency_by_slug(p_slug text)
RETURNS TABLE (
  user_id uuid,
  company_name text,
  public_slug text,
  logo_url text,
  bio text,
  phone text,
  first_name text,
  last_name text,
  avatar_url text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id, company_name, public_slug, logo_url, bio, phone,
         first_name, last_name, avatar_url, created_at
  FROM public.profiles
  WHERE is_public = true AND public_slug = p_slug
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_agency_by_slug(text) TO anon, authenticated;
