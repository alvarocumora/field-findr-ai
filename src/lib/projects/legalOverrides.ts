/**
 * Estado legal fijado por código para proyectos cuya documentación ya fue
 * revisada. Se aplica sobre lo que venga de la base (legal_documents,
 * permits, legal_status) para que la ficha lo refleje sin depender de
 * migraciones.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- jsonb sin tipar, igual que en ProjectDetail
type LegalItem = any;

const ALL_DOCUMENTS = [
  ['titulo_dominio', 'Título de Dominio'],
  ['planos_aprobados', 'Planos Aprobados'],
  ['certificado_subdivision', 'Certificado de Subdivisión'],
  ['permisos_municipales', 'Permisos Municipales'],
  ['recepcion_final', 'Recepción Final'],
  ['factibilidad_agua', 'Factibilidad de Agua'],
  ['factibilidad_electricidad', 'Factibilidad Eléctrica'],
] as const;

const ALL_PERMITS = [
  ['permiso_loteo', 'Permiso de Loteo'],
  ['resolucion_sanitaria', 'Resolución Sanitaria'],
  ['impacto_ambiental', 'Informe de Impacto Ambiental'],
  ['certificado_urbanizacion', 'Certificado de Urbanización'],
] as const;

const normalize = (s?: string | null) =>
  (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Proyectos con toda la documentación verificada y permisos aprobados. */
const isFullyApproved = (project: { slug?: string | null; name?: string | null }) =>
  normalize(project.slug).includes('licanten') || normalize(project.name).includes('licanten');

export function applyLegalOverrides<P extends { slug?: string | null; name?: string | null }>(
  project: P | null | undefined,
  legalDocuments: LegalItem[],
  permits: LegalItem[],
  legalStatus: string,
): { legalDocuments: LegalItem[]; permits: LegalItem[]; legalStatus: string } {
  if (!project || !isFullyApproved(project)) return { legalDocuments, permits, legalStatus };

  const merge = (defs: readonly (readonly [string, string])[], current: LegalItem[], status: string) =>
    defs.map(([type, name]) => ({ type, name, ...current.find((c: LegalItem) => c.type === type), status }));

  return {
    legalDocuments: merge(ALL_DOCUMENTS, legalDocuments, 'verified'),
    permits: merge(ALL_PERMITS, permits, 'approved'),
    legalStatus: 'verified',
  };
}
