import { z } from 'zod';
import { formatRut, isValidRut } from './rut';

/**
 * Formulario de reserva OfertaTerrenos (versión digital del formulario en
 * papel). La forma de `ReservationFormDetails` es la que se guarda en
 * `reservations.buyer_details`; si cambia, sube `version`.
 */

export const MARITAL_STATUS_OPTIONS = [
  { value: 'soltero', label: 'Soltero/a' },
  { value: 'casado_separacion', label: 'Casado/a con separación de bienes' },
  { value: 'casado_sociedad_conyugal', label: 'Casado/a en sociedad conyugal' },
  { value: 'casado_gananciales', label: 'Casado/a en participación en los gananciales' },
  { value: 'union_civil', label: 'Acuerdo de unión civil' },
  { value: 'divorciado', label: 'Divorciado/a' },
  { value: 'viudo', label: 'Viudo/a' },
] as const;

export type MaritalStatus = (typeof MARITAL_STATUS_OPTIONS)[number]['value'];

const MARITAL_VALUES = MARITAL_STATUS_OPTIONS.map((o) => o.value) as [MaritalStatus, ...MaritalStatus[]];

export const maritalStatusLabel = (value: MaritalStatus | string | null | undefined): string =>
  MARITAL_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? '—';

/** Casado/a o con unión civil: corresponde informar cónyuge o conviviente. */
export const hasPartner = (status: MaritalStatus | '' | undefined): boolean =>
  !!status && (status.startsWith('casado') || status === 'union_civil');

/** Régimen en que la compra compromete al cónyuge: sus datos son obligatorios. */
export const partnerRequired = (status: MaritalStatus | '' | undefined): boolean =>
  hasPartner(status) && status !== 'casado_separacion';

const text = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max, 'Texto demasiado largo');

const optionalText = (max: number) => z.string().trim().max(max, 'Texto demasiado largo');

const rutField = z
  .string()
  .trim()
  .refine(isValidRut, 'RUT inválido')
  .transform(formatRut);

const phoneField = z
  .string()
  .trim()
  .refine((v) => v.replace(/\D/g, '').length >= 8, 'Teléfono inválido')
  .refine((v) => v.length <= 20, 'Teléfono inválido');

export const spouseSchema = z.object({
  fullName: text(3, 120, 'Ingresa nombre y apellidos'),
  rut: rutField,
  nationality: text(2, 60, 'Ingresa la nacionalidad'),
  profession: optionalText(80),
  address: optionalText(160),
  commune: optionalText(60),
  phone: optionalText(20),
  email: z.union([z.literal(''), z.string().trim().email('Email inválido').max(120)]),
});

export const buyerSchema = z.object({
  fullName: text(3, 120, 'Ingresa nombre y apellidos'),
  rut: rutField,
  nationality: text(2, 60, 'Ingresa la nacionalidad'),
  maritalStatus: z.enum(MARITAL_VALUES, { errorMap: () => ({ message: 'Selecciona el estado civil' }) }),
  profession: text(2, 80, 'Ingresa profesión u oficio'),
  address: text(4, 160, 'Ingresa la dirección'),
  commune: text(2, 60, 'Ingresa la comuna'),
  phone: phoneField,
  email: z.string().trim().email('Email inválido').max(120),
});

/** Un cónyuge "vacío" en el formulario se trata como no informado. */
const emptySpouse = { fullName: '', rut: '', nationality: '', profession: '', address: '', commune: '', phone: '', email: '' };

export const partySchema = z
  .object({
    buyer: buyerSchema,
    hasSpouse: z.boolean(),
    spouse: z.any(),
  })
  .superRefine((value, ctx) => {
    const required = partnerRequired(value.buyer.maritalStatus);
    if (!value.hasSpouse && !required) return;
    const parsed = spouseSchema.safeParse(value.spouse ?? emptySpouse);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({ ...issue, path: ['spouse', ...issue.path] });
      }
    }
  })
  .transform((value) => {
    const include = value.hasSpouse || partnerRequired(value.buyer.maritalStatus);
    return {
      buyer: value.buyer,
      spouse: include ? spouseSchema.parse(value.spouse) : null,
    };
  });

export const reservationFormSchema = z
  .object({
    projectId: z.string().uuid('Selecciona un proyecto'),
    lotId: z.string().uuid('Selecciona una parcela'),
    primary: partySchema,
    hasSecondBuyer: z.boolean(),
    secondary: z.any(),
    estimatedDeedDate: z
      .string()
      .trim()
      .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Fecha inválida'),
    observations: optionalText(800),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar las condiciones' }) }),
  })
  .superRefine((value, ctx) => {
    if (!value.hasSecondBuyer) return;
    const parsed = partySchema.safeParse(value.secondary);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({ ...issue, path: ['secondary', ...issue.path] });
      }
    }
  })
  .transform((value) => ({
    ...value,
    secondary: value.hasSecondBuyer ? partySchema.parse(value.secondary) : null,
  }));

export type ReservationFormInput = z.input<typeof reservationFormSchema>;
export type ReservationFormValues = z.output<typeof reservationFormSchema>;
export type BuyerData = z.output<typeof buyerSchema>;
export type SpouseData = z.output<typeof spouseSchema>;

export interface ReservationFormParty {
  buyer: BuyerData;
  spouse: SpouseData | null;
}

/** Contenido persistido en `reservations.buyer_details`. */
export interface ReservationFormDetails {
  version: 1;
  source: 'formulario_reserva';
  parties: ReservationFormParty[];
  estimatedDeedDate: string | null;
  observations: string | null;
}

export const emptySpouseInput = () => ({ ...emptySpouse });

export const emptyPartyInput = () => ({
  buyer: {
    fullName: '',
    rut: '',
    nationality: 'Chilena',
    maritalStatus: '' as unknown as MaritalStatus,
    profession: '',
    address: '',
    commune: '',
    phone: '',
    email: '',
  },
  hasSpouse: false,
  spouse: emptySpouseInput(),
});

export const toFormDetails = (values: ReservationFormValues): ReservationFormDetails => ({
  version: 1,
  source: 'formulario_reserva',
  parties: [values.primary, ...(values.secondary ? [values.secondary] : [])],
  estimatedDeedDate: values.estimatedDeedDate || null,
  observations: values.observations || null,
});

/** Lectura defensiva de `buyer_details` (jsonb sin tipo en la base). */
export const parseFormDetails = (raw: unknown): ReservationFormDetails | null => {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<ReservationFormDetails>;
  if (value.source !== 'formulario_reserva' || !Array.isArray(value.parties) || value.parties.length === 0) {
    return null;
  }
  return {
    version: 1,
    source: 'formulario_reserva',
    parties: value.parties as ReservationFormParty[],
    estimatedDeedDate: value.estimatedDeedDate ?? null,
    observations: value.observations ?? null,
  };
};
