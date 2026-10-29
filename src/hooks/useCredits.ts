import type { Tables } from '@/integrations/supabase/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Credit {
  id: string;
  reservation_id: string | null;
  lot_id: string;
  user_id: string;
  buyer_user_id: string | null;
  total_amount: number;
  down_payment: number;
  financed_amount: number;
  interest_rate: number;
  term_months: number;
  monthly_payment: number;
  currency: string;
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
  contract_url: string | null;
  started_at: string;
  next_payment_date: string | null;
  created_at: string;
  updated_at: string;
  lots?: Pick<Tables<'lots'>, 'lot_number' | 'name' | 'area' | 'project_id'> & { projects?: Pick<Tables<'projects'>, 'name'> | null };
}

export interface CreditPayment {
  id: string;
  credit_id: string;
  payment_number: number;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  payment_method: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
}

export function useCredits() {
  const { user } = useAuth();

  const creditsQuery = useQuery({
    queryKey: ['credits', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('credits')
        .select('*, lots(lot_number, name, area, project_id, projects(name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Credit[];
    },
    enabled: !!user,
  });

  const stats = {
    totalFinanced: creditsQuery.data?.reduce((s, c) => s + Number(c.financed_amount), 0) || 0,
    activeCount: creditsQuery.data?.filter(c => c.status === 'active').length || 0,
    defaultedCount: creditsQuery.data?.filter(c => c.status === 'defaulted').length || 0,
  };

  return { ...creditsQuery, stats };
}

export function useCreditPayments(creditId: string | null) {
  return useQuery({
    queryKey: ['credit-payments', creditId],
    queryFn: async () => {
      if (!creditId) return [];
      const { data, error } = await supabase
        .from('credit_payments')
        .select('*')
        .eq('credit_id', creditId)
        .order('payment_number', { ascending: true });
      if (error) throw error;
      return (data || []) as CreditPayment[];
    },
    enabled: !!creditId,
  });
}

export function useCreateCredit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credit: {
      reservation_id?: string;
      lot_id: string;
      user_id: string;
      buyer_user_id?: string;
      total_amount: number;
      down_payment: number;
      financed_amount: number;
      interest_rate: number;
      term_months: number;
      monthly_payment: number;
      currency?: string;
      payments: { payment_number: number; amount: number; due_date: string }[];
    }) => {
      const { payments, ...creditData } = credit;
      const { data: newCredit, error } = await supabase
        .from('credits')
        .insert({
          ...creditData,
          next_payment_date: payments[0]?.due_date || null,
        })
        .select()
        .single();
      if (error) throw error;

      if (payments.length > 0) {
        const { error: pErr } = await supabase
          .from('credit_payments')
          .insert(payments.map(p => ({ ...p, credit_id: newCredit.id })));
        if (pErr) throw pErr;
      }
      return newCredit;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['credits'] }),
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ paymentId, paidDate, method }: { paymentId: string; paidDate: string; method?: string }) => {
      const { error } = await supabase
        .from('credit_payments')
        .update({ status: 'paid', paid_date: paidDate, payment_method: method || null })
        .eq('id', paymentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-payments'] });
      queryClient.invalidateQueries({ queryKey: ['credits'] });
    },
  });
}

export function generateAmortizationSchedule(
  financed: number, rate: number, months: number, startDate: Date
) {
  const monthlyRate = rate / 100 / 12;
  const payment = monthlyRate > 0
    ? (financed * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
    : financed / months;

  const schedule: { payment_number: number; amount: number; due_date: string }[] = [];
  for (let i = 0; i < months; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    schedule.push({
      payment_number: i + 1,
      amount: Math.round(payment),
      due_date: dueDate.toISOString(),
    });
  }
  return { monthlyPayment: Math.round(payment), schedule };
}
