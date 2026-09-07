import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type BuyerRequirementStatus = 'active' | 'matched' | 'converted' | 'archived';

export interface BuyerRequirement {
  id: string;
  broker_id: string;
  lead_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  region: string | null;
  commune: string | null;
  budget_min: number | null;
  budget_max: number | null;
  area_min: number | null;
  area_max: number | null;
  property_type: string | null;
  purpose: string | null;
  financing: string | null;
  urgency: string;
  status: BuyerRequirementStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuyerRequirementInput {
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  region?: string | null;
  commune?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  area_min?: number | null;
  area_max?: number | null;
  property_type?: string | null;
  purpose?: string | null;
  financing?: string | null;
  urgency?: string;
  notes?: string | null;
}

export interface BuyerMatch {
  lot_id: string;
  project_id: string;
  project_name: string;
  lot_name: string | null;
  lot_number: string | null;
  area: number;
  price: number;
  region: string | null;
  commune: string | null;
  score: number;
  criteria: Record<string, boolean>;
}

const dynamicTable = () => (supabase as unknown as {
  from: (table: string) => ReturnType<typeof supabase.from>;
}).from('buyer_requirements');

export const useBuyerRequirements = () =>
  useQuery({
    queryKey: ['buyer-requirements'],
    queryFn: async () => {
      const { data, error } = await dynamicTable()
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as BuyerRequirement[];
    },
  });

export const useCreateBuyerRequirement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BuyerRequirementInput) => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) throw new Error('Debes iniciar sesión');

      const { data, error } = await dynamicTable()
        .insert({ ...input, broker_id: authData.user.id })
        .select('*')
        .single();
      if (error) throw error;
      return data as unknown as BuyerRequirement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-requirements'] });
      toast.success('Demanda de comprador guardada');
    },
    onError: (error: Error) => {
      toast.error('No se pudo guardar la demanda', { description: error.message });
    },
  });
};

export const useBuyerMatches = (requirementId?: string) =>
  useQuery({
    queryKey: ['buyer-matches', requirementId],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as CallableFunction)('match_buyer_requirement', {
        p_requirement_id: requirementId,
        p_limit: 20,
      });
      if (error) throw error;
      return (data ?? []) as BuyerMatch[];
    },
    enabled: !!requirementId,
  });
