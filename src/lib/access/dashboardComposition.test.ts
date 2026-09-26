import { describe, expect, it } from 'vitest';
import { resolveCompanyDashboardVariant } from './dashboardComposition';

describe('dashboard composition', () => {
  it('keeps an independent corredor in the seller dashboard', () => {
    expect(resolveCompanyDashboardVariant({
      plan: 'corredor',
      organizationRole: null,
      hasOrganization: false,
    })).toBe('seller');
  });

  it('uses the organization dashboard for a corredora plan', () => {
    expect(resolveCompanyDashboardVariant({
      plan: 'corredora',
      organizationRole: 'owner',
      hasOrganization: true,
    })).toBe('organization');
  });

  it('uses the organization dashboard for finance and operations roles', () => {
    expect(resolveCompanyDashboardVariant({
      plan: 'free',
      organizationRole: 'finance',
      hasOrganization: true,
    })).toBe('organization');
    expect(resolveCompanyDashboardVariant({
      plan: 'free',
      organizationRole: 'operations',
      hasOrganization: true,
    })).toBe('organization');
  });

  it('keeps a sales agent focused on the seller dashboard when the plan is individual', () => {
    expect(resolveCompanyDashboardVariant({
      plan: 'corredor',
      organizationRole: 'sales_agent',
      hasOrganization: true,
    })).toBe('seller');
  });
});
