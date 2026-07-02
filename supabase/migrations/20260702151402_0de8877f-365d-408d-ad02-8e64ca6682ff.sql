
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
