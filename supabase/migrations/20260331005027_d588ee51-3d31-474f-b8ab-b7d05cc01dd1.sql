
-- Add preference columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'CLP',
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'es',
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS new_listing_alerts boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS price_drop_alerts boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS marketing_emails boolean DEFAULT false;

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policy for avatars bucket: authenticated users can upload their own avatars
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can update their own avatars
CREATE POLICY "Users can update their avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can delete their own avatars
CREATE POLICY "Users can delete their avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
