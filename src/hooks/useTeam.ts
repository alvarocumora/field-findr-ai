import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyOrganization } from '@/hooks/useMyOrganization';

export type OrgRole = 'owner' | 'admin' | 'member';

export interface TeamMember {
  user_id: string;
  org_role: OrgRole;
  name: string;
  email: string | null;
  avatar_url: string | null;
  is_owner: boolean;
}

/** Miembros de la organización propia (dueño incluido), con perfil. */
export const useTeamMembers = () => {
  const { data: team, isLoading: orgLoading } = useMyOrganization();
  const org = team?.organization ?? null;

  const query = useQuery({
    queryKey: ['team-members', org?.id],
    enabled: !!org,
    queryFn: async () => {
      if (!org) return [];

      const { data: members, error } = await supabase
        .from('organization_members')
        .select('user_id, role')
        .eq('organization_id', org.id);
      if (error) throw error;

      // El dueño ocupa asiento aunque no tenga fila de miembro.
      const roleByUser = new Map<string, OrgRole>();
      for (const m of members ?? []) roleByUser.set(m.user_id, m.role as OrgRole);
      if (!roleByUser.has(org.owner_id)) roleByUser.set(org.owner_id, 'owner');

      const userIds = [...roleByUser.keys()];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, avatar_url')
        .in('user_id', userIds);
      if (profilesError) throw profilesError;

      const profileByUser = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);

      const rank: Record<OrgRole, number> = { owner: 0, admin: 1, member: 2 };
      return userIds
        .map((userId): TeamMember => {
          const p = profileByUser.get(userId);
          const isOwner = userId === org.owner_id;
          return {
            user_id: userId,
            org_role: isOwner ? 'owner' : roleByUser.get(userId) ?? 'member',
            name: `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.trim() || p?.email || 'Invitación pendiente',
            email: p?.email ?? null,
            avatar_url: p?.avatar_url ?? null,
            is_owner: isOwner,
          };
        })
        .sort((a, b) => rank[a.org_role] - rank[b.org_role] || a.name.localeCompare(b.name));
    },
  });

  return { ...query, isLoading: orgLoading || query.isLoading, organization: org };
};

type TeamAction =
  | { action: 'invite'; email: string; first_name?: string; last_name?: string; org_role: 'admin' | 'member' }
  | { action: 'remove'; member_user_id: string }
  | { action: 'set_role'; member_user_id: string; org_role: 'admin' | 'member' };

/** Mutaciones del equipo vía edge function manage-team (asientos + auditoría en servidor). */
export const useTeamAction = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TeamAction) => {
      const { data, error } = await supabase.functions.invoke('manage-team', { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(typeof data.error === 'string' ? data.error : 'Error');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-members'] });
      qc.invalidateQueries({ queryKey: ['my-organization'] });
      qc.invalidateQueries({ queryKey: ['agency-stats'] });
      qc.invalidateQueries({ queryKey: ['agency-agents'] });
    },
  });
};
