import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentPlan, PLAN_DETAILS, type Plan, type PlanType } from '@/hooks/useSubscription';

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
  const { plan, planDetails } = useCurrentPlan();
  const queryClient = useQueryClient();
  const details = planDetails ?? PLAN_DETAILS.free;

  const { data, isLoading } = useQuery({
    queryKey: ['plan-usage', user?.id],
    enabled: !!user,
    staleTime: 15_000,
    queryFn: async () => {
      if (!user) return { listings: 0, projects: 0, featured: 0, superFeatured: 0 };

      const monthStart = monthStartISO();

      const [listingsRes, projectsRes, featuredRes, superRes] = await Promise.all([
        supabase
          .from('listings')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['active', 'pending_review', 'reserved']),
        supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .neq('status', 'archived'),
        supabase
          .from('listings')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('featured', true)
          .gte('updated_at', monthStart),
        // super_featured actualmente no está en columna; se cuenta como featured con addon.
        Promise.resolve({ count: 0 }),
      ]);

      return {
        listings: listingsRes.count ?? 0,
        projects: projectsRes.count ?? 0,
        featured: featuredRes.count ?? 0,
        superFeatured: (superRes as { count: number }).count ?? 0,
      };
    },
  });

  // Realtime: invalidar contadores cuando cambian listings / projects del usuario
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`plan-usage-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings', filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ['plan-usage', user.id] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ['plan-usage', user.id] })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const usedListings = data?.listings ?? 0;
  const usedProjects = data?.projects ?? 0;
  const usedFeatured = data?.featured ?? 0;
  const usedSuper = data?.superFeatured ?? 0;

  const listings = buildUsage(usedListings, details.maxPublications);
  const projects = buildUsage(usedProjects, details.maxProjects);
  const featured = buildUsage(usedFeatured, details.includedFeatured);
  const superFeatured = buildUsage(usedSuper, details.includedSuperFeatured);

  return {
    plan,
    planDetails: details,
    isLoading,
    listings,
    projects,
    featured,
    superFeatured,
    canCreateListing: listings.isUnlimited || !listings.isAtLimit,
    canCreateProject: projects.isUnlimited || !projects.isAtLimit,
    canUseFeatured: featured.isUnlimited || !featured.isAtLimit,
    canUseSuperFeatured: superFeatured.isUnlimited || !superFeatured.isAtLimit,
  };
};
