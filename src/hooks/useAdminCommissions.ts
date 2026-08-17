import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminCommissionRow {
  id: string;
  agent_id: string;
  referring_agent_id: string | null;
  project_id: string | null;
  lot_id: string | null;
  listing_id: string | null;
  reservation_id: string | null;
  sale_amount: number;
  commission_rate: number;
  commission_amount: number;
  referral_rate: number | null;
  referral_amount: number | null;
  referral_status: string | null;
  status: string;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface CommissionRule {
  id: string;
  scope: 'default' | 'plan' | 'project';
  plan_type: string | null;
  project_id: string | null;
  commission_rate: number;
  referral_override_rate: number;
  is_active: boolean;
  notes: string | null;
}

/** Todas las comisiones de la plataforma (RLS: solo admin ve el total). */
export const useAllCommissions = () =>
  useQuery({
    queryKey: ['admin-commissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_commissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as AdminCommissionRow[];
    },
  });

export const useAdminUpdateCommission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      id: string;
      commission_rate?: number;
      commission_amount?: number;
      status?: string;
      notes?: string;
    }) => {
      const { error } = await supabase.rpc('admin_update_commission', {
        p_commission_id: v.id,
        p_commission_rate: v.commission_rate ?? null,
        p_commission_amount: v.commission_amount ?? null,
        p_status: v.status ?? null,
        p_notes: v.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-commissions'] });
      toast.success('Comisión actualizada');
    },
    onError: (e: Error) => toast.error('No se pudo actualizar', { description: e.message }),
  });
};

export const useAdminRegisterManualSale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      agentId: string;
      saleAmount: number;
      commissionRate?: number;
      projectId?: string | null;
      listingId?: string | null;
      referringAgentId?: string | null;
      referralRate?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase.rpc('admin_register_manual_sale', {
        p_agent_id: v.agentId,
        p_sale_amount: v.saleAmount,
        p_commission_rate: v.commissionRate ?? 3,
        p_project_id: v.projectId ?? null,
        p_lot_id: null,
        p_listing_id: v.listingId ?? null,
        p_referring_agent_id: v.referringAgentId ?? null,
        p_referral_rate: v.referralRate ?? 0,
        p_notes: v.notes ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-commissions'] });
      toast.success('Venta registrada');
    },
    onError: (e: Error) => toast.error('No se pudo registrar', { description: e.message }),
  });
};

export const useAdminVoidSale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; reason: string }) => {
      const { error } = await supabase.rpc('admin_void_sale', {
        p_commission_id: v.id,
        p_reason: v.reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-commissions'] });
      toast.success('Venta anulada');
    },
    onError: (e: Error) => toast.error('No se pudo anular', { description: e.message }),
  });
};

export const useCommissionRules = () =>
  useQuery({
    queryKey: ['commission-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_rules')
        .select('*')
        .order('scope', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CommissionRule[];
    },
  });

export const useUpsertCommissionRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Partial<CommissionRule>) => {
      if (rule.id) {
        const { id, ...patch } = rule;
        const { error } = await supabase.from('commission_rules').update(patch).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('commission_rules').insert({
          scope: rule.scope ?? 'plan',
          plan_type: rule.plan_type ?? null,
          project_id: rule.project_id ?? null,
          commission_rate: rule.commission_rate ?? 3,
          referral_override_rate: rule.referral_override_rate ?? 0,
          notes: rule.notes ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commission-rules'] });
      toast.success('Regla de comisión guardada');
    },
    onError: (e: Error) => toast.error('No se pudo guardar', { description: e.message }),
  });
};
