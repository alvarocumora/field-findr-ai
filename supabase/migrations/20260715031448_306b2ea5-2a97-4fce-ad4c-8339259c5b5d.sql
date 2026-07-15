
DROP VIEW IF EXISTS public.lots_public;

CREATE OR REPLACE FUNCTION public.get_public_lots(p_project_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid, project_id uuid, user_id uuid, lot_number text, name text, description text,
  area numeric, price numeric, price_per_sqm numeric, status text,
  latitude double precision, longitude double precision, polygon jsonb, features jsonb,
  reservation_date timestamptz, sale_date timestamptz,
  created_at timestamptz, updated_at timestamptz,
  elevation_avg numeric, slope_category text, images text[], listing_id uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id, l.project_id, l.user_id, l.lot_number, l.name, l.description,
    l.area, l.price, l.price_per_sqm, l.status,
    l.latitude, l.longitude, l.polygon, l.features,
    l.reservation_date, l.sale_date,
    l.created_at, l.updated_at,
    l.elevation_avg, l.slope_category, l.images, l.listing_id
  FROM public.lots l
  JOIN public.projects p ON p.id = l.project_id
  WHERE p.status = 'active'
    AND (p_project_id IS NULL OR l.project_id = p_project_id);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_lots(uuid) TO anon, authenticated;
