import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentPlan, PLAN_DETAILS, type Plan, type PlanType } from '@/hooks/useSubscription';
import { useMyOrganization } from '@/hooks/useMyOrganization';

export interface PlanLimitUsage {
  used: number;
  limit: number | null; // null = ilimitado
  remaining: number | null;
  percent: number; // 0-100 (100 si ilimitado con used > 0 pero visualmente lo mostramos 0)
  isUnlimited: boolean;
  isAtLimit: boolean;
  isNearLimit: boolean; // ≥ 80%
}

export interface PlanLimitsResult {
  plan: PlanType;
  planDetails: Plan;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<unknown>;
  listings: PlanLimitUsage;
  projects: PlanLimitUsage;
  featured: PlanLimitUsage;
  superFeatured: PlanLimitUsage;
  canCreateListing: boolean;
  canCreateProject: boolean;
  canUseFeatured: boolean;
  canUseSuperFeatured: boolean;
}

const buildUsage = (used: number, limit: number | null): PlanLimitUsage => {
  if (limit === null || limit >= 9999) {
    return {
      used,
      limit: null,
      remaining: null,
      percent: 0,
      isUnlimited: true,
      isAtLimit: false,
      isNearLimit: false,
    };
  }
  const remaining = Math.max(0, limit - used);
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;
  return {
    used,
    limit,
    remaining,
    percent,
    isUnlimited: false,
    isAtLimit: used >= limit,
    isNearLimit: percent >= 80,
  };
};

const monthStartISO = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
};

export const usePlanLimits = (): PlanLimitsResult => {
  const { user } = useAuth();
  const { plan, planDetails, isLoading: planLoading, isError: planError, refetch: refetchPlan } = useCurrentPlan();
  const { data: team, isLoading: teamLoading, isError: teamError, refetch: refetchTeam } = useMyOrganization();
  const queryClient = useQueryClient();
  const details = planDetails ?? PLAN_DETAILS.free;
  // A shared org plan is consumed by the whole team (owner + members), not
  // just the viewing user; resolveTeamUserIds falls back to [user.id] when
  // there is no organization, so a solo account counts only its own usage.
  const teamUserIds = useMemo(
    () => (team?.teamUserIds?.length ? team.teamUserIds : user ? [user.id] : []),
    [team?.teamUserIds, user],
  );
  const teamKey = useMemo(() => [...teamUserIds].sort().join(','), [teamUserIds]);

  const { data, isLoading, isError: usageError, refetch: refetchUsage } = useQuery({
    queryKey: ['plan-usage', teamKey],
    enabled: !!user && !teamLoading && !teamError,
    staleTime: 15_000,
    queryFn: async () => {
      if (teamUserIds.length === 0) return { listings: 0, projects: 0, featured: 0, superFeatured: 0 };

      const monthStart = monthStartISO();

      const [listingsRes, projectsRes, featuredRes, superRes] = await Promise.all([
        supabase
          .from('listings')
          .select('id', { count: 'exact', head: true })
          .in('user_id', teamUserIds)
          .in('status', ['active', 'pending_review', 'reserved']),
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .in('user_id', teamUserIds)
          .neq('status', 'archived'),
        supabase
          .from('listings')
          .select('id', { count: 'exact', head: true })
          .in('user_id', teamUserIds)
          .eq('featured', true)
          .gte('updated_at', monthStart),
        // super_featured actualmente no está en columna; se cuenta como featured con addon.
        Promise.resolve({ count: 0 }),
      ]);

      for (const result of [listingsRes, projectsRes, featuredRes]) {
        if (result.error) throw result.error;
        if (result.count === null || result.count === undefined) throw new Error('No pudimos verificar el uso de tu plan.');
      }
      return {
        listings: listingsRes.count ?? 0,
        projects: projectsRes.count ?? 0,
        featured: featuredRes.count ?? 0,
        superFeatured: (superRes as { count: number }).count ?? 0,
      };
    },
  });

  // Realtime: invalidar contadores cuando cambian listings / projects de cualquier miembro del equipo.
  useEffect(() => {
    if (!user || teamUserIds.length === 0) return;
    const filter = `user_id=in.(${teamUserIds.join(',')})`;
    const channel = supabase
      .channel(`plan-usage-${user.id}-${teamKey}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings', filter },
        () => queryClient.invalidateQueries({ queryKey: ['plan-usage', teamKey] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter },
        () => queryClient.invalidateQueries({ queryKey: ['plan-usage', teamKey] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, teamKey, teamUserIds, queryClient]);

  const usedListings = data?.listings ?? 0;
  const usedProjects = data?.projects ?? 0;
  const usedFeatured = data?.featured ?? 0;
  const usedSuper = data?.superFeatured ?? 0;

  const listings = buildUsage(usedListings, details.maxPublications);
  const projects = buildUsage(usedProjects, details.maxProjects);
  const featured = buildUsage(usedFeatured, details.includedFeatured);
  const superFeatured = buildUsage(usedSuper, details.includedSuperFeatured);

  const verified = !!user && !!data && !planLoading && !isLoading && !teamLoading && !planError && !usageError && !teamError;

  return {
    plan,
    planDetails: details,
    isLoading: planLoading || isLoading || teamLoading,
    isError: !!planError || usageError || !!teamError,
    refetch: () => Promise.all([refetchPlan(), refetchUsage(), refetchTeam()]),
    listings,
    projects,
    featured,
    superFeatured,
    canCreateListing: verified && (listings.isUnlimited || !listings.isAtLimit),
    canCreateProject: verified && (projects.isUnlimited || !projects.isAtLimit),
    canUseFeatured: verified && (featured.isUnlimited || !featured.isAtLimit),
    canUseSuperFeatured: verified && (superFeatured.isUnlimited || !superFeatured.isAtLimit),
  };
};
