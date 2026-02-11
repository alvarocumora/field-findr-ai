
-- Add country column to listings table
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS country text DEFAULT 'Chile';

-- Create index for country-based queries
CREATE INDEX IF NOT EXISTS idx_listings_country ON public.listings(country);
