import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EventRecord {
  id: string; organizer_id: string; project_id: string | null; listing_id: string | null;
  title: string; slug: string; description: string | null; starts_at: string; ends_at: string | null;
  venue: string | null; address: string | null; capacity: number | null;
  status: 'draft' | 'published' | 'cancelled' | 'completed'; reminder_message: string | null;
  created_at: string; updated_at: string;
}
export interface EventRegistration {
  id: string; event_id: string; attendee_name: string; attendee_email: string;
  attendee_phone: string | null; status: string; checkin_code: string;
  lead_id: string | null; reservation_id: string | null; registered_at: string; checked_in_at: string | null;
}
export interface EventFunnel { registered: number; attended: number; leads: number; reservations: number; }

const table = (name: string) => (supabase as unknown as {
  from: (tableName: string) => ReturnType<typeof supabase.from>;
}).from(name);

export const usePublicEvents = () => useQuery({
  queryKey: ['events', 'public'],
  queryFn: async () => {
    const { data, error } = await table('events').select('*').eq('status', 'published').gte('starts_at', new Date().toISOString()).order('starts_at');
    if (error) throw error;
    return (data ?? []) as unknown as EventRecord[];
  },
});

export const useEventBySlug = (slug?: string) => useQuery({
  queryKey: ['event', slug],
  queryFn: async () => {
    const { data, error } = await table('events').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
    if (error) throw error;
    return data as unknown as EventRecord | null;
  },
  enabled: !!slug,
});

export const useRegisterForEvent = () => useMutation({
  mutationFn: async (input: { eventId: string; name: string; email: string; phone?: string }) => {
    const { data, error } = await (supabase.rpc as CallableFunction)('register_for_event', {
      p_event_id: input.eventId, p_name: input.name, p_email: input.email, p_phone: input.phone || null,
    });
    if (error) throw error;
    return (data as Array<{ registration_id: string; checkin_code: string }>)[0];
  },
  onSuccess: () => toast.success('Inscripción confirmada'),
  onError: (error: Error) => toast.error('No se pudo inscribir', { description: error.message }),
});

export const useMyEvents = () => useQuery({
  queryKey: ['events', 'mine'],
  queryFn: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];
    const { data, error } = await table('events').select('*').eq('organizer_id', auth.user.id).order('starts_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as EventRecord[];
  },
});

export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<EventRecord> & Pick<EventRecord, 'title' | 'slug' | 'starts_at'>) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('Debes iniciar sesión');
      const { data, error } = await table('events').insert({ ...input, organizer_id: auth.user.id }).select('*').single();
      if (error) throw error;
      return data as unknown as EventRecord;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); toast.success('Evento creado'); },
    onError: (error: Error) => toast.error('No se pudo crear', { description: error.message }),
  });
};

export const useEventRegistrations = (eventId?: string) => useQuery({
  queryKey: ['event-registrations', eventId],
  queryFn: async () => {
    const { data, error } = await table('event_registrations').select('*').eq('event_id', eventId).order('registered_at');
    if (error) throw error;
    return (data ?? []) as unknown as EventRegistration[];
  },
  enabled: !!eventId,
});

export const useEventFunnel = (eventId?: string) => useQuery({
  queryKey: ['event-funnel', eventId],
  queryFn: async () => {
    const { data, error } = await (supabase.rpc as CallableFunction)('get_event_funnel', { p_event_id: eventId });
    if (error) throw error;
    return ((data ?? []) as EventFunnel[])[0] ?? { registered: 0, attended: 0, leads: 0, reservations: 0 };
  },
  enabled: !!eventId,
});

export const useEventActions = () => {
  const qc = useQueryClient();
  const checkin = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await (supabase.rpc as CallableFunction)('checkin_event_attendee', { p_code: code });
      if (error) throw error; return data as string;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['event-registrations'] }); qc.invalidateQueries({ queryKey: ['event-funnel'] }); toast.success('Asistencia registrada'); },
    onError: (error: Error) => toast.error('Check-in falló', { description: error.message }),
  });
  const convert = useMutation({
    mutationFn: async (registrationId: string) => {
      const { data, error } = await (supabase.rpc as CallableFunction)('convert_event_registration_to_lead', { p_registration_id: registrationId });
      if (error) throw error; return data as string;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['event-registrations'] }); qc.invalidateQueries({ queryKey: ['event-funnel'] }); toast.success('Asistente convertido en lead'); },
    onError: (error: Error) => toast.error('Conversión falló', { description: error.message }),
  });
  return { checkin, convert };
};
