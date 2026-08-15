import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { MeetingBlock, MeetingStatus, MeetingType } from '@/lib/meetings/status';

export type MeetingRequestInput = {
  meetingType: MeetingType;
  requesterName: string;
  requesterPhone: string;
  requesterEmail?: string;
  context?: string;
  preferredDate?: string;
  preferredBlock?: MeetingBlock;
  source?: string;
};

export type Meeting = {
  id: string;
  meeting_type: MeetingType;
  requester_name: string;
  requester_phone: string;
  requester_email: string | null;
  context: string | null;
  project_id: string | null;
  lot_id: string | null;
  preferred_date: string | null;
  preferred_block: MeetingBlock | null;
  scheduled_at: string | null;
  meeting_url: string | null;
  status: MeetingStatus;
  assigned_to: string | null;
  internal_notes: string | null;
  source: string;
  created_at: string;
  updated_at: string;
};

type MeetingInsert = {
  meeting_type: MeetingType;
  requester_name: string;
  requester_phone: string;
  requester_email: string | null;
  context: string | null;
  preferred_date: string | null;
  preferred_block: MeetingBlock | null;
  source: string;
};

type MeetingUpdate = Partial<
  Pick<Meeting, 'status' | 'scheduled_at' | 'meeting_url' | 'internal_notes' | 'assigned_to'>
>;

// La tabla `meetings` aún no existe en los types generados; wrapper tipado
// (mismo patrón que useCommercialPlanLead) hasta la próxima regeneración.
const meetingsTable = () => (supabase as unknown as {
  from: (table: 'meetings') => {
    insert: (row: MeetingInsert) => {
      select: (columns: string) => {
        single: () => Promise<{ data: Meeting | null; error: Error | null }>;
      };
    };
    select: (columns: string) => {
      order: (column: string, options?: { ascending?: boolean }) => {
        limit: (count: number) => Promise<{ data: Meeting[] | null; error: Error | null }>;
      };
    };
    update: (row: MeetingUpdate) => {
      eq: (column: string, value: string) => {
        select: (columns: string) => {
          single: () => Promise<{ data: Meeting | null; error: Error | null }>;
        };
      };
    };
  };
}).from('meetings');

const clean = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const useCreateMeetingRequest = () => {
  return useMutation({
    mutationFn: async (input: MeetingRequestInput) => {
      const name = input.requesterName.trim();
      const phone = input.requesterPhone.trim();

      if (!name) throw new Error('El nombre es obligatorio.');
      if (!phone) throw new Error('El teléfono es obligatorio.');

      const { data, error } = await meetingsTable()
        .insert({
          meeting_type: input.meetingType,
          requester_name: name,
          requester_phone: phone,
          requester_email: clean(input.requesterEmail),
          context: clean(input.context),
          preferred_date: clean(input.preferredDate),
          preferred_block: input.preferredBlock ?? null,
          source: input.source ?? 'web',
        })
        .select('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('No se pudo registrar la solicitud de reunión.');

      return data;
    },
  });
};

export const useMeetings = (limit = 200) => {
  return useQuery({
    queryKey: ['meetings', limit],
    queryFn: async () => {
      const { data, error } = await meetingsTable()
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data ?? [];
    },
  });
};

export const useUpdateMeeting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & MeetingUpdate) => {
      const { data, error } = await meetingsTable()
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('No se pudo actualizar la reunión.');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
};
