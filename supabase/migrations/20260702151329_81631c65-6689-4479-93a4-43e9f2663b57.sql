
-- Fix critical: tasaciones storage overly permissive. Restrict to publisher/admin.
DROP POLICY IF EXISTS "Authenticated can read tasaciones" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload tasaciones" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update tasaciones" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete tasaciones" ON storage.objects;

CREATE POLICY "Tasaciones: publisher or admin can read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'tasaciones' AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

CREATE POLICY "Tasaciones: user can upload to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'tasaciones'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Tasaciones: publisher or admin can update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'tasaciones' AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

CREATE POLICY "Tasaciones: publisher or admin can delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'tasaciones' AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Fix warns: enforce folder ownership on upload for lot-images, 3d-assets, tour-panoramas
DROP POLICY IF EXISTS "Authenticated users can upload lot images" ON storage.objects;
CREATE POLICY "Authenticated users can upload lot images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'lot-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can upload 3d assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload 3d assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = '3d-assets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Authenticated users can upload tour panoramas" ON storage.objects;
CREATE POLICY "Authenticated users can upload tour panoramas"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'tour-panoramas'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Fix warn: reservations INSERT policy must enforce user_id = auth.uid()
DROP POLICY IF EXISTS "Project owners can insert reservations" ON public.reservations;
CREATE POLICY "Users can insert their own reservations"
ON public.reservations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
