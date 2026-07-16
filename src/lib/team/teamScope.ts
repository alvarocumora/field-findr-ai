/**
 * Resolución del "equipo" de una cuenta para el dashboard de inmobiliaria.
 *
 * El equipo son los user_ids cuya actividad (propiedades, ventas, leads)
 * se agrega en el dashboard: el dueño de la organización + sus miembros.
 * Si la cuenta aún no tiene organización, el equipo es solo el propio usuario,
 * de modo que el dashboard NUNCA muestre datos de otras empresas.
 */

export interface OrganizationLike {
  id: string;
  owner_id: string;
}

/** Elige la organización principal: primero una propia, si no, la primera membresía. */
export function pickPrimaryOrganization<T extends OrganizationLike>(
  ownedOrgs: T[],
  memberOrgs: T[],
): T | null {
  return ownedOrgs[0] ?? memberOrgs[0] ?? null;
}

/**
 * Une dueño + miembros sin duplicados; si no hay organización,
 * cae de vuelta al propio usuario.
 */
export function resolveTeamUserIds(
  selfId: string,
  ownerId: string | null | undefined,
  memberIds: Array<string | null | undefined>,
): string[] {
  const ids = new Set<string>();
  if (ownerId) ids.add(ownerId);
  for (const id of memberIds) {
    if (id) ids.add(id);
  }
  if (ids.size === 0 && selfId) ids.add(selfId);
  return [...ids];
}

/** Cuenta de leads/ventas por usuario a partir de filas planas (evita N+1 en el cliente). */
export function countByUser(rows: Array<{ user_id: string | null }>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.user_id) continue;
    counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
  }
  return counts;
}
