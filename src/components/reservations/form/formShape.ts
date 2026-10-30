import { get, type FieldErrors } from 'react-hook-form';
import type { ZodIssue } from 'zod';
import {
  emptyPartyInput,
  hasPartner,
  partySchema,
  reservationFormSchema,
  type MaritalStatus,
  type ReservationFormValues,
} from '@/lib/reservations/reservationForm';

export type PartyInput = ReturnType<typeof emptyPartyInput>;

/** Estado de react-hook-form (antes de validar/transformar con zod). */
export interface ReservationFormShape {
  projectId: string;
  lotId: string;
  primary: PartyInput;
  hasSecondBuyer: boolean;
  secondary: PartyInput;
  estimatedDeedDate: string;
  observations: string;
  acceptTerms: boolean;
}

export const defaultFormShape = (projectId = '', lotId = ''): ReservationFormShape => ({
  projectId,
  lotId,
  primary: emptyPartyInput(),
  hasSecondBuyer: false,
  secondary: emptyPartyInput(),
  estimatedDeedDate: '',
  observations: '',
  acceptTerms: false,
});

/** El interruptor de cónyuge sólo cuenta si el estado civil lo admite. */
const normalizeParty = (party: PartyInput): PartyInput => ({
  ...party,
  hasSpouse: party.hasSpouse && hasPartner(party.buyer.maritalStatus as MaritalStatus),
});

export const normalizeShape = (shape: ReservationFormShape): ReservationFormShape => ({
  ...shape,
  primary: normalizeParty(shape.primary),
  secondary: normalizeParty(shape.secondary),
});

export interface StepIssue {
  path: string;
  message: string;
}

const toIssues = (issues: ZodIssue[], prefix?: string): StepIssue[] =>
  issues.map((issue) => ({
    path: [prefix, ...issue.path].filter((p) => p !== undefined && p !== '').join('.'),
    message: issue.message,
  }));

export type WizardStep = 'parcela' | 'compradores' | 'confirmacion';

export const WIZARD_STEPS: Array<{ id: WizardStep; label: string }> = [
  { id: 'parcela', label: 'Parcela' },
  { id: 'compradores', label: 'Compradores' },
  { id: 'confirmacion', label: 'Pago y condiciones' },
];

/** Valida sólo los campos del paso indicado. */
export const validateStep = (step: WizardStep, raw: ReservationFormShape): StepIssue[] => {
  const shape = normalizeShape(raw);
  if (step === 'parcela') {
    const issues: StepIssue[] = [];
    if (!shape.projectId) issues.push({ path: 'projectId', message: 'Selecciona un proyecto' });
    if (!shape.lotId) issues.push({ path: 'lotId', message: 'Selecciona una parcela disponible' });
    return issues;
  }
  if (step === 'compradores') {
    const issues: StepIssue[] = [];
    const primary = partySchema.safeParse(shape.primary);
    if (!primary.success) issues.push(...toIssues(primary.error.issues, 'primary'));
    if (shape.hasSecondBuyer) {
      const secondary = partySchema.safeParse(shape.secondary);
      if (!secondary.success) issues.push(...toIssues(secondary.error.issues, 'secondary'));
    }
    return issues;
  }
  const full = reservationFormSchema.safeParse(shape);
  return full.success ? [] : toIssues(full.error.issues);
};

/** `values` sólo viene cuando `issues` está vacío. */
export const parseFullForm = (
  raw: ReservationFormShape,
): { values: ReservationFormValues | null; issues: StepIssue[] } => {
  const parsed = reservationFormSchema.safeParse(normalizeShape(raw));
  return parsed.success
    ? { values: parsed.data, issues: [] }
    : { values: null, issues: toIssues(parsed.error.issues) };
};

/** Paso al que pertenece un error, para volver a él si falla el envío final. */
export const stepForPath = (path: string): WizardStep => {
  if (path.startsWith('projectId') || path.startsWith('lotId')) return 'parcela';
  if (path.startsWith('primary') || path.startsWith('secondary')) return 'compradores';
  return 'confirmacion';
};

/** Mensaje de error de react-hook-form para una ruta con puntos. */
export const errorMessage = (errors: FieldErrors<ReservationFormShape>, path: string): string | undefined => {
  const entry = get(errors, path) as { message?: unknown } | undefined;
  return typeof entry?.message === 'string' ? entry.message : undefined;
};
