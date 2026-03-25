INSERT INTO storage.buckets (id, name, public) VALUES ('3d-assets', '3d-assets', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view 3d assets" ON storage.objects FOR SELECT USING (bucket_id = '3d-assets');
CREATE POLICY "Authenticated users can upload 3d assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = '3d-assets');
CREATE POLICY "Users can delete their 3d assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = '3d-assets' AND (auth.uid())::text = (storage.foldername(name))[1]);