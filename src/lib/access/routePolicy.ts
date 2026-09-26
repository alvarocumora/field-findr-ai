import type { OrganizationCapability } from '@/lib/access/organizationPermissions';
import type { PlanFeature } from '@/lib/access/planEntitlements';

export interface RoutePolicy {
  capability?: OrganizationCapability;
  feature?: PlanFeature;
}

export type RoutePolicyDecision =
  | { allowed: true }
  | { allowed: false; reason: 'capability'; capability: OrganizationCapability }
  | { allowed: false; reason: 'feature'; feature: PlanFeature };

export const evaluateRoutePolicy = (
  policy: RoutePolicy | undefined,
  access: {
    can: (capability: OrganizationCapability) => boolean;
    hasFeature: (feature: PlanFeature) => boolean;
  },
): RoutePolicyDecision => {
  if (!policy) return { allowed: true };

  if (policy.capability && !access.can(policy.capability)) {
    return { allowed: false, reason: 'capability', capability: policy.capability };
  }

  if (policy.feature && !access.hasFeature(policy.feature)) {
    return { allowed: false, reason: 'feature', feature: policy.feature };
  }

  return { allowed: true };
};
