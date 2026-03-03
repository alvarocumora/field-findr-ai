
-- 1. Create price_history table
CREATE TABLE public.price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CLP',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_history_listing ON public.price_history(listing_id, recorded_at DESC);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view price history" ON public.price_history
  FOR SELECT USING (true);

-- Only system/triggers insert into price_history
CREATE POLICY "System can insert price history" ON public.price_history
  FOR INSERT WITH CHECK (true);

-- Trigger: record price on listing insert
CREATE OR REPLACE FUNCTION public.record_price_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.price_history (listing_id, price, currency)
  VALUES (NEW.id, NEW.price, COALESCE(NEW.currency, 'CLP'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_listing_insert_price
  AFTER INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.record_price_on_insert();

-- Trigger: record price on listing update when price changes
CREATE OR REPLACE FUNCTION public.record_price_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.price IS DISTINCT FROM OLD.price THEN
    INSERT INTO public.price_history (listing_id, price, currency)
    VALUES (NEW.id, NEW.price, COALESCE(NEW.currency, 'CLP'));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_listing_update_price
  AFTER UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.record_price_on_update();

-- 2. Add listing_id to reviews (nullable, so existing project reviews still work)
ALTER TABLE public.reviews
  ADD COLUMN listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  ALTER COLUMN project_id DROP NOT NULL;

-- Update RLS to also allow viewing reviews for active listings
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (
    (EXISTS (SELECT 1 FROM projects WHERE projects.id = reviews.project_id AND projects.status = 'active'))
    OR
    (EXISTS (SELECT 1 FROM listings WHERE listings.id = reviews.listing_id AND listings.status = 'active'))
  );

-- 3. GIN index for full-text search on listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(location, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(region, '')), 'C') ||
    setweight(to_tsvector('spanish', coalesce(city, '')), 'C') ||
    setweight(to_tsvector('spanish', coalesce(description, '')), 'D')
  ) STORED;

CREATE INDEX idx_listings_search_vector ON public.listings USING GIN (search_vector);
