-- Add embed_url column to projects table for external map embeds (Land id, etc.)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS embed_map_url TEXT;