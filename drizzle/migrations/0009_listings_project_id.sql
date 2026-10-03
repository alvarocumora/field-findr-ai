ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS listings_project_id_idx ON public.listings(project_id);
UPDATE public.listings li SET project_id = lo.project_id
FROM public.lots lo WHERE lo.listing_id = li.id AND li.project_id IS NULL;