import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

export type SalesQuoteStatus = 'draft' | 'sent' | 'accepted' | 'expired' | 'cancelled';

export type SalesQuote = {
  id: string;
  agent_id: string;
  project_id: string;
  lot_id: string;
  lead_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  currency: string;
  list_price: number;
  discount_amount: number;
  quoted_price: number;
  valid_until: string;
  status: SalesQuoteStatus;
  sent_at: string | null;
  accepted_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
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

type SalesQuoteInsert = CreateSalesQuoteInput & { agent_id: string };
type SalesQuoteUpdate = Partial<Pick<SalesQuote, 'status' | 'sent_at' | 'accepted_at' | 'notes'>>;

type SalesQuoteTable = {
  insert: (row: SalesQuoteInsert) => {
    select: (columns: string) => {
      single: () => Promise<{ data: SalesQuote | null; error: Error | null }>;
    };
  };
  select: (columns: string, options?: { count?: 'exact'; head?: boolean }) => {
    order: (column: string, options?: { ascending?: boolean }) => {
      limit: (count: number) => Promise<{ data: SalesQuote[] | null; error: Error | null }>;
    };
    in: (column: string, values: string[]) => Promise<{ count: number | null; error: Error | null }>;
  };
  update: (row: SalesQuoteUpdate) => {
    eq: (column: string, value: string) => {
      select: (columns: string) => {
        single: () => Promise<{ data: SalesQuote | null; error: Error | null }>;
      };
    };
  };
};

const quotesTable = () => (supabase as unknown as {
  from: (table: 'sales_quotes') => SalesQuoteTable;
}).from('sales_quotes');

export const useSalesQuotes = (limit = 100) => useQuery({
  queryKey: ['sales-quotes', limit],
  queryFn: async () => {
    const { data, error } = await quotesTable()
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  },
});

export const useActiveSalesQuoteCount = () => useQuery({
  queryKey: ['sales-quotes', 'active-count'],
  queryFn: async () => {
    const { count, error } = await quotesTable()
      .select('id', { count: 'exact', head: true })
      .in('status', ['draft', 'sent']);

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

      const { data, error } = await quotesTable()
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
      const { data, error } = await quotesTable()
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
