import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { PublicLeadForm } from '@/lib/agency/leadForm';

export interface AgencyPublic {
  user_id: string;
  company_name: string | null;
  logo_url: string | null;
  bio: string | null;
  phone: string | null;
}

export interface AgencyProject {
  id: string;
  name: string;
  location: string | null;
  city: string | null;
  region: string | null;
  images: string[] | null;
  total_lots: number | null;
  available_lots: number | null;
  featured?: boolean | null;
}

/** Public read: resolve an agency by slug (RPC) + its active projects. */
export const useAgencyShowcase = (slug?: string) => {
  const agencyQ = useQuery({
    queryKey: ['agency', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as CallableFunction)('get_agency_by_slug', { p_slug: slug });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? null) as AgencyPublic | null;
    },
  });

  const userId = agencyQ.data?.user_id;
  const projectsQ = useQuery({
    queryKey: ['agency-projects', userId],
    enabled: !!userId,
    queryFn: async () => {
      const base = 'id, name, location, city, region, images, total_lots, available_lots';
      const build = (cols: string) =>
        supabase.from('projects').select(cols).eq('user_id', userId!).eq('status', 'active')
          .order('created_at', { ascending: false });
      // Prefer selecting `featured`, fall back if the column isn't there yet.
      let { data, error } = await build(`${base}, featured`);
      if (error && (error.code === '42703' || /featured/i.test(error.message ?? ''))) {
        ({ data, error } = await build(base));
      }
      if (error) throw error;
      // Featured projects first (stable — the query already orders by recency).
      return ((data ?? []) as unknown as AgencyProject[])
        .slice()
        .sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
    },
  });

  return {
    agency: agencyQ.data ?? null,
    projects: projectsQ.data ?? [],
    isLoading: agencyQ.isLoading || (!!userId && projectsQ.isLoading),
    notFound: !agencyQ.isLoading && !agencyQ.data,
  };
};

/** Public visitor sends an inquiry to the agency (creates a lead via RPC). */
export const useCreatePublicLead = () =>
  useMutation({
    mutationFn: async ({ slug, form, projectId }: { slug: string; form: PublicLeadForm; projectId?: string | null }) => {
      const { data, error } = await (supabase.rpc as CallableFunction)('create_public_lead', {
        p_slug: slug,
        p_first_name: form.firstName,
        p_email: form.email || null,
        p_phone: form.phone || null,
        p_message: form.message || null,
        p_project_id: projectId ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => toast.success('¡Gracias! La inmobiliaria te contactará pronto.'),
    onError: (error: Error) => toast.error('No se pudo enviar', { description: error.message }),
  });

export interface AgencyProfileForm {
  company_name: string | null;
  public_slug: string | null;
  logo_url: string | null;
  bio: string | null;
  phone: string | null;
  is_public: boolean;
}

/** Owner read/update of their own showcase branding. */
export const useAgencyProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['agency-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase.from as CallableFunction)('profiles')
        .select('company_name, public_slug, logo_url, bio, phone, is_public')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as AgencyProfileForm | null;
    },
  });

  const save = useMutation({
    mutationFn: async (form: AgencyProfileForm) => {
      if (!user?.id) throw new Error('Debes iniciar sesión');
      const { error } = await (supabase.from as CallableFunction)('profiles')
        .update({
          company_name: form.company_name,
          public_slug: form.public_slug,
          logo_url: form.logo_url,
          bio: form.bio,
          phone: form.phone,
          is_public: form.is_public,
        })
        .eq('user_id', user.id);
      if (error) {
        // Unique-violation on the slug (23505) → friendly message.
        if ((error as { code?: string }).code === '23505') {
          throw new Error('Ese enlace (slug) ya está en uso. Elige otro.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-profile'] });
      toast.success('Vitrina actualizada');
    },
    onError: (error: Error) => {
      toast.error('No se pudo guardar', { description: error.message });
    },
  });

  return { profile: query.data ?? null, isLoading: query.isLoading, save };
};
