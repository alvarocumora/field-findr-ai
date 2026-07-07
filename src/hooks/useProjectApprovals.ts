import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ProjectApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ProjectApproval {
  id: string;
  project_id: string;
  reviewer_id: string | null;
  status: ProjectApprovalStatus;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface PendingProjectApprovalRow extends ProjectApproval {
  project: {
    id: string;
    name: string;
    description: string | null;
    location: string | null;
    region: string | null;
    city: string | null;
    total_lots: number | null;
    total_area: number | null;
    user_id: string;
    images: string[] | null;
    created_at: string;
  };
}

/** Latest approval row for a given project (used to show status banner to owner). */
export const useProjectApproval = (projectId?: string) => {
  return useQuery({
    queryKey: ['project-approval', projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<ProjectApproval | null> => {
      const { data, error } = await supabase
        .from('project_approvals' as never)
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ProjectApproval | null;
    },
  });
};

/** Admin queue: all pending project approvals with the underlying project joined. */
export const usePendingProjectApprovals = () => {
  return useQuery({
    queryKey: ['pending-project-approvals'],
    queryFn: async (): Promise<PendingProjectApprovalRow[]> => {
      const { data, error } = await supabase
        .from('project_approvals' as never)
        .select(
          `*, project:projects!inner (
            id, name, description, location, region, city,
            total_lots, total_area, user_id, images, created_at
          )`
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as PendingProjectApprovalRow[];
    },
  });
};

/** Admin action: approve or reject a project approval row. */
export const useReviewProjectApproval = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      rejection_reason,
    }: {
      id: string;
      status: 'approved' | 'rejected';
      rejection_reason?: string;
    }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('project_approvals' as never)
        .update({
          status,
          rejection_reason: status === 'rejected' ? rejection_reason ?? null : null,
          reviewed_at: new Date().toISOString(),
          reviewer_id: userRes.user?.id ?? null,
        } as never)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['pending-project-approvals'] });
      qc.invalidateQueries({ queryKey: ['project-approval'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: vars.status === 'approved' ? 'Loteo aprobado' : 'Loteo rechazado',
        description:
          vars.status === 'approved'
            ? 'El dueño fue notificado y el loteo ya es visible.'
            : 'El dueño fue notificado con el motivo del rechazo.',
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'No se pudo procesar la revisión';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });
};

/** Owner action: send a draft/rejected project back into the review queue. */
export const useSubmitProjectForReview = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'pending_review' })
        .eq('id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project-approval'] });
      toast({
        title: 'Enviado a revisión',
        description: 'Un administrador revisará tu loteo antes de publicarse.',
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'No se pudo enviar a revisión';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    },
  });
};
