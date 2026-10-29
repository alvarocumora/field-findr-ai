import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Organization {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  description: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export function useOrganizations() {
  const { user } = useAuth();

  const orgsQuery = useQuery({
    queryKey: ['organizations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Get orgs where user is owner or member
      const { data: memberOf } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id);

      const orgIds = (memberOf || []).map((m) => m.organization_id);

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .or(`owner_id.eq.${user.id}${orgIds.length > 0 ? `,id.in.(${orgIds.join(',')})` : ''}`);

      if (error) throw error;
      return (data || []) as unknown as Organization[];
    },
    enabled: !!user,
  });

  return orgsQuery;
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (org: { name: string; slug: string; description?: string; logo_url?: string; website?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('organizations')
        .insert({ ...org, owner_id: user.id })
        .select()
        .single();

      if (error) throw error;
      const newOrg = data;

      // Add owner as member
      await supabase
        .from('organization_members')
        .insert({ organization_id: newOrg.id, user_id: user.id, role: 'owner' });

      return newOrg;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  });
}

export function useWebhookSubscriptions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['webhook-subscriptions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('webhook_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (webhook: { url: string; events: string[]; secret: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('webhook_subscriptions')
        .insert({ ...webhook, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhook-subscriptions'] }),
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('webhook_subscriptions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhook-subscriptions'] }),
  });
}
