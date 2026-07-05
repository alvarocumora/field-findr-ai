import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { generateContractPDF, type ContractPDFData, type ContractPDFResult } from '@/lib/contractPdfGenerator';

export type ClosingStepType = 'reserva' | 'promesa' | 'escritura' | 'inscripcion_cbr';
export type ClosingStepStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

export interface ClosingStep {
  id: string;
  reservation_id: string | null;
  credit_id: string | null;
  step_type: ClosingStepType;
  status: ClosingStepStatus;
  completed_at: string | null;
  document_url: string | null;
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
}

export const STEP_LABELS: Record<ClosingStepType, string> = {
  reserva: 'Reserva',
  promesa: 'Promesa',
  escritura: 'Escritura',
  inscripcion_cbr: 'Inscripción CBR',
};

export function useClosingSteps(reservationId?: string | null) {
  return useQuery({
    queryKey: ['closing-steps', reservationId],
    queryFn: async () => {
      if (!reservationId) return [];
      const { data, error } = await supabase
        .from('closing_steps')
        .select('*')
        .eq('reservation_id', reservationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as ClosingStep[];
    },
    enabled: !!reservationId,
  });
}

export function useAllClosingSteps() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['all-closing-steps', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('closing_steps')
        .select('*, reservations(id, buyer_name, buyer_email, buyer_phone, buyer_rut, reservation_amount, currency, paid_at, created_at, lot_id, lots(lot_number, name, area, price, project_id, projects(name, location, city, region, rol_number)))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as (ClosingStep & { reservations: any })[];
    },
    enabled: !!user,
  });
}

export function useUpdateClosingStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClosingStep> & { id: string }) => {
      const { error } = await supabase
        .from('closing_steps')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['closing-steps'] }),
  });
}

/**
 * Sign the promesa contract for a reservation: generates the contract PDF
 * with the buyer's signature embedded, uploads it to the private
 * transaction-documents bucket ({reservationId}/... path per RLS policy),
 * completes the promesa closing step with the document link, and stamps the
 * contract number on the reservation. Previously the signature was only a
 * toast — nothing was persisted.
 */
export function useSignContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      stepId,
      reservationId,
      contractData,
    }: {
      stepId: string;
      reservationId: string;
      contractData: ContractPDFData;
    }) => {
      const result = generateContractPDF(contractData, { output: 'blob' }) as ContractPDFResult;

      const path = `${reservationId}/promesa-firmada-${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('transaction-documents')
        .upload(path, result.blob, { upsert: true, contentType: 'application/pdf' });
      if (uploadError) throw uploadError;

      // Private bucket: store a long-lived signed URL so the document opens
      // from the timeline (10-year expiry).
      const { data: signed, error: signError } = await supabase.storage
        .from('transaction-documents')
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signError) throw signError;

      const { error: stepError } = await supabase
        .from('closing_steps')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          document_url: signed.signedUrl,
          notes: `Firmado digitalmente por ${contractData.buyerName} el ${new Date().toLocaleString('es-CL')}`,
        })
        .eq('id', stepId);
      if (stepError) throw stepError;

      const { error: resError } = await supabase
        .from('reservations')
        .update({ contract_id: result.contractNum })
        .eq('id', reservationId);
      if (resError) throw resError;

      return { documentUrl: signed.signedUrl, contractNum: result.contractNum };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closing-steps'] });
      queryClient.invalidateQueries({ queryKey: ['all-closing-steps'] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}
