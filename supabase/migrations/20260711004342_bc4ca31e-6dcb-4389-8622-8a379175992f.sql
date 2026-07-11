ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS boundary jsonb;
COMMENT ON COLUMN public.projects.boundary IS 'Perímetro del macro-lote como arreglo de vértices [[lng,lat],...] (estudio de loteo / masterplan). Mismo formato que lots.polygon.';

ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_lots_listing_id ON public.lots(listing_id);
COMMENT ON COLUMN public.lots.listing_id IS 'Marketplace listing this lot was published as (card). NULL = not published.';