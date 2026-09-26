import type { OrganizationRole } from '@/lib/access/organizationPermissions';

export type CompanyDashboardVariant = 'seller' | 'organization';

const ORGANIZATION_PLANS = new Set([
  'corredora',
  'inmobiliaria',
  'grupo',
  'enterprise',
  'starter',
  'growth',
  'scale',
]);

const ORGANIZATION_ROLES = new Set<OrganizationRole>([
  'owner',
  'admin',
  'org_admin',
  'commercial_manager',
  'operations',
  'finance',
  'viewer',
]);

/**
 * Chooses the information architecture of the company home, not its security.
 * Route/RLS policy remains authoritative for individual actions.
 */
export const resolveCompanyDashboardVariant = ({
  plan,
  organizationRole,
  hasOrganization,
}: {
  plan?: string | null;
  organizationRole?: OrganizationRole | null;
  hasOrganization: boolean;
}): CompanyDashboardVariant => {
  if (hasOrganization && organizationRole && ORGANIZATION_ROLES.has(organizationRole)) {
    return 'organization';
  }

  if (ORGANIZATION_PLANS.has(plan ?? 'free')) {
    return 'organization';
  }

  return 'seller';
};
