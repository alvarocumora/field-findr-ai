import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ReferralCommission {
  id: string;
  agent_id: string;
  referring_agent_id: string | null;
  listing_id: string | null;
  lead_id: string | null;
  reservation_id: string | null;
  lot_id: string | null;
  project_id: string | null;
  sale_amount: number;
  commission_rate: number;
  commission_amount: number;
  referral_rate: number;
  referral_amount: number;
  referral_status: 'none' | 'pending' | 'paid' | 'cancelled';
  status: string;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

/** Commissions where the current user is the *referring* broker. */
export const useReferralCommissionsEarned = (projectId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['referral-commissions', 'earned', user?.id, projectId ?? 'all'],
    queryFn: async () => {
      if (!user) return [];
      let request = supabase
        .from('agent_commissions')
        .select('*')
        .eq('referring_agent_id', user.id)
        .order('created_at', { ascending: false });
      if (projectId) request = request.eq('project_id', projectId);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as ReferralCommission[];
    },
    enabled: !!user,
  });
};

/** Commissions the listing owner (current user) owes to referring brokers. */
export const useReferralCommissionsOwed = (projectId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['referral-commissions', 'owed', user?.id, projectId ?? 'all'],
    queryFn: async () => {
      if (!user) return [];
      let request = supabase
        .from('agent_commissions')
        .select('*')
        .eq('agent_id', user.id)
        .not('referring_agent_id', 'is', null)
        .order('created_at', { ascending: false });
      if (projectId) request = request.eq('project_id', projectId);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as ReferralCommission[];
    },
    enabled: !!user,
  });
};

export const useMarkReferralPaid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commissionId: string) => {
      const { data, error } = await (supabase.rpc as CallableFunction)('mark_referral_paid', {
        p_commission_id: commissionId,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['agent-commissions'] });
      toast.success('Comisión de referido marcada como pagada');
    },
    onError: (e: Error) =>
      toast.error('Error al marcar como pagada', { description: e.message }),
  });
};

export interface CreateReferralLeadInput {
  listingId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  budgetMin?: number;
  budgetMax?: number;
}

export const useCreateReferralLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReferralLeadInput) => {
      const { data, error } = await (supabase.rpc as CallableFunction)('create_referral_lead', {
        p_listing_id: input.listingId,
        p_first_name: input.firstName,
        p_last_name: input.lastName ?? null,
        p_email: input.email ?? null,
        p_phone: input.phone ?? null,
        p_notes: input.notes ?? null,
        p_budget_min: input.budgetMin ?? null,
        p_budget_max: input.budgetMax ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Cliente referido con éxito', {
        description: 'Al concretarse la venta recibirás tu comisión automáticamente.',
      });
    },
    onError: (e: Error) =>
      toast.error('No se pudo referir al cliente', { description: e.message }),
  });
};
