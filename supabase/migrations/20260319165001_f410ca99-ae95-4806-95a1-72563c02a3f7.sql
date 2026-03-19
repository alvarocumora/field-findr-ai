ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS elevation_avg NUMERIC;
ALTER TABLE public.lots ADD COLUMN IF NOT EXISTS slope_category TEXT DEFAULT 'flat';
ALTER PUBLICATION supabase_realtime ADD TABLE public.lots;