import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MyPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  mercadopago_payment_id: string | null;
  created_at: string;
}

/**
 * Gateway payments of the logged-in user (reservation señas + subscriptions),
 * written by the MercadoPago webhook. RLS: owner-only SELECT.
 */
export const useMyPayments = (limit = 10) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-payments', user?.id, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('id, amount, currency, status, description, mercadopago_payment_id, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as MyPayment[];
    },
    enabled: !!user,
  });
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  in_process: 'En proceso',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  charged_back: 'Contracargo',
};
