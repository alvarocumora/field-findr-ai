import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { resolveTeamUserIds } from '@/lib/team/teamScope';
import {
  mergeOrganizationWorkspaces,
  organizationStorageKey,
  resolveActiveOrganization,
} from '@/lib/team/organizationWorkspace';

export interface MyOrganization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  logo_url: string | null;
}

export type OrganizationRole = 'owner' | 'admin' | 'member';

export interface TeamScopeResult {
  /** Workspace activo del usuario; null si todavía no pertenece a uno. */
  organization: MyOrganization | null;
  /** Todos los workspaces disponibles para permitir multi-inmobiliaria. */
  organizations: MyOrganization[];
  /** Rol del usuario dentro del workspace activo. */
  organizationRole: OrganizationRole | null;
  /** user_ids del equipo activo (dueño + miembros), o [yo] si no hay organización. */
  teamUserIds: string[];
}

const EMPTY_SCOPE: TeamScopeResult = {
  organization: null,
  organizations: [],
  organizationRole: null,
  teamUserIds: [],
};

/**
 * Resuelve todos los workspaces del usuario y el alcance del workspace activo.
 * Un corredor individual funciona como una organización de una persona; un
 * usuario de grupo puede cambiar entre organizaciones sin mezclar datos.
 */
export const useMyOrganization = () => {
  const { user } = useAuth();

  return useQuery<TeamScopeResult>({
    queryKey: ['my-organization', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return EMPTY_SCOPE;

      const [ownedRes, membershipRes] = await Promise.all([
        supabase
          .from('organizations')
          .select('id, name, slug, owner_id, logo_url')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', user.id),
      ]);

      // Fallar fuerte: un error silenciado aquí puede mezclar o subcontar equipos.
      if (ownedRes.error) throw ownedRes.error;
      if (membershipRes.error) throw membershipRes.error;

      const owned = (ownedRes.data ?? []) as MyOrganization[];
      const memberships = membershipRes.data ?? [];
      const membershipIds = [...new Set(memberships.map((membership) => membership.organization_id))];

      let memberOrganizations: MyOrganization[] = [];
      if (membershipIds.length > 0) {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, slug, owner_id, logo_url')
          .in('id', membershipIds)
          .order('created_at', { ascending: true });
        if (error) throw error;
        memberOrganizations = (data ?? []) as MyOrganization[];
      }

      const organizations = mergeOrganizationWorkspaces(owned, memberOrganizations);
      const preferredId =
        typeof window === 'undefined'
          ? null
          : window.localStorage.getItem(organizationStorageKey(user.id));
      const organization = resolveActiveOrganization(organizations, preferredId);

      let memberIds: string[] = [];
      if (organization) {
        const { data: members, error } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', organization.id);
        if (error) throw error;
        memberIds = (members ?? []).map((member) => member.user_id);
      }

      const membershipRole = memberships.find(
        (membership) => membership.organization_id === organization?.id,
      )?.role as Exclude<OrganizationRole, 'owner'> | undefined;

      return {
        organization,
        organizations,
        organizationRole: organization?.owner_id === user.id ? 'owner' : membershipRole ?? null,
        teamUserIds: resolveTeamUserIds(user.id, organization?.owner_id, memberIds),
      };
    },
  });
};

/**
 * Extiende el scope de organización con el cambio explícito de workspace.
 * Al cambiar se invalidan los datos dependientes para impedir que métricas,
 * CRM o inventario del workspace anterior queden visibles.
 */
export const useOrganizationWorkspace = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const query = useMyOrganization();

  const selectOrganization = useCallback(
    async (organizationId: string) => {
      if (!user || !query.data?.organizations.some((item) => item.id === organizationId)) return;

      window.localStorage.setItem(organizationStorageKey(user.id), organizationId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-organization', user.id] }),
        queryClient.invalidateQueries({ queryKey: ['team-members'] }),
        queryClient.invalidateQueries({ queryKey: ['agency-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['agency-agents'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['leads'] }),
      ]);
    },
    [query.data?.organizations, queryClient, user],
  );

  return { ...query, selectOrganization };
};
