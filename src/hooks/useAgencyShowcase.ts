import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AgencyPublic {
  user_id: string;
  company_name: string | null;
  logo_url: string | null;
  bio: string | null;
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
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, location, city, region, images, total_lots, available_lots')
        .eq('user_id', userId!)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as AgencyProject[];
    },
  });

  return {
    agency: agencyQ.data ?? null,
    projects: projectsQ.data ?? [],
    isLoading: agencyQ.isLoading || (!!userId && projectsQ.isLoading),
    notFound: !agencyQ.isLoading && !agencyQ.data,
  };
};

export interface AgencyProfileForm {
  company_name: string | null;
  public_slug: string | null;
  logo_url: string | null;
  bio: string | null;
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
        .select('company_name, public_slug, logo_url, bio, is_public')
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
