import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useAgentCommissions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agent-commissions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('agent_commissions')
        .select('*, projects(name), lots(lot_number)')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
};

export const useAgentPerformanceGoals = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['agent-performance-goals', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('agent_goals')
        .select('*')
        .eq('agent_id', user.id)
        .lte('period_start', periodEnd)
        .gte('period_end', periodStart)
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCommissionSummary = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['commission-summary', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('agent_commissions')
        .select('commission_amount, status, created_at')
        .eq('agent_id', user.id);

      if (error) throw error;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const total = data?.reduce((s, c) => s + Number(c.commission_amount), 0) || 0;
      const pending = data?.filter(c => ['potential', 'reserved', 'earned', 'approved'].includes(c.status as string)).reduce((s, c) => s + Number(c.commission_amount), 0) || 0;
      const paid = data?.filter(c => c.status === 'paid').reduce((s, c) => s + Number(c.commission_amount), 0) || 0;
      const thisMonth = data?.filter(c => new Date(c.created_at) >= startOfMonth).reduce((s, c) => s + Number(c.commission_amount), 0) || 0;

      return { total, pending, paid, thisMonth, count: data?.length || 0 };
    },
    enabled: !!user,
  });
};

export const useCreateGoal = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (goal: {
      sales_target: number;
      units_target: number;
      leads_target: number;
      commission_target: number;
    }) => {
      if (!user) throw new Error('No user');

      const now = new Date();
      const period_start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const period_end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('agent_goals')
        .upsert({
          agent_id: user.id,
          period: 'monthly',
          period_start,
          period_end,
          ...goal,
        }, { onConflict: 'agent_id,period_start,period_end' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-performance-goals'] });
      toast.success('Meta guardada exitosamente');
    },
    onError: () => toast.error('Error al guardar la meta'),
  });
};

export const useCreateCommission = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (commission: {
      reservation_id?: string;
      lot_id?: string;
      project_id?: string;
      sale_amount: number;
      commission_rate: number;
      notes?: string;
    }) => {
      if (!user) throw new Error('No user');

      const commission_amount = (commission.sale_amount * commission.commission_rate) / 100;

      const { data, error } = await supabase
        .from('agent_commissions')
        .insert({
          agent_id: user.id,
          ...commission,
          commission_amount,
          status: 'earned',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-commissions'] });
      qc.invalidateQueries({ queryKey: ['commission-summary'] });
      toast.success('Comisión registrada');
    },
    onError: () => toast.error('Error al registrar comisión'),
  });
};
