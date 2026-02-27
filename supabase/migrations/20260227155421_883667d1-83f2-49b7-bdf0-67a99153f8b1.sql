
-- Document types for transactions
CREATE TYPE public.transaction_doc_type AS ENUM (
  'cedula_identidad',
  'dominio_vigente',
  'certificado_hipotecas',
  'plano_subdivision',
  'certificado_informaciones_previas',
  'promesa_compraventa',
  'escritura_publica',
  'inscripcion_cbr',
  'comprobante_pago',
  'poder_notarial',
  'certificado_deuda',
  'otro'
);

CREATE TYPE public.doc_status AS ENUM (
  'pending',
  'uploaded',
  'under_review',
  'approved',
  'rejected',
  'expired'
);

-- Transaction documents table
CREATE TABLE public.transaction_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE NOT NULL,
  doc_type public.transaction_doc_type NOT NULL,
  status public.doc_status NOT NULL DEFAULT 'pending',
  file_url TEXT,
  file_name TEXT,
  uploaded_by UUID,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transaction_documents ENABLE ROW LEVEL SECURITY;

-- Project owners can manage docs for their lots' reservations
CREATE POLICY "Project owners manage transaction docs"
ON public.transaction_documents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM reservations r
    JOIN lots l ON l.id = r.lot_id
    JOIN projects p ON p.id = l.project_id
    WHERE r.id = transaction_documents.reservation_id
    AND p.user_id = auth.uid()
  )
);

-- Buyers can view and upload docs for their reservations
CREATE POLICY "Buyers can view their transaction docs"
ON public.transaction_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.id = transaction_documents.reservation_id
    AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Buyers can upload their transaction docs"
ON public.transaction_documents FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.id = transaction_documents.reservation_id
    AND r.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.id = transaction_documents.reservation_id
    AND r.user_id = auth.uid()
  )
);

-- Admins manage all
CREATE POLICY "Admins manage all transaction docs"
ON public.transaction_documents FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated at trigger
CREATE TRIGGER update_transaction_documents_updated_at
BEFORE UPDATE ON public.transaction_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notification trigger for deadline approaching (creates notification when doc deadline is < 3 days away)
CREATE OR REPLACE FUNCTION public.notify_doc_deadline_approaching()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _project_owner_id UUID;
  _project_name TEXT;
  _buyer_name TEXT;
BEGIN
  -- Only on insert or when deadline is set
  IF NEW.deadline IS NOT NULL AND NEW.status IN ('pending', 'uploaded', 'under_review') THEN
    SELECT p.user_id, p.name, r.buyer_name
    INTO _project_owner_id, _project_name, _buyer_name
    FROM reservations r
    JOIN lots l ON l.id = r.lot_id
    JOIN projects p ON p.id = l.project_id
    WHERE r.id = NEW.reservation_id;

    -- Notify if deadline is within 3 days
    IF NEW.deadline <= now() + interval '3 days' AND _project_owner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
      VALUES (
        _project_owner_id,
        'system',
        'Documento por vencer',
        'El documento "' || NEW.doc_type || '" de ' || COALESCE(_buyer_name, 'un comprador') || ' en ' || COALESCE(_project_name, 'tu proyecto') || ' vence pronto.',
        '/asesor/closing',
        jsonb_build_object('document_id', NEW.id, 'reservation_id', NEW.reservation_id, 'deadline', NEW.deadline)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_doc_deadline
AFTER INSERT OR UPDATE ON public.transaction_documents
FOR EACH ROW EXECUTE FUNCTION public.notify_doc_deadline_approaching();

-- Storage bucket for transaction documents
INSERT INTO storage.buckets (id, name, public) VALUES ('transaction-documents', 'transaction-documents', false);

-- Storage policies
CREATE POLICY "Project owners can upload transaction docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'transaction-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Project owners can view transaction docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'transaction-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Project owners can delete transaction docs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'transaction-documents'
  AND auth.uid() IS NOT NULL
);
