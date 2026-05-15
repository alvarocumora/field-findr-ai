-- Bucket privado para PDFs de tasación
INSERT INTO storage.buckets (id, name, public)
VALUES ('tasaciones', 'tasaciones', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas: usuarios autenticados pueden gestionar archivos del bucket
CREATE POLICY "Authenticated can upload tasaciones"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tasaciones');

CREATE POLICY "Authenticated can read tasaciones"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'tasaciones');

CREATE POLICY "Authenticated can update tasaciones"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tasaciones');

CREATE POLICY "Authenticated can delete tasaciones"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tasaciones');