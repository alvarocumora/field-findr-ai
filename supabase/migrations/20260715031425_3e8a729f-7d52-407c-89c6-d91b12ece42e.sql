
-- Restore normal SELECT grants (undo prior column-level restriction on authenticated
-- so owner queries with select('*') keep working; anon no longer has any SELECT
-- privilege since we route it through the view).
REVOKE SELECT ON public.lots FROM anon;
GRANT SELECT ON public.lots TO authenticated;

-- Drop the public marketplace policy — public access now goes through the view.
DROP POLICY IF EXISTS "Anyone can view lots from active projects" ON public.lots;

-- Re-add a signed-in read policy for non-owners browsing active projects.
-- (Owners are already covered by "Users can view their own lots".)
CREATE POLICY "Signed-in users can view lots from active projects"
  ON public.lots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = lots.project_id AND p.status = 'active'
    )
  );

-- Public, PII-free view.
CREATE OR REPLACE VIEW public.lots_public
WITH (security_invoker = off) AS
SELECT
  id, project_id, user_id, lot_number, name, description, area, price, price_per_sqm,
  status, latitude, longitude, polygon, features,
  reservation_date, sale_date, created_at, updated_at,
  elevation_avg, slope_category, images, listing_id
FROM public.lots l
WHERE EXISTS (
  SELECT 1 FROM public.projects p
  WHERE p.id = l.project_id AND p.status = 'active'
);

GRANT SELECT ON public.lots_public TO anon, authenticated;
