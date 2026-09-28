import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';
import { useMyOrganization } from './useMyOrganization';
import { toast } from 'sonner';
import { mergeProjectScopes, resolveProjectDataScope } from '@/lib/projects/projectScope';

export type Project = Tables<'projects'>;
export type ProjectInsert = TablesInsert<'projects'>;
export type ProjectUpdate = TablesUpdate<'projects'>;

export const useProjects = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: team } = useMyOrganization();
  const projectScope = resolveProjectDataScope(
    team?.organization?.id,
    user?.id,
    team?.teamUserIds,
  );

  const { data: projects = [], isLoading, error, refetch } = useQuery({
    queryKey: [
      'projects',
      user?.id,
      projectScope.organizationId ?? 'solo',
      projectScope.legacyOwnerIds,
    ],
    queryFn: async () => {
      if (!user?.id) return [];

      // organization_id is the canonical tenant boundary. During migration we
      // also include old rows that still have no organization_id and belong to
      // a member of the active workspace. RLS remains the security boundary.
      if (projectScope.organizationId) {
        const [organizationProjects, legacyProjects] = await Promise.all([
          supabase
            .from('projects')
            .select('*')
            .eq('organization_id', projectScope.organizationId)
            .order('created_at', { ascending: false }),
          projectScope.legacyOwnerIds.length
            ? supabase
                .from('projects')
                .select('*')
                .is('organization_id', null)
                .in('user_id', projectScope.legacyOwnerIds)
                .order('created_at', { ascending: false })
            : Promise.resolve({ data: [] as Project[], error: null }),
        ]);

        if (organizationProjects.error) throw organizationProjects.error;
        if (legacyProjects.error) throw legacyProjects.error;

        return mergeProjectScopes(
          (organizationProjects.data ?? []) as Project[],
          (legacyProjects.data ?? []) as Project[],
        );
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user?.id,
  });

  const createProject = useMutation({
    mutationFn: async (project: Omit<ProjectInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('No user authenticated');
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...project,
          user_id: user.id,
          organization_id: projectScope.organizationId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Proyecto creado exitosamente');
    },
    onError: (error) => {
      toast.error('Error al crear proyecto: ' + error.message);
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: ProjectUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Proyecto actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Proyecto eliminado');
    },
    onError: (error) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });

  // Computed stats
  const stats = {
    total: projects.length,
    totalLots: projects.reduce((acc, p) => acc + (p.total_lots || 0), 0),
    soldLots: projects.reduce((acc, p) => acc + (p.sold_lots || 0), 0),
    availableLots: projects.reduce((acc, p) => acc + (p.available_lots || 0), 0),
    reservedLots: projects.reduce((acc, p) => acc + (p.reserved_lots || 0), 0),
  };

  return {
    projects,
    isLoading,
    error,
    refetch,
    createProject,
    updateProject,
    deleteProject,
    stats,
  };
};
