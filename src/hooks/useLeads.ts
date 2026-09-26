import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type Lead = Tables<'leads'>;
export type LeadInsert = TablesInsert<'leads'>;
export type LeadUpdate = TablesUpdate<'leads'>;

export type LeadStatus = 'new' | 'contacted' | 'interested' | 'negotiating' | 'converted' | 'lost';

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: 'Nuevo', color: 'bg-blue-500' },
  contacted: { label: 'Contactado', color: 'bg-purple-500' },
  interested: { label: 'Interesado', color: 'bg-green-500' },
  negotiating: { label: 'Negociando', color: 'bg-yellow-500' },
  converted: { label: 'Convertido', color: 'bg-emerald-600' },
  lost: { label: 'Perdido', color: 'bg-red-500' },
};

export const useLeads = (projectId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading, error, refetch } = useQuery({
    queryKey: ['leads', user?.id, projectId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // RLS defines the accessible organization/project set. Filtering by the
      // creator here hid team leads from managers and shared workspaces.
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
    enabled: !!user?.id,
  });

  const createLead = useMutation({
    mutationFn: async (lead: Omit<LeadInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('No user authenticated');
      
      const { data, error } = await supabase
        .from('leads')
        .insert({ ...lead, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead creado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear lead: ' + error.message);
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ id, ...updates }: LeadUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead eliminado');
    },
    onError: (error) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });

  // Stats by status
  const getStatusCounts = () => {
    return leads.reduce((acc, lead) => {
      const status = (lead.status || 'new') as LeadStatus;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<LeadStatus, number>);
  };

  const stats = {
    total: leads.length,
    statusCounts: getStatusCounts(),
    withFollowUp: leads.filter(l => l.next_follow_up).length,
    thisWeek: leads.filter(l => {
      if (!l.next_follow_up) return false;
      const followUp = new Date(l.next_follow_up);
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return followUp >= now && followUp <= weekFromNow;
    }).length,
  };

  return {
    leads,
    isLoading,
    error,
    refetch,
    createLead,
    updateLead,
    deleteLead,
    stats,
    getStatusCounts,
  };
};
