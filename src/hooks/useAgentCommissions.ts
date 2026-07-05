import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AgentCommission {
  id: string;
  agent_id: string;
  reservation_id: string | null;
  lot_id: string | null;
  project_id: string | null;
  sale_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string; // 'pending' | 'paid'
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

/** Commissions of the current agent, optionally scoped to a project. */
export const useAgentCommissions = (projectId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agent-commissions', user?.id, projectId ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('agent_commissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (projectId) query = query.eq('project_id', projectId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as AgentCommission[];
    },
    enabled: !!user,
  });
};

/** Mark one of the agent's pending commissions as paid (RPC-backed). */
export const useMarkCommissionPaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commissionId: string) => {
      // RPC added by migration 20260705220000 — not yet in generated types.
      const { data, error } = await (supabase.rpc as CallableFunction)('mark_commission_paid', {
        p_commission_id: commissionId,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-commissions'] });
      toast.success('Comisión marcada como pagada');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar la comisión', { description: error.message });
    },
  });
};
