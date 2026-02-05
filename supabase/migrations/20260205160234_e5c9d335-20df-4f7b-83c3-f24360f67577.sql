-- Add kmz_file_url column to projects table to store the KMZ file path
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS kmz_file_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.projects.kmz_file_url IS 'URL to the KMZ file stored in Supabase storage';