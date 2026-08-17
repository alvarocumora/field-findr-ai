import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface SupportTicket {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  project_id: string | null;
  last_message_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface NewTicketInput {
  category: string;
  subject: string;
  description: string;
  priority?: string;
  project_id?: string | null;
}

/** Tickets del usuario autenticado (RLS ya limita el alcance). */
export const useMyTickets = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['support-tickets', 'mine', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<SupportTicket[]> => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user!.id)
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SupportTicket[];
    },
  });
};

/** Todos los tickets (solo admin, RLS lo valida). */
export const useAllTickets = (filters?: { status?: string; category?: string }) =>
  useQuery({
    queryKey: ['support-tickets', 'all', filters],
    queryFn: async (): Promise<SupportTicket[]> => {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('last_message_at', { ascending: false });
      if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters?.category && filters.category !== 'all') query = query.eq('category', filters.category);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as SupportTicket[];
    },
  });

export const useTicketMessages = (ticketId?: string) =>
  useQuery({
    queryKey: ['support-messages', ticketId],
    enabled: !!ticketId,
    queryFn: async (): Promise<SupportMessage[]> => {
      const { data, error } = await supabase
        .from('support_ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as SupportMessage[];
    },
  });

export const useCreateTicket = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: NewTicketInput) => {
      if (!user?.id) throw new Error('Debes iniciar sesión para abrir un ticket');
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          category: input.category,
          subject: input.subject.trim(),
          description: input.description.trim(),
          priority: input.priority ?? 'normal',
          project_id: input.project_id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as SupportTicket;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket creado. Te responderemos por aquí.');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useSendTicketMessage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      body,
      isInternal = false,
    }: { ticketId: string; body: string; isInternal?: boolean }) => {
      if (!user?.id) throw new Error('Sesión no válida');
      const { error } = await supabase.from('support_ticket_messages').insert({
        ticket_id: ticketId,
        sender_id: user.id,
        body: body.trim(),
        is_internal: isInternal,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['support-messages', vars.ticketId] });
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateTicket = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: { id: string; patch: Partial<Pick<SupportTicket, 'status' | 'priority' | 'assigned_to' | 'category'>> }) => {
      const payload: Record<string, unknown> = { ...patch };
      if (patch.status === 'resolved' || patch.status === 'closed') {
        payload.resolved_at = new Date().toISOString();
      }
      const { error } = await supabase.from('support_tickets').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket actualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
