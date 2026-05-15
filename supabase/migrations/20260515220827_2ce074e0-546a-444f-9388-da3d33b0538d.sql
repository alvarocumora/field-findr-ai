
CREATE TABLE public.tasaciones_publicadas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid,
  publisher_user_id uuid NOT NULL,
  comuna text,
  region text,
  direccion text,
  rol text,
  valor_uf numeric,
  valor_clp numeric,
  valor_m2_uf numeric,
  superficie_m2 numeric,
  fecha_emision text,
  tasador_nombre text,
  lang text DEFAULT 'es',
  pdf_path text NOT NULL,
  pdf_sha256 text NOT NULL,
  pdf_final_path text,
  pdf_final_sha256 text,
  firma_data_hash text,
  payload_json jsonb NOT NULL,
  payload_hash text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  revoked_at timestamptz,
  revoked_reason text,
  blockchain_anchor jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasaciones_publicadas_pdf_sha256 ON public.tasaciones_publicadas(pdf_sha256);
CREATE INDEX idx_tasaciones_publicadas_pdf_final_sha256 ON public.tasaciones_publicadas(pdf_final_sha256);
CREATE INDEX idx_tasaciones_publicadas_listing ON public.tasaciones_publicadas(listing_id);

ALTER TABLE public.tasaciones_publicadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published appraisals"
  ON public.tasaciones_publicadas FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can publish appraisals"
  ON public.tasaciones_publicadas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = publisher_user_id);

CREATE POLICY "Admins can update appraisals"
  ON public.tasaciones_publicadas FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete appraisals"
  ON public.tasaciones_publicadas FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_tasaciones_publicadas_updated_at
  BEFORE UPDATE ON public.tasaciones_publicadas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.find_tasacion_by_hash(_hash text)
RETURNS TABLE (
  id uuid,
  comuna text,
  region text,
  direccion text,
  fecha_emision text,
  tasador_nombre text,
  valor_uf numeric,
  valor_clp numeric,
  revoked_at timestamptz,
  matched_field text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, comuna, region, direccion, fecha_emision, tasador_nombre,
         valor_uf, valor_clp, revoked_at,
         CASE WHEN pdf_sha256 = _hash THEN 'pdf' ELSE 'pdf_final' END AS matched_field
  FROM public.tasaciones_publicadas
  WHERE pdf_sha256 = _hash OR pdf_final_sha256 = _hash
  LIMIT 1
$$;
