import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type AgentCommission = Omit<Tables<'agent_commissions'>, 'status'> & {
  status: 'potential' | 'reserved' | 'earned' | 'approved' | 'paid' | 'cancelled';
};

/**
 * Commissions ledger rows, optionally scoped to a project.
 * - 'mine' (default): sales the current user closed (agent_id). Captación rows
 *   where the user is only the referring broker are read with
 *   useReferralCommissionsEarned, so they are never counted twice.
 * - 'project': every row RLS lets the user see for the project (owners see all
 *   commissions of their projects, including the ones owed to brokers).
 */
export const useAgentCommissions = (projectId?: string, scope: 'mine' | 'project' = 'mine') => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agent-commissions', user?.id, projectId ?? 'all', scope],
    queryFn: async () => {
      let query = supabase
        .from('agent_commissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (scope === 'mine' && user) query = query.eq('agent_id', user.id);
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
      const { data, error } = await supabase.rpc('mark_commission_paid', {
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


export type CommissionEvent = Omit<Tables<'commission_events'>, 'details'> & {
  details: Record<string, unknown>;
};

export const useCommissionEvents = (commissionId?: string) =>
  useQuery({
    queryKey: ['commission-events', commissionId],
    queryFn: async () => {
      const { data, error } = await supabase.from('commission_events')
        .select('*')
        .eq('commission_id', commissionId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as CommissionEvent[];
    },
    enabled: !!commissionId,
  });
