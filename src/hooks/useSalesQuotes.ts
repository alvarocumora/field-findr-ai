import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type SalesQuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

export type SalesQuote = Omit<Tables<'sales_quotes'>, 'status'> & {
  status: SalesQuoteStatus;
};

export type CreateSalesQuoteInput = {
  project_id: string;
  lot_id: string;
  lead_id?: string | null;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  currency?: string;
  list_price: number;
  discount_amount?: number;
  quoted_price: number;
  valid_until: string;
  notes?: string | null;
};

type SalesQuoteInsert = TablesInsert<'sales_quotes'>;
type SalesQuoteUpdate = TablesUpdate<'sales_quotes'>;

export const useSalesQuotes = (limit = 100, projectId?: string) => useQuery({
  queryKey: ['sales-quotes', projectId ?? 'all', limit],
  queryFn: async () => {
    let request = supabase.from('sales_quotes')
      .select('*')
      .order('created_at', { ascending: false });
    if (projectId) request = request.eq('project_id', projectId);
    const { data, error } = await request.limit(limit);

    if (error) throw error;
    return (data ?? []) as SalesQuote[];
  },
});

export const useExpiringSalesQuotes = (hours = 72, projectId?: string) => useQuery({
  queryKey: ['sales-quotes', 'expiring', projectId ?? 'all', hours],
  queryFn: async () => {
    const now = new Date();
    const end = new Date(now.getTime() + hours * 60 * 60 * 1000);
    let request = supabase.from('sales_quotes')
      .select('*')
      .in('status', ['draft', 'sent', 'viewed']);
    if (projectId) request = request.eq('project_id', projectId);
    const { data, error } = await request
      .gte('valid_until', now.toISOString())
      .lte('valid_until', end.toISOString())
      .order('valid_until', { ascending: true });
    if (error) throw error;
    return (data ?? []) as SalesQuote[];
  },
  refetchInterval: 60_000,
});

export const useActiveSalesQuotesCount = (projectId?: string) => useQuery({
  queryKey: ['sales-quotes', 'active-count', projectId ?? 'all'],
  queryFn: async () => {
    let request = supabase.from('sales_quotes')
      .select('id', { count: 'exact', head: true })
      .in('status', ['draft', 'sent', 'viewed']);
    if (projectId) request = request.eq('project_id', projectId);
    const { count, error } = await request;

    if (error) throw error;
    return count ?? 0;
  },
});

export const useCreateSalesQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSalesQuoteInput) => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error('Debes iniciar sesión para crear una cotización.');

      if (!input.customer_name.trim()) throw new Error('El nombre del cliente es obligatorio.');
      if (input.list_price < 0 || input.discount_amount && input.discount_amount < 0) {
        throw new Error('Los montos de la cotización no son válidos.');
      }
      if (input.quoted_price < 0) throw new Error('El precio cotizado no puede ser negativo.');

      const { data, error } = await supabase.from('sales_quotes')
        .insert({
          ...input,
          customer_name: input.customer_name.trim(),
          customer_email: input.customer_email?.trim() || null,
          customer_phone: input.customer_phone?.trim() || null,
          currency: input.currency ?? 'CLP',
          discount_amount: input.discount_amount ?? 0,
          lead_id: input.lead_id ?? null,
          notes: input.notes?.trim() || null,
          agent_id: authData.user.id,
        })
        .select('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('No se pudo guardar la cotización.');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-quotes'] }),
  });
};

export const useMarkSalesQuoteSent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from('sales_quotes')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('No se pudo marcar la cotización como enviada.');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-quotes'] }),
  });
};
