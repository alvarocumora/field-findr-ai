export type MeetingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type MeetingType = 'reunion_campo' | 'reunion_comercial' | 'visita_terreno';
export type MeetingBlock = 'manana' | 'tarde';

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  pending: 'Por confirmar',
  confirmed: 'Confirmada',
  completed: 'Realizada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
};

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  reunion_campo: 'Dueño de campo',
  reunion_comercial: 'Quiere comprar',
  visita_terreno: 'Visita a terreno',
};

export const MEETING_BLOCK_LABELS: Record<MeetingBlock, string> = {
  manana: 'Mañana (9:00–13:00)',
  tarde: 'Tarde (14:00–18:00)',
};

/** Transiciones válidas de estado; el resto se oculta en la UI. */
export const MEETING_TRANSITIONS: Record<MeetingStatus, MeetingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'no_show', 'cancelled'],
  completed: [],
  cancelled: [],
  no_show: [],
};

export const canTransition = (from: MeetingStatus, to: MeetingStatus): boolean =>
  MEETING_TRANSITIONS[from]?.includes(to) ?? false;
