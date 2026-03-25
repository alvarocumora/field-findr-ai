
-- Tour scenes table
CREATE TABLE public.tour_scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  panorama_url text NOT NULL,
  thumbnail_url text,
  position_index integer DEFAULT 0,
  yaw_default numeric DEFAULT 0,
  pitch_default numeric DEFAULT 0,
  hotspots jsonb DEFAULT '[]'::jsonb,
  polygon_overlays jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tour_scenes ENABLE ROW LEVEL SECURITY;

-- Public can view scenes for active projects
CREATE POLICY "Anyone can view tour scenes of active projects"
ON public.tour_scenes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.projects
  WHERE projects.id = tour_scenes.project_id
  AND projects.status = 'active'
));

-- Owners can view their own scenes
CREATE POLICY "Owners can view their tour scenes"
ON public.tour_scenes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Owners full CRUD
CREATE POLICY "Owners can insert tour scenes"
ON public.tour_scenes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update tour scenes"
ON public.tour_scenes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete tour scenes"
ON public.tour_scenes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins manage all tour scenes"
ON public.tour_scenes FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for panoramas
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('tour-panoramas', 'tour-panoramas', true, 52428800);

-- Storage RLS
CREATE POLICY "Anyone can view tour panoramas"
ON storage.objects FOR SELECT
USING (bucket_id = 'tour-panoramas');

CREATE POLICY "Authenticated users can upload tour panoramas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tour-panoramas');

CREATE POLICY "Users can update their tour panoramas"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tour-panoramas');

CREATE POLICY "Users can delete their tour panoramas"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tour-panoramas');
