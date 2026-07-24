/**
 * Estados del flujo de captación de terrenos (Comunidad OT):
 * el corredor asociado ofrece un terreno y la gerencia lo trabaja
 * hasta publicarlo (o rechazarlo). Fuente única para badges y
 * transiciones permitidas en la cola de gerencia.
 */

export type CaptacionStatus =
  | 'nueva'
  | 'en_revision'
  | 'en_negociacion'
  | 'acuerdo_firmado'
  | 'publicada'
  | 'rechazada';

export const CAPTACION_STATUS_META: Record<CaptacionStatus, { label: string; className: string }> = {
  nueva: { label: 'Nueva', className: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  en_revision: { label: 'En revisión', className: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
  en_negociacion: { label: 'En negociación', className: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  acuerdo_firmado: { label: 'Acuerdo firmado', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  publicada: { label: 'Publicada', className: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40' },
  rechazada: { label: 'Rechazada', className: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
};

/** Transiciones que gerencia puede aplicar desde cada estado. */
export const CAPTACION_TRANSITIONS: Record<CaptacionStatus, CaptacionStatus[]> = {
  nueva: ['en_revision', 'rechazada'],
  en_revision: ['en_negociacion', 'rechazada'],
  en_negociacion: ['acuerdo_firmado', 'rechazada'],
  acuerdo_firmado: ['publicada'],
  publicada: [],
  rechazada: ['en_revision'],
};

export function isValidTransition(from: CaptacionStatus, to: CaptacionStatus): boolean {
  return CAPTACION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isCaptacionStatus(value: string): value is CaptacionStatus {
  return value in CAPTACION_STATUS_META;
}

/** El corredor solo puede editar mientras gerencia no la haya tomado. */
export function isEditableByReferrer(status: CaptacionStatus): boolean {
  return status === 'nueva';
}
