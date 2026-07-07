CREATE TABLE IF NOT EXISTS public.shared_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  created_by uuid,
  lot_number text,
  title text,
  area numeric,
  polygon jsonb,
  latitude double precision,
  longitude double precision,
  design_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.shared_designs TO authenticated;
GRANT ALL ON public.shared_designs TO service_role;

ALTER TABLE public.shared_designs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners read own shared designs" ON public.shared_designs;
CREATE POLICY "Owners read own shared designs" ON public.shared_designs
  FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users create own shared designs" ON public.shared_designs;
CREATE POLICY "Users create own shared designs" ON public.shared_designs
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Owners delete own shared designs" ON public.shared_designs;
CREATE POLICY "Owners delete own shared designs" ON public.shared_designs
  FOR DELETE USING (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_shared_designs_created_by ON public.shared_designs(created_by);

CREATE OR REPLACE FUNCTION public.get_shared_design(p_token text)
RETURNS TABLE (
  id uuid,
  token text,
  lot_number text,
  title text,
  area numeric,
  polygon jsonb,
  latitude double precision,
  longitude double precision,
  design_json jsonb,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, token, lot_number, title, area, polygon, latitude, longitude, design_json, created_at
  FROM public.shared_designs
  WHERE token = p_token
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_shared_design(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_design(text) TO anon, authenticated;