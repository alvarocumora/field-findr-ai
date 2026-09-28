export interface ProjectScopeRecord {
  id: string;
  created_at?: string | null;
}

export interface ProjectDataScope {
  organizationId: string | null;
  legacyOwnerIds: string[];
}

/**
 * Project ownership is organization-first. Legacy rows without organization_id
 * stay visible through their historical user owner while migrations catch up.
 */
export const resolveProjectDataScope = (
  organizationId: string | null | undefined,
  userId: string | null | undefined,
  teamUserIds: readonly string[] | null | undefined,
): ProjectDataScope => {
  const legacyOwnerIds = Array.from(
    new Set((teamUserIds?.length ? teamUserIds : userId ? [userId] : []).filter(Boolean)),
  );

  return {
    organizationId: organizationId ?? null,
    legacyOwnerIds,
  };
};

/**
 * Merge canonical organization rows with legacy user-owned rows without
 * duplicating projects during the transition. Canonical rows win by id.
 */
export const mergeProjectScopes = <T extends ProjectScopeRecord>(
  canonical: readonly T[],
  legacy: readonly T[],
): T[] => {
  const byId = new Map<string, T>();

  legacy.forEach((project) => byId.set(project.id, project));
  canonical.forEach((project) => byId.set(project.id, project));

  return [...byId.values()].sort((a, b) => {
    const aTime = a.created_at ? Date.parse(a.created_at) : 0;
    const bTime = b.created_at ? Date.parse(b.created_at) : 0;
    return bTime - aTime;
  });
};
