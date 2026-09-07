import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicSalesQuote {
  quote_number: number; project_name: string | null; lot_label: string | null; lot_area: number | null;
  customer_name: string; currency: string; list_price: number; discount_amount: number;
  quoted_price: number; valid_until: string; status: string; notes: string | null;
}

export const usePublicSalesQuote = (token?: string) => {
  useEffect(() => {
    if (token) void (supabase.rpc as CallableFunction)('track_sales_quote_view', { p_token: token });
  }, [token]);

  return useQuery({
    queryKey: ['public-sales-quote', token],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as CallableFunction)('get_public_sales_quote', { p_token: token });
      if (error) throw error;
      return ((data ?? []) as PublicSalesQuote[])[0] ?? null;
    },
    enabled: !!token,
  });
};
