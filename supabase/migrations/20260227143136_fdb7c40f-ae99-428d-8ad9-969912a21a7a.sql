-- Add plan_images column to projects table for storing master plan image URLs
ALTER TABLE public.projects ADD COLUMN plan_images text[] DEFAULT '{}'::text[];