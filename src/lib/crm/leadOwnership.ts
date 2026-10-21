export type LeadOwnerFilter = 'all' | 'mine' | 'unassigned';

interface OwnedLead {
  assigned_to?: string | null;
}

/** Vendedor responsable: «mis leads» = asignados a mí; «sin asignar» = sin responsable. */
export const matchesLeadOwner = (
  lead: OwnedLead,
  filter: LeadOwnerFilter,
  userId?: string | null,
): boolean => {
  if (filter === 'all') return true;
  if (filter === 'unassigned') return !lead.assigned_to;
  return !!userId && lead.assigned_to === userId;
};
