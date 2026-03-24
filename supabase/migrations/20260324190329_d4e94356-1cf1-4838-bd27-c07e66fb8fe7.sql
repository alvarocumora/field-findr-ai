
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

INSERT INTO storage.buckets (id, name, public) VALUES ('lot-images', 'lot-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload lot images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lot-images');
CREATE POLICY "Anyone can view lot images" ON storage.objects FOR SELECT USING (bucket_id = 'lot-images');
CREATE POLICY "Users can delete their lot images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'lot-images' AND (storage.foldername(name))[1] = auth.uid()::text);
