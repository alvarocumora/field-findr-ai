import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export type VisitOutcome = 'interested' | 'needs_follow_up' | 'not_interested' | 'reserved' | 'other';
export type VisitNextAction = 'quote' | 'reserve' | 'follow_up' | 'reschedule' | 'close' | 'none';

export type Visit = Omit<Tables<'visits'>, 'outcome' | 'next_action'> & {
  outcome: VisitOutcome | null;
  next_action: VisitNextAction | null;
};
export type VisitInsert = Omit<TablesInsert<'visits'>, 'outcome' | 'next_action'> & {
  outcome?: VisitOutcome | null;
  next_action?: VisitNextAction | null;
};
export type VisitUpdate = Omit<TablesUpdate<'visits'>, 'outcome' | 'next_action'> & {
  outcome?: VisitOutcome | null;
  next_action?: VisitNextAction | null;
};

export type VisitStatus =
  | 'scheduled' | 'confirmed' | 'done' | 'no_show' | 'cancelled' | 'rescheduled';

export const VISIT_STATUS: Record<VisitStatus, { label: string; className: string }> = {
  scheduled: { label: 'Agendada', className: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  confirmed: { label: 'Confirmada', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  done: { label: 'Realizada', className: 'bg-primary/15 text-primary border-primary/30' },
  no_show: { label: 'No asistió', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  cancelled: { label: 'Cancelada', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  rescheduled: { label: 'Reprogramada', className: 'bg-muted text-muted-foreground border-border' },
};

export const VISIT_MODES = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'tour', label: 'Tour guiado' },
];

export const VISIT_OUTCOMES: Array<{ value: VisitOutcome; label: string }> = [
  { value: 'interested', label: 'Interesado' },
  { value: 'needs_follow_up', label: 'Requiere seguimiento' },
  { value: 'not_interested', label: 'No interesado' },
  { value: 'reserved', label: 'Reserva realizada' },
  { value: 'other', label: 'Otro' },
];

export const VISIT_NEXT_ACTIONS: Array<{ value: VisitNextAction; label: string }> = [
  { value: 'quote', label: 'Enviar cotización' },
  { value: 'reserve', label: 'Reservar parcela' },
  { value: 'follow_up', label: 'Seguimiento' },
  { value: 'reschedule', label: 'Reagendar visita' },
  { value: 'close', label: 'Avanzar a cierre' },
  { value: 'none', label: 'Sin acción' },
];

export const useVisits = (projectId?: string) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['visits', user?.id, projectId ?? 'all'],
    queryFn: async () => {
      let request = supabase
        .from('visits')
        .select('*')
        .order('scheduled_at', { ascending: true });
      if (projectId) request = request.eq('project_id', projectId);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as Visit[];
    },
    enabled: !!user?.id,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['visits'] });

  const createVisit = useMutation({
    mutationFn: async (input: Omit<VisitInsert, 'user_id'>) => {
      if (!user?.id) throw new Error('Sesión requerida');
      const { data, error } = await supabase.from('visits')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error('No se pudo crear la visita.');
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Visita agendada'); },
    onError: (e: Error) => toast.error(`No se pudo agendar: ${e.message}`),
  });

  const updateVisit = useMutation({
    mutationFn: async ({ id, ...updates }: VisitUpdate & { id: string }) => {
      const { data, error } = await supabase.from('visits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error('No se pudo actualizar la visita.');
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Visita actualizada'); },
    onError: (e: Error) => toast.error(`No se pudo actualizar: ${e.message}`),
  });

  const deleteVisit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('visits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Visita eliminada'); },
    onError: (e: Error) => toast.error(`No se pudo eliminar: ${e.message}`),
  });

  return {
    visits: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createVisit,
    updateVisit,
    deleteVisit,
  };
};
