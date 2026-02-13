import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
        .select('*, reservations(id, buyer_name, buyer_email, lot_id, lots(lot_number, name, project_id, projects(name)))')
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
