import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

export type CommercialPlanLeadStatus = 'new' | 'contacted' | 'qualified' | 'closed' | 'lost';

export type CommercialPlanLeadInput = {
  planSlug: string;
  source?: string;
  companyName?: string;
  contactName?: string;
  email: string;
  phone?: string;
  message?: string;
  metadata?: Record<string, unknown>;
};

export type CommercialPlanLead = {
  id: string;
  plan_slug: string;
  source: string | null;
  company_name: string | null;
  contact_name: string | null;
  email: string;
  phone: string | null;
  message: string | null;
  status: CommercialPlanLeadStatus;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

type CommercialPlanLeadRow = CommercialPlanLead;

const clean = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const commercialPlanLeadsTable = () => (supabase as unknown as {
  from: (table: 'commercial_plan_leads') => {
    insert: (row: {
      plan_slug: string;
      source: string | null;
      company_name: string | null;
      contact_name: string | null;
      email: string;
      phone: string | null;
      message: string | null;
      metadata: Record<string, unknown>;
    }) => {
      select: (columns: string) => {
        single: () => Promise<{ data: CommercialPlanLeadRow | null; error: Error | null }>;
      };
    };
    select: (columns: string) => {
      order: (column: string, options?: { ascending?: boolean }) => {
        limit: (count: number) => Promise<{ data: CommercialPlanLeadRow[] | null; error: Error | null }>;
      };
    };
    update: (row: Partial<Pick<CommercialPlanLeadRow, 'status'>>) => {
      eq: (column: string, value: string) => {
        select: (columns: string) => {
          single: () => Promise<{ data: CommercialPlanLeadRow | null; error: Error | null }>;
        };
      };
    };
  };
}).from('commercial_plan_leads');

export const useCreateCommercialPlanLead = () => {
  return useMutation({
    mutationFn: async (input: CommercialPlanLeadInput) => {
      const email = input.email.trim().toLowerCase();

      if (!email) {
        throw new Error('El email es obligatorio.');
      }

      const { data, error } = await commercialPlanLeadsTable()
        .insert({
          plan_slug: input.planSlug,
          source: clean(input.source),
          company_name: clean(input.companyName),
          contact_name: clean(input.contactName),
          email,
          phone: clean(input.phone),
          message: clean(input.message),
          metadata: input.metadata ?? {},
        })
        .select('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('No se pudo registrar el lead comercial.');

      return data;
    },
  });
};

export const useAdminCommercialPlanLeads = (limit = 100) => {
  return useQuery({
    queryKey: ['commercial-plan-leads', 'admin', limit],
    queryFn: async () => {
      const { data, error } = await commercialPlanLeadsTable()
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data ?? [];
    },
  });
};

export const useUpdateCommercialPlanLeadStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CommercialPlanLeadStatus }) => {
      const { data, error } = await commercialPlanLeadsTable()
        .update({ status })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('No se pudo actualizar el lead comercial.');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commercial-plan-leads'] });
    },
  });
};
