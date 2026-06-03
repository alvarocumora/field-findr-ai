
-- 1) agent_commissions
DROP POLICY IF EXISTS "Agents insert their own commissions" ON public.agent_commissions;
DROP POLICY IF EXISTS "Agents update their own commissions" ON public.agent_commissions;
DROP POLICY IF EXISTS "Agents delete their own commissions" ON public.agent_commissions;

-- 2) lots column grants
REVOKE SELECT ON public.lots FROM anon;
REVOKE SELECT ON public.lots FROM authenticated;
GRANT SELECT (
  id, project_id, user_id, lot_number, name, description, area, price, price_per_sqm,
  status, latitude, longitude, polygon, features, reservation_date, sale_date,
  created_at, updated_at, elevation_avg, slope_category, images
) ON public.lots TO anon;
GRANT SELECT (
  id, project_id, user_id, lot_number, name, description, area, price, price_per_sqm,
  status, latitude, longitude, polygon, features, reservation_date, sale_date,
  created_at, updated_at, elevation_avg, slope_category, images
) ON public.lots TO authenticated;
GRANT SELECT (buyer_name, buyer_email, buyer_phone) ON public.lots TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.lots TO authenticated;
GRANT ALL ON public.lots TO service_role;

-- 3) Realtime
ALTER PUBLICATION supabase_realtime DROP TABLE public.lots;

-- 4) tour-panoramas
DROP POLICY IF EXISTS "Users can update their tour panoramas" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their tour panoramas" ON storage.objects;

CREATE POLICY "Users can update their tour panoramas"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tour-panoramas'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their tour panoramas"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tour-panoramas'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5) transaction-documents
DROP POLICY IF EXISTS "Project owners can view transaction docs" ON storage.objects;
DROP POLICY IF EXISTS "Project owners can upload transaction docs" ON storage.objects;
DROP POLICY IF EXISTS "Project owners can delete transaction docs" ON storage.objects;

CREATE POLICY "Transaction docs: owners and buyers can view"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'transaction-documents'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.reservations r
      LEFT JOIN public.lots l ON l.id = r.lot_id
      LEFT JOIN public.projects p ON p.id = l.project_id
      WHERE r.id::text = (storage.foldername(storage.objects.name))[1]
        AND (r.user_id = auth.uid() OR l.user_id = auth.uid() OR p.user_id = auth.uid())
    )
  )
);

CREATE POLICY "Transaction docs: owners and buyers can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'transaction-documents'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.reservations r
      LEFT JOIN public.lots l ON l.id = r.lot_id
      LEFT JOIN public.projects p ON p.id = l.project_id
      WHERE r.id::text = (storage.foldername(storage.objects.name))[1]
        AND (r.user_id = auth.uid() OR l.user_id = auth.uid() OR p.user_id = auth.uid())
    )
  )
);

CREATE POLICY "Transaction docs: owners and buyers can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'transaction-documents'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.reservations r
      LEFT JOIN public.lots l ON l.id = r.lot_id
      LEFT JOIN public.projects p ON p.id = l.project_id
      WHERE r.id::text = (storage.foldername(storage.objects.name))[1]
        AND (r.user_id = auth.uid() OR l.user_id = auth.uid() OR p.user_id = auth.uid())
    )
  )
);

CREATE POLICY "Transaction docs: owners and buyers can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'transaction-documents'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.reservations r
      LEFT JOIN public.lots l ON l.id = r.lot_id
      LEFT JOIN public.projects p ON p.id = l.project_id
      WHERE r.id::text = (storage.foldername(storage.objects.name))[1]
        AND (r.user_id = auth.uid() OR l.user_id = auth.uid() OR p.user_id = auth.uid())
    )
  )
);
