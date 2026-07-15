import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

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

type CommercialPlanLeadRow = {
  id: string;
  plan_slug: string;
  source: string | null;
  company_name: string | null;
  contact_name: string | null;
  email: string;
  phone: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

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
