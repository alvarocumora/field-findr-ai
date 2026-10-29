/**
 * Estado legal fijado por código para proyectos cuya documentación ya fue
 * revisada. Se aplica sobre lo que venga de la base (legal_documents,
 * permits, legal_status) para que la ficha lo refleje sin depender de
 * migraciones.
 */

import type { LegalItem } from './legalItemTypes';
export type { LegalItem } from './legalItemTypes';
export function parseLegalItems(value: unknown): LegalItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (typeof item === 'string') return [{ type: item, name: item }];
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    return [Object.fromEntries(Object.entries(item).filter(([, value]) => typeof value === 'string')) as LegalItem];
  });
}

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
const FULLY_APPROVED_IDS = new Set([
  'b4363fda-e99f-400d-ae95-2cbc8244b770', // Valle Escondido Licantén
]);

type ProjectRef = { id?: string | null; slug?: string | null; name?: string | null };

const isFullyApproved = (project: ProjectRef) =>
  FULLY_APPROVED_IDS.has(project.id ?? '') ||
  normalize(project.slug).includes('licanten') ||
  normalize(project.name).includes('licanten');

export function applyLegalOverrides<P extends ProjectRef>(
  project: P | null | undefined,
  rawLegalDocuments: unknown,
  rawPermits: unknown,
  legalStatus: string,
): { legalDocuments: LegalItem[]; permits: LegalItem[]; legalStatus: string } {
  const legalDocuments = parseLegalItems(rawLegalDocuments);
  const permits = parseLegalItems(rawPermits);
  if (!project || !isFullyApproved(project)) return { legalDocuments, permits, legalStatus };

  const merge = (defs: readonly (readonly [string, string])[], current: LegalItem[], status: string) =>
    defs.map(([type, name]) => ({ type, name, ...current.find((c: LegalItem) => c.type === type), status }));

  return {
    legalDocuments: merge(ALL_DOCUMENTS, legalDocuments, 'verified'),
    permits: merge(ALL_PERMITS, permits, 'approved'),
    legalStatus: 'verified',
  };
}
