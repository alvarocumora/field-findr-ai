-- Project boundary (perímetro del macro-lote) for the masterplan / loteo studio.
--
-- The projects table had no perimeter geometry, so the auto-subdivision studio
-- could not persist a generated masterplan back to a project, and a KMZ-imported
-- outline had nowhere to live. This stores the outer boundary as a raw array of
-- [lng, lat] vertices — the same shape lots.polygon uses — so the map and the
-- studio can round-trip it.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS boundary jsonb;

COMMENT ON COLUMN public.projects.boundary IS
  'Perímetro del macro-lote como arreglo de vértices [[lng,lat],...] (estudio de loteo / masterplan). Mismo formato que lots.polygon.';
