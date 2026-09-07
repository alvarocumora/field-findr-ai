import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface BrokerApplication {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  country: string;
  region: string | null;
  city: string | null;
  company_name: string | null;
  tax_id: string | null;
  experience_years: number | null;
  specialty: string | null;
  socials: string | null;
  motivation: string | null;
  source: string | null;
  invited_by_code: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface BrokerProfile {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  level: string;
  base_commission_rate: number;
  network_override_rate: number;
  zones: string[];
  specialties: string[];
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
  company_name: string | null;
  invite_code: string;
  referred_by: string | null;
  is_active: boolean;
  is_public: boolean;
  public_contact_opt_in: boolean;
  verified_at: string | null;
  onboarding_step: number;
  created_at: string;
}

export interface BrokerRankingRow {
  slug: string;
  display_name: string;
  company_name: string | null;
  avatar_url: string | null;
  level: string;
  zones: string[] | null;
  bio: string | null;
  sales_count: number;
  projects_count: number;
}

export interface ProjectBrokerAssignment {
  id: string;
  project_id: string;
  broker_id: string;
  owner_id: string;
  commission_rate: number;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  message: string | null;
  created_at: string;
}

export interface BrokerApplicationInput {
  fullName: string;
  email: string;
  phone?: string;
  country?: string;
  region?: string;
  city?: string;
  companyName?: string;
  taxId?: string;
  experienceYears?: number;
  specialty?: string;
  socials?: string;
  motivation?: string;
  source?: string;
  invitedByCode?: string;
}

/** Postulación pública para entrar a la comunidad de brokers. */
export const useSubmitBrokerApplication = () =>
  useMutation({
    mutationFn: async (input: BrokerApplicationInput) => {
      const { data, error } = await supabase.rpc('submit_broker_application', {
        p_full_name: input.fullName,
        p_email: input.email,
        p_phone: input.phone ?? null,
        p_country: input.country ?? 'CL',
        p_region: input.region ?? null,
        p_city: input.city ?? null,
        p_company_name: input.companyName ?? null,
        p_tax_id: input.taxId ?? null,
        p_experience_years: input.experienceYears ?? null,
        p_specialty: input.specialty ?? null,
        p_socials: input.socials ?? null,
        p_motivation: input.motivation ?? null,
        p_source: input.source ?? null,
        p_invited_by_code: input.invitedByCode ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onError: (e: Error) =>
      toast.error('No pudimos enviar tu postulación', { description: e.message }),
  });

/** Cola de postulaciones (solo admin). */
export const useBrokerApplications = (status?: string) =>
  useQuery({
    queryKey: ['broker-applications', status ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('broker_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (status && status !== 'all') q = q.eq('status', status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as BrokerApplication[];
    },
  });

export const useApproveBrokerApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      applicationId: string;
      userId: string;
      level?: string;
      baseCommissionRate?: number;
    }) => {
      const { data, error } = await supabase.rpc('approve_broker_application', {
        p_application_id: v.applicationId,
        p_user_id: v.userId,
        p_level: v.level ?? 'starter',
        p_base_commission_rate: v.baseCommissionRate ?? 3,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broker-applications'] });
      qc.invalidateQueries({ queryKey: ['broker-profiles'] });
      toast.success('Broker aprobado y activado');
    },
    onError: (e: Error) => toast.error('No se pudo aprobar', { description: e.message }),
  });
};

export const useUpdateBrokerApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; status?: string; admin_notes?: string }) => {
      const { error } = await supabase
        .from('broker_applications')
        .update({ status: v.status, admin_notes: v.admin_notes })
        .eq('id', v.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broker-applications'] });
      toast.success('Postulación actualizada');
    },
    onError: (e: Error) => toast.error('No se pudo actualizar', { description: e.message }),
  });
};

/** Perfil de broker del usuario actual. */
export const useMyBrokerProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['broker-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('broker_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as BrokerProfile) ?? null;
    },
    enabled: !!user,
  });
};

export const useUpdateMyBrokerProfile = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (patch: Partial<BrokerProfile>) => {
      if (!user) throw new Error('Requiere sesión');
      const { error } = await supabase
        .from('broker_profiles')
        .update(patch)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broker-profile'] });
      toast.success('Perfil actualizado');
    },
    onError: (e: Error) => toast.error('No se pudo guardar', { description: e.message }),
  });
};

/** Todos los perfiles de broker (admin). */
export const useAllBrokerProfiles = () =>
  useQuery({
    queryKey: ['broker-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broker_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as BrokerProfile[];
    },
  });

export const useAdminUpdateBrokerProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string } & Partial<BrokerProfile>) => {
      const { id, ...patch } = v;
      const { error } = await supabase.from('broker_profiles').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broker-profiles'] });
      toast.success('Broker actualizado');
    },
    onError: (e: Error) => toast.error('No se pudo actualizar', { description: e.message }),
  });
};

/** Ranking público de la comunidad. */
export const useBrokerRanking = (limit = 20) =>
  useQuery({
    queryKey: ['broker-ranking', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_broker_ranking', { p_limit: limit });
      if (error) throw error;
      return (data ?? []) as BrokerRankingRow[];
    },
  });

/** Asignaciones proyecto ↔ broker (el RLS filtra por broker o dueño). */
export const useProjectAssignments = () =>
  useQuery({
    queryKey: ['project-broker-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_broker_assignments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProjectBrokerAssignment[];
    },
  });

export const useRequestProjectAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { projectId: string; message?: string }) => {
      const { data, error } = await supabase.rpc('request_project_assignment', {
        p_project_id: v.projectId,
        p_message: v.message ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-broker-assignments'] });
      toast.success('Solicitud enviada', {
        description: 'El dueño del proyecto la revisará y te avisaremos.',
      });
    },
    onError: (e: Error) => toast.error('No se pudo solicitar', { description: e.message }),
  });
};

export const useDecideAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {
      id: string;
      status: 'approved' | 'rejected' | 'revoked';
      commission_rate?: number;
    }) => {
      const { error } = await supabase
        .from('project_broker_assignments')
        .update({
          status: v.status,
          commission_rate: v.commission_rate,
          decided_at: new Date().toISOString(),
        })
        .eq('id', v.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-broker-assignments'] });
      toast.success('Solicitud actualizada');
    },
    onError: (e: Error) => toast.error('No se pudo actualizar', { description: e.message }),
  });
};
