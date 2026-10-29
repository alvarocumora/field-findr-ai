import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface EnrichedPayment {
  id: string;
  credit_id: string;
  payment_number: number;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  payment_method: string | null;
  receipt_url: string | null;
  notes: string | null;
  credit_name: string;
}

export function useAllCreditPayments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-credit-payments', user?.id],
    queryFn: async (): Promise<EnrichedPayment[]> => {
      if (!user) return [];

      // Get user's credits with lot info
      const { data: credits = [] } = await supabase
        .from('credits')
        .select('id, lot_id, lots(lot_number, projects(name))')
        .eq('user_id', user.id);

      if (credits.length === 0) return [];

      const creditIds = credits.map(c => c.id);
      const creditMap = new Map(credits.map((c) => [
        c.id,
        `${c.lots?.projects?.name || 'Proyecto'} — Lote ${c.lots?.lot_number || '?'}`,
      ]));

      const { data: payments = [] } = await supabase
        .from('credit_payments')
        .select('*')
        .in('credit_id', creditIds)
        .order('due_date', { ascending: true });

      return payments.map((p) => ({
        ...p,
        credit_name: creditMap.get(p.credit_id) || 'Crédito',
      }));
    },
    enabled: !!user,
  });
}
