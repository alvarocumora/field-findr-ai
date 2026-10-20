import type { NavMeta, RouteAccess, RouteArea } from '@/routes/routeManifest';
import type { RoutePolicy } from '@/lib/access/routePolicy';
import type { OrganizationCapability } from '@/lib/access/organizationPermissions';
import type { PlanFeature } from '@/lib/access/planEntitlements';
import { evaluateRoutePolicy } from '@/lib/access/routePolicy';

interface CommercialRoute {
  path: string;
  area: RouteArea;
  access: RouteAccess;
  nav?: NavMeta;
  policy?: RoutePolicy;
}

interface CommercialAccess {
  context: 'broker' | 'empresa' | 'plataforma' | 'buyer' | null;
  isAgent: boolean;
  isAdmin: boolean;
  plan?: string | null;
  can: (capability: OrganizationCapability) => boolean;
  hasFeature: (feature: PlanFeature) => boolean;
}

/** Only link to operations available in the CURRENT workspace; RLS is still
 * the server-side access boundary. A shortcut must not bypass plan/capability
 * gates or route-context rules just because its label fits in a card. */
export function visibleCommercialActions<T extends { route: string }>(
  actions: readonly T[],
  routes: readonly CommercialRoute[],
  access: CommercialAccess,
): T[] {
  return actions.filter((action) => {
    const entry = routes.find((route) => route.path === action.route);
    if (!entry) return false;
    if (entry.access === 'admin' && (!access.isAdmin || access.context !== 'plataforma')) return false;
    if (entry.access === 'agent') {
      if (!access.isAgent && !access.isAdmin) return false;
      if (access.context !== 'broker' && access.context !== 'empresa') return false;
      const contexts = entry.nav?.contexts ?? ['empresa'];
      if (!contexts.includes(access.context)) return false;
    }
    if (entry.access === 'auth' && !access.context) return false;
    if (entry.nav?.plans && (!access.plan || !entry.nav.plans.includes(access.plan))) return false;
    return evaluateRoutePolicy(entry.policy, access).allowed;
  });
}
