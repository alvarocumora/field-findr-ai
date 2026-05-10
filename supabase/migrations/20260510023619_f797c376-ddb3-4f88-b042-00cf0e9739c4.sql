-- Per-user 3D packing designs for listings
CREATE TABLE public.listing_designs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL,
  design JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);

CREATE INDEX idx_listing_designs_user_listing ON public.listing_designs(user_id, listing_id);

ALTER TABLE public.listing_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own designs"
ON public.listing_designs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own designs"
ON public.listing_designs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own designs"
ON public.listing_designs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own designs"
ON public.listing_designs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_listing_designs_updated_at
BEFORE UPDATE ON public.listing_designs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();