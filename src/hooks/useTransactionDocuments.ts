import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type TransactionDocType =
  | 'cedula_identidad'
  | 'dominio_vigente'
  | 'certificado_hipotecas'
  | 'plano_subdivision'
  | 'certificado_informaciones_previas'
  | 'promesa_compraventa'
  | 'escritura_publica'
  | 'inscripcion_cbr'
  | 'comprobante_pago'
  | 'poder_notarial'
  | 'certificado_deuda'
  | 'otro';

export type DocStatus = 'pending' | 'uploaded' | 'under_review' | 'approved' | 'rejected' | 'expired';

export const DOC_TYPE_LABELS: Record<TransactionDocType, string> = {
  cedula_identidad: 'Cédula de Identidad',
  dominio_vigente: 'Dominio Vigente',
  certificado_hipotecas: 'Cert. Hipotecas y Gravámenes',
  plano_subdivision: 'Plano de Subdivisión',
  certificado_informaciones_previas: 'Cert. Informaciones Previas',
  promesa_compraventa: 'Promesa de Compraventa',
  escritura_publica: 'Escritura Pública',
  inscripcion_cbr: 'Inscripción CBR',
  comprobante_pago: 'Comprobante de Pago',
  poder_notarial: 'Poder Notarial',
  certificado_deuda: 'Certificado de Deuda',
  otro: 'Otro Documento',
};

export const DOC_STATUS_LABELS: Record<DocStatus, string> = {
  pending: 'Pendiente',
  uploaded: 'Subido',
  under_review: 'En Revisión',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  expired: 'Vencido',
};

export interface TransactionDocument {
  id: string;
  reservation_id: string;
  doc_type: TransactionDocType;
  status: DocStatus;
  file_url: string | null;
  file_name: string | null;
  uploaded_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  deadline: string | null;
  notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export function useTransactionDocuments(reservationId?: string | null) {
  return useQuery({
    queryKey: ['transaction-documents', reservationId],
    queryFn: async () => {
      if (!reservationId) return [];
      const { data, error } = await supabase
        .from('transaction_documents')
        .select('*')
        .eq('reservation_id', reservationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as TransactionDocument[];
    },
    enabled: !!reservationId,
  });
}

export function useAllTransactionDocuments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['all-transaction-documents', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('transaction_documents')
        .select('*, reservations(id, buyer_name, lot_id, lots(lot_number, project_id, projects(name)))')
        .order('deadline', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useCreateTransactionDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (doc: { reservation_id: string; doc_type: TransactionDocType; deadline?: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('transaction_documents')
        .insert({ ...doc, uploaded_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-documents'] });
      queryClient.invalidateQueries({ queryKey: ['all-transaction-documents'] });
      toast.success('Documento requerido agregado');
    },
    onError: (e) => toast.error('Error: ' + e.message),
  });
}

export function useUpdateTransactionDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TransactionDocument> & { id: string }) => {
      const { error } = await supabase
        .from('transaction_documents')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-documents'] });
      queryClient.invalidateQueries({ queryKey: ['all-transaction-documents'] });
    },
    onError: (e) => toast.error('Error: ' + e.message),
  });
}

export function useUploadTransactionFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentId, reservationId, file }: { documentId: string; reservationId: string; file: File }) => {
      const ext = file.name.split('.').pop();
      const path = `${reservationId}/${documentId}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('transaction-documents')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('transaction-documents')
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from('transaction_documents')
        .update({ file_url: publicUrl, file_name: file.name, status: 'uploaded' })
        .eq('id', documentId);
      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-documents'] });
      queryClient.invalidateQueries({ queryKey: ['all-transaction-documents'] });
      toast.success('Documento subido correctamente');
    },
    onError: (e) => toast.error('Error al subir: ' + e.message),
  });
}
