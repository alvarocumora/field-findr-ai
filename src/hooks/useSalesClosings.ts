import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export type SalesClosing = Tables<'sales_closings'>;
export type SalesClosingInsert = TablesInsert<'sales_closings'>;
export type SalesClosingUpdate = TablesUpdate<'sales_closings'>;

export type ClosingStatus = 'draft' | 'contract_sent' | 'signed' | 'closed' | 'void';

export const CLOSING_STATUS: Record<ClosingStatus, { label: string; className: string }> = {
  draft: { label: 'Borrador', className: 'bg-muted text-muted-foreground border-border' },
  contract_sent: { label: 'Contrato enviado', className: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  signed: { label: 'Firmado', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  closed: { label: 'Cerrado', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  void: { label: 'Anulado', className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export const useSalesClosings = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['sales-closings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_closings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SalesClosing[];
    },
    enabled: !!user?.id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['sales-closings'] });
    qc.invalidateQueries({ queryKey: ['agent-commissions'] });
  };

  const createClosing = useMutation({
    mutationFn: async (input: Omit<SalesClosingInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('Sesión requerida');
      const { data, error } = await supabase
        .from('sales_closings')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as SalesClosing;
    },
    onSuccess: () => { invalidate(); toast.success('Cierre registrado'); },
    onError: (e: Error) => toast.error(`No se pudo registrar: ${e.message}`),
  });

  const updateClosing = useMutation({
    mutationFn: async ({ id, ...updates }: SalesClosingUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('sales_closings').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as SalesClosing;
    },
    onSuccess: (row) => {
      invalidate();
      toast.success(row.status === 'closed' ? 'Cierre completado y comisión generada' : 'Cierre actualizado');
    },
    onError: (e: Error) => toast.error(`No se pudo actualizar: ${e.message}`),
  });

  return {
    closings: query.data ?? [],
    isLoading: query.isLoading,
    createClosing,
    updateClosing,
  };
};
