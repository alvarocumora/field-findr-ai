import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

export type SalesQuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

export type SalesQuote = {
  id: string;
  agent_id: string;
  quote_number: number;
  public_token: string;
  project_name_snapshot: string | null;
  lot_label_snapshot: string | null;
  lot_area_snapshot: number | null;
  sent_channel: string | null;
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

// Temporary typed wrapper until Supabase generated types include sales_quotes.
const quotesTable = () => (supabase as unknown as {
  from: (table: 'sales_quotes') => {
    insert: (row: SalesQuoteInsert) => {
      select: (columns: string) => {
        single: () => Promise<{ data: SalesQuote | null; error: Error | null }>;
      };
    };
    select: (columns: string) => {
      order: (column: string, options?: { ascending?: boolean }) => {
        limit: (count: number) => Promise<{ data: SalesQuote[] | null; error: Error | null }>;
      };
    };
    update: (row: SalesQuoteUpdate) => {
      eq: (column: string, value: string) => {
        select: (columns: string) => {
          single: () => Promise<{ data: SalesQuote | null; error: Error | null }>;
        };
      };
    };
  };
}).from('sales_quotes');

const quotesCountTable = () => (supabase as unknown as {
  from: (table: 'sales_quotes') => {
    select: (columns: string, options: { count: 'exact'; head: true }) => {
      in: (column: string, values: SalesQuoteStatus[]) => Promise<{ count: number | null; error: Error | null }>;
    };
  };
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

export const useExpiringSalesQuotes = (hours = 72) => useQuery({
  queryKey: ['sales-quotes', 'expiring', hours],
  queryFn: async () => {
    const now = new Date();
    const end = new Date(now.getTime() + hours * 60 * 60 * 1000);
    const { data, error } = await (supabase as any).from('sales_quotes')
      .select('*')
      .in('status', ['draft', 'sent', 'viewed'])
      .gte('valid_until', now.toISOString())
      .lte('valid_until', end.toISOString())
      .order('valid_until', { ascending: true });
    if (error) throw error;
    return (data ?? []) as SalesQuote[];
  },
  refetchInterval: 60_000,
});

export const useActiveSalesQuotesCount = () => useQuery({
  queryKey: ['sales-quotes', 'active-count'],
  queryFn: async () => {
    const { count, error } = await quotesCountTable()
      .select('id', { count: 'exact', head: true })
      .in('status', ['draft', 'sent', 'viewed']);

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
