import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSidebarCounts = () => {
  const { user } = useAuth();

  const { data: counts } = useQuery({
    queryKey: ['sidebar-counts', user?.id],
    queryFn: async () => {
      if (!user?.id) return { pendingReservations: 0, newLeads: 0, overduePayments: 0 };

      const [reservationsRes, leadsRes, paymentsRes] = await Promise.all([
        supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('status', 'pending_payment'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'new'),
        supabase.from('credit_payments').select('id', { count: 'exact', head: true }).eq('status', 'overdue'),
      ]);

      return {
        pendingReservations: reservationsRes.count || 0,
        newLeads: leadsRes.count || 0,
        overduePayments: paymentsRes.count || 0,
      };
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });

  return counts || { pendingReservations: 0, newLeads: 0, overduePayments: 0 };
};
