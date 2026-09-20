import { describe, expect, it } from 'vitest';
import {
  mergeOrganizationWorkspaces,
  organizationStorageKey,
  resolveActiveOrganization,
  type OrganizationWorkspace,
} from './organizationWorkspace';

const organization = (id: string, ownerId = 'owner'): OrganizationWorkspace => ({
  id,
  name: `Organización ${id}`,
  slug: `org-${id}`,
  owner_id: ownerId,
  logo_url: null,
});

describe('organizationWorkspace', () => {
  it('combina organizaciones propias y membresías sin duplicarlas', () => {
    const result = mergeOrganizationWorkspaces(
      [organization('owned')],
      [organization('owned'), organization('member', 'another-owner')],
    );

    expect(result.map((item) => item.id)).toEqual(['owned', 'member']);
  });

  it('respeta el workspace persistido cuando sigue disponible', () => {
    const organizations = [organization('a'), organization('b')];
    expect(resolveActiveOrganization(organizations, 'b')?.id).toBe('b');
  });

  it('vuelve al primer workspace cuando la preferencia ya no es válida', () => {
    const organizations = [organization('a'), organization('b')];
    expect(resolveActiveOrganization(organizations, 'removed')?.id).toBe('a');
    expect(resolveActiveOrganization([], 'removed')).toBeNull();
  });

  it('aísla la preferencia por usuario', () => {
    expect(organizationStorageKey('user-1')).toBe('ot:active-organization:user-1');
  });
});
