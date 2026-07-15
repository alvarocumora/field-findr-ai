
REVOKE SELECT ON public.lots FROM anon;
GRANT SELECT (
  id, project_id, user_id, lot_number, name, description, area, price, price_per_sqm,
  status, latitude, longitude, polygon, features,
  reservation_date, sale_date, created_at, updated_at,
  elevation_avg, slope_category, images, listing_id
) ON public.lots TO anon;

REVOKE SELECT ON public.lots FROM authenticated;
GRANT SELECT (
  id, project_id, user_id, lot_number, name, description, area, price, price_per_sqm,
  status, latitude, longitude, polygon, features,
  reservation_date, sale_date, created_at, updated_at,
  elevation_avg, slope_category, images, listing_id
) ON public.lots TO authenticated;

CREATE OR REPLACE FUNCTION public.get_owner_lot_buyer(p_lot_id uuid)
RETURNS TABLE(buyer_name text, buyer_email text, buyer_phone text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.buyer_name, l.buyer_email, l.buyer_phone
  FROM public.lots l
  WHERE l.id = p_lot_id
    AND (l.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
$$;
REVOKE ALL ON FUNCTION public.get_owner_lot_buyer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_owner_lot_buyer(uuid) TO authenticated;

DROP POLICY IF EXISTS "Anyone can view orgs" ON public.organizations;
CREATE POLICY "Org members can view their org"
  ON public.organizations FOR SELECT
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM public.organization_members m
      WHERE m.organization_id = organizations.id AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can view price history" ON public.price_history;
CREATE POLICY "Public sees price history of active listings"
  ON public.price_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = price_history.listing_id AND l.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = price_history.listing_id AND l.user_id = auth.uid()
    )
  );
