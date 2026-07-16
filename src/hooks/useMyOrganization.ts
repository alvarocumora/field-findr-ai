import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { pickPrimaryOrganization, resolveTeamUserIds } from '@/lib/team/teamScope';

export interface MyOrganization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  logo_url: string | null;
}

export interface TeamScopeResult {
  /** Organización principal del usuario (propia o por membresía); null si no tiene. */
  organization: MyOrganization | null;
  /** user_ids del equipo (dueño + miembros), o [yo] si no hay organización. */
  teamUserIds: string[];
}

/**
 * Resuelve la organización del usuario y los user_ids de su equipo.
 * Base del scoping del dashboard de inmobiliaria: los datos agregados
 * siempre se limitan a estos ids, nunca a toda la plataforma.
 */
export const useMyOrganization = () => {
  const { user } = useAuth();

  return useQuery<TeamScopeResult>({
    queryKey: ['my-organization', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return { organization: null, teamUserIds: [] };

      const [ownedRes, membershipRes] = await Promise.all([
        supabase
          .from('organizations')
          .select('id, name, slug, owner_id, logo_url')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id),
      ]);
      // Fallar fuerte: un error silenciado aquí colapsaría el equipo al dueño
      // y el dashboard subcontaría a todo el equipo sin aviso.
      if (ownedRes.error) throw ownedRes.error;
      if (membershipRes.error) throw membershipRes.error;

      const owned = (ownedRes.data ?? []) as MyOrganization[];

      let memberOrgs: MyOrganization[] = [];
      const membershipIds = (membershipRes.data ?? []).map((m) => m.organization_id);
      if (owned.length === 0 && membershipIds.length > 0) {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, slug, owner_id, logo_url')
          .in('id', membershipIds)
          .order('created_at', { ascending: true });
        if (error) throw error;
        memberOrgs = (data ?? []) as MyOrganization[];
      }

      const organization = pickPrimaryOrganization(owned, memberOrgs);

      let memberIds: string[] = [];
      if (organization) {
        const { data: members, error } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', organization.id);
        if (error) throw error;
        memberIds = (members ?? []).map((m) => m.user_id);
      }

      return {
        organization,
        teamUserIds: resolveTeamUserIds(user.id, organization?.owner_id, memberIds),
      };
    },
  });
};
