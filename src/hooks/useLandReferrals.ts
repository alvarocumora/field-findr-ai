import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { CaptacionStatus } from '@/lib/captaciones/status';

// Nota: la tabla land_referrals aún no está en los tipos generados;
// se usa el mismo patrón de casts que useEnterprise hasta regenerarlos.

export interface LandReferral {
  id: string;
  referrer_id: string;
  title: string;
  region: string | null;
  comuna: string | null;
  address: string | null;
  size_m2: number | null;
  expected_price: number | null;
  owner_name: string;
  owner_phone: string | null;
  owner_email: string | null;
  description: string | null;
  links: string | null;
  status: CaptacionStatus;
  admin_notes: string | null;
  listing_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LandReferralInput {
  title: string;
  region?: string;
  comuna?: string;
  address?: string;
  size_m2?: number;
  expected_price?: number;
  owner_name: string;
  owner_phone?: string;
  owner_email?: string;
  description?: string;
  links?: string;
}

/** Captaciones del corredor actual (RLS limita a las propias). */
export const useMyLandReferrals = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['land-referrals', 'mine', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('land_referrals' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LandReferral[];
    },
  });
};

export const useCreateLandReferral = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LandReferralInput) => {
      if (!user) throw new Error('Debes iniciar sesión');
      const { data, error } = await supabase
        .from('land_referrals' as any)
        .insert({ ...input, referrer_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as LandReferral;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['land-referrals'] }),
  });
};

/** Cola de gerencia: todas las captaciones (RLS exige rol admin). */
export const useAdminLandReferrals = () => {
  return useQuery({
    queryKey: ['land-referrals', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('land_referrals' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LandReferral[];
    },
  });
};

export const useUpdateLandReferral = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; status?: CaptacionStatus; admin_notes?: string; listing_id?: string | null }) => {
      const { data, error } = await supabase
        .from('land_referrals' as any)
        .update(patch as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as LandReferral;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['land-referrals'] }),
  });
};
