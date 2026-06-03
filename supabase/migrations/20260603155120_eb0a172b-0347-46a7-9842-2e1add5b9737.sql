
CREATE TABLE public.cached_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  payload jsonb NOT NULL,
  source_portals text[] NOT NULL DEFAULT '{}',
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cached_listings TO anon, authenticated;
GRANT ALL ON public.cached_listings TO service_role;

ALTER TABLE public.cached_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read cached listings"
  ON public.cached_listings FOR SELECT
  USING (true);

CREATE INDEX idx_cached_listings_key ON public.cached_listings(cache_key);
CREATE INDEX idx_cached_listings_expires ON public.cached_listings(expires_at);
