import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import {
  DEFAULT_TEMPLATES,
  templateId,
  type NotificationAudience,
  type NotificationChannel,
  type NotificationEvent,
  type TemplateDefinition,
} from '@/lib/notifications/templates';

export interface ResolvedTemplate extends TemplateDefinition {
  enabled: boolean;
  isCustom: boolean;
}

interface SaveInput {
  event: NotificationEvent;
  channel: NotificationChannel;
  audience: NotificationAudience;
  subject?: string | null;
  body: string;
  enabled: boolean;
}

/** Plantillas por defecto mezcladas con las personalizaciones del agente. */
export const useNotificationTemplates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: overrides = [], isLoading } = useQuery({
    queryKey: ['notification-templates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const templates: ResolvedTemplate[] = useMemo(() => {
    const map = new Map(
      overrides.map((o) => [
        templateId({
          event: o.event as NotificationEvent,
          channel: o.channel as NotificationChannel,
          audience: o.audience as NotificationAudience,
        }),
        o,
      ]),
    );
    return DEFAULT_TEMPLATES.map((def) => {
      const custom = map.get(def.id);
      return {
        ...def,
        subject: custom?.subject ?? def.subject,
        body: custom?.body ?? def.body,
        enabled: custom?.enabled ?? true,
        isCustom: !!custom,
      };
    });
  }, [overrides]);

  const save = useMutation({
    mutationFn: async (input: SaveInput) => {
      if (!user?.id) throw new Error('Sesión requerida');
      const { error } = await supabase.from('notification_templates').upsert(
        {
          user_id: user.id,
          event: input.event,
          channel: input.channel,
          audience: input.audience,
          subject: input.subject ?? null,
          body: input.body,
          enabled: input.enabled,
        },
        { onConflict: 'user_id,event,channel,audience' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('Plantilla guardada');
    },
    onError: (e: Error) => toast.error('No se pudo guardar: ' + e.message),
  });

  const reset = useMutation({
    mutationFn: async (key: { event: string; channel: string; audience: string }) => {
      if (!user?.id) throw new Error('Sesión requerida');
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('user_id', user.id)
        .eq('event', key.event)
        .eq('channel', key.channel)
        .eq('audience', key.audience);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('Plantilla restaurada al texto original');
    },
    onError: (e: Error) => toast.error('No se pudo restaurar: ' + e.message),
  });

  const getTemplate = (id: string) => templates.find((t) => t.id === id);

  return { templates, getTemplate, isLoading, save, reset };
};
