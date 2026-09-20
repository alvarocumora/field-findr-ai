import { describe, expect, it } from 'vitest';
import { hasOrganizationCapability, organizationRoleLabel } from './organizationPermissions';

describe('organization permissions', () => {
  it('gives owners full control', () => {
    expect(hasOrganizationCapability('owner', 'team.write')).toBe(true);
    expect(hasOrganizationCapability('owner', 'payments.write')).toBe(true);
  });

  it('separates commercial and finance responsibilities', () => {
    expect(hasOrganizationCapability('commercial_manager', 'crm.write')).toBe(true);
    expect(hasOrganizationCapability('commercial_manager', 'payments.write')).toBe(false);
    expect(hasOrganizationCapability('finance', 'payments.write')).toBe(true);
    expect(hasOrganizationCapability('finance', 'crm.write')).toBe(false);
  });

  it('keeps legacy roles compatible', () => {
    expect(hasOrganizationCapability('admin', 'team.write')).toBe(true);
    expect(hasOrganizationCapability('member', 'crm.write')).toBe(true);
    expect(organizationRoleLabel('member')).toBe('Ejecutivo de ventas');
  });

  it('keeps viewers read-only', () => {
    expect(hasOrganizationCapability('viewer', 'projects.read')).toBe(true);
    expect(hasOrganizationCapability('viewer', 'projects.write')).toBe(false);
  });
});
