import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { normalizePlanId, type PlanType } from '@/hooks/useSubscription';

/**
 * Visión de plataforma sobre las inmobiliarias (organizaciones).
 * Un único origen de cálculo: se cargan las tablas base una vez y se agregan
 * en memoria por empresa, para que listado y ficha nunca se contradigan.
 */

export interface AdminOrgMember {
  user_id: string;
  role: string;
  name: string;
  email: string | null;
  plan: PlanType | null;
}

export interface AdminOrgProject {
  id: string;
  name: string;
  status: string | null;
  total_lots: number | null;
  sold_lots: number | null;
  slug: string | null;
}

export interface AdminOrganizationRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  created_at: string;
  owner_id: string;
  ownerName: string;
  ownerEmail: string | null;
  plan: PlanType;
  planStatus: string;
  members: AdminOrgMember[];
  projects: AdminOrgProject[];
  unitsTotal: number;
  unitsSold: number;
  salesMonth: number;
  commissionsMonth: number;
  leadsMonth: number;
  lastActivity: string | null;
}

const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
};

const fullName = (p?: { first_name: string | null; last_name: string | null; email: string | null }) =>
  [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || p?.email || 'Sin nombre';

export const useAdminOrganizations = () =>
  useQuery<AdminOrganizationRow[]>({
    queryKey: ['admin-organizations'],
    staleTime: 60_000,
    queryFn: async () => {
      const since = monthStart();

      const [orgsRes, membersRes, profilesRes, subsRes, projectsRes, closingsRes, leadsRes] =
        await Promise.all([
          supabase.from('organizations').select('id, name, slug, logo_url, owner_id, created_at'),
          supabase.from('organization_members').select('organization_id, user_id, role'),
          supabase.from('profiles').select('user_id, first_name, last_name, email'),
          supabase.from('subscriptions').select('user_id, organization_id, plan_type, status, updated_at'),
          supabase
            .from('projects')
            .select('id, name, status, total_lots, sold_lots, slug, organization_id, user_id, updated_at'),
          supabase
            .from('sales_closings')
            .select('user_id, sale_amount, commission_amount, created_at')
            .gte('created_at', since),
          supabase.from('leads').select('user_id, created_at').gte('created_at', since),
        ]);

      for (const res of [orgsRes, membersRes, profilesRes, subsRes, projectsRes, closingsRes, leadsRes]) {
        if (res.error) throw res.error;
      }

      const profiles = new Map(
        (profilesRes.data ?? []).map((p) => [p.user_id, p as typeof p]),
      );
      const userSubs = new Map((subsRes.data ?? []).map((subscription) => [subscription.user_id, subscription]));
      const organizationSubs = new Map(
        (subsRes.data ?? [])
          .filter((subscription) => subscription.organization_id)
          .map((subscription) => [subscription.organization_id as string, subscription]),
      );

      return (orgsRes.data ?? []).map((org) => {
        const memberRows = (membersRes.data ?? []).filter((m) => m.organization_id === org.id);
        const teamIds = Array.from(new Set([org.owner_id, ...memberRows.map((m) => m.user_id)]));

        const members: AdminOrgMember[] = teamIds.map((uid) => {
          const p = profiles.get(uid);
          const sub = userSubs.get(uid);
          return {
            user_id: uid,
            role: uid === org.owner_id ? 'owner' : memberRows.find((m) => m.user_id === uid)?.role ?? 'member',
            name: fullName(p),
            email: p?.email ?? null,
            plan: sub ? normalizePlanId(sub.plan_type) : null,
          };
        });

        const projects: AdminOrgProject[] = (projectsRes.data ?? [])
          .filter((p) => p.organization_id === org.id || teamIds.includes(p.user_id))
          .map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            total_lots: p.total_lots,
            sold_lots: p.sold_lots,
            slug: p.slug,
          }));

        const closings = (closingsRes.data ?? []).filter((c) => teamIds.includes(c.user_id));
        const ownerSub = organizationSubs.get(org.id) ?? userSubs.get(org.owner_id);

        const activityDates = [
          ...(projectsRes.data ?? [])
            .filter((p) => p.organization_id === org.id || teamIds.includes(p.user_id))
            .map((p) => p.updated_at),
          ...closings.map((c) => c.created_at),
          ownerSub?.updated_at,
        ].filter(Boolean) as string[];

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          logo_url: org.logo_url,
          created_at: org.created_at,
          owner_id: org.owner_id,
          ownerName: fullName(profiles.get(org.owner_id)),
          ownerEmail: profiles.get(org.owner_id)?.email ?? null,
          plan: normalizePlanId(ownerSub?.plan_type),
          planStatus: ownerSub?.status ?? 'sin suscripción',
          members,
          projects,
          unitsTotal: projects.reduce((s, p) => s + (p.total_lots ?? 0), 0),
          unitsSold: projects.reduce((s, p) => s + (p.sold_lots ?? 0), 0),
          salesMonth: closings.reduce((s, c) => s + (c.sale_amount ?? 0), 0),
          commissionsMonth: closings.reduce((s, c) => s + (c.commission_amount ?? 0), 0),
          leadsMonth: (leadsRes.data ?? []).filter((l) => teamIds.includes(l.user_id)).length,
          lastActivity: activityDates.sort().at(-1) ?? org.created_at,
        };
      });
    },
  });

export const useAdminOrganization = (id?: string) => {
  const query = useAdminOrganizations();
  return {
    ...query,
    data: id ? query.data?.find((o) => o.id === id) : undefined,
  };
};

/** Cambia el plan de una empresa y mantiene compatibilidad con filas legacy. */
export const useAdminSetOrgPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      organizationId,
      ownerId,
      plan,
    }: {
      organizationId: string;
      ownerId: string;
      plan: PlanType;
    }) => {
      const organizationUpdate = await supabase
        .from('subscriptions')
        .update({ plan_type: plan })
        .eq('organization_id', organizationId)
        .select('id');
      if (organizationUpdate.error) throw organizationUpdate.error;

      if ((organizationUpdate.data ?? []).length === 0) {
        const legacyUpdate = await supabase
          .from('subscriptions')
          .update({ plan_type: plan, organization_id: organizationId })
          .eq('user_id', ownerId)
          .select('id');
        if (legacyUpdate.error) throw legacyUpdate.error;
        if ((legacyUpdate.data ?? []).length === 0) {
          const { error } = await supabase.from('subscriptions').insert({
            user_id: ownerId,
            organization_id: organizationId,
            plan_type: plan,
            status: plan === 'free' ? 'inactive' : 'active',
          });
          if (error) throw error;
        }
      }

      await supabase.from('audit_logs').insert({
        action: 'organization.plan_changed',
        entity_type: 'organization',
        entity_id: organizationId,
        details: { plan, owner_id: ownerId },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-organizations'] }),
  });
};
