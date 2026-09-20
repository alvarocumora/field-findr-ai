export interface OrganizationWorkspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  logo_url: string | null;
}

export interface OrganizationMembership {
  organization_id: string;
  role?: string | null;
}

/**
 * Une organizaciones propias y organizaciones donde el usuario participa.
 * Mantiene primero las propias y elimina duplicados para evitar workspaces
 * repetidos cuando el dueño también tiene una fila de membresía.
 */
export const mergeOrganizationWorkspaces = <T extends OrganizationWorkspace>(
  owned: T[],
  member: T[],
): T[] => {
  const byId = new Map<string, T>();
  [...owned, ...member].forEach((organization) => {
    if (!byId.has(organization.id)) byId.set(organization.id, organization);
  });
  return [...byId.values()];
};

/**
 * Resuelve el workspace activo. La preferencia persistida solo se acepta
 * cuando el usuario todavía pertenece a esa organización.
 */
export const resolveActiveOrganization = <T extends OrganizationWorkspace>(
  organizations: T[],
  preferredId?: string | null,
): T | null => {
  if (organizations.length === 0) return null;
  return organizations.find((organization) => organization.id === preferredId) ?? organizations[0];
};

export const organizationStorageKey = (userId: string) =>
  `ot:active-organization:${userId}`;
