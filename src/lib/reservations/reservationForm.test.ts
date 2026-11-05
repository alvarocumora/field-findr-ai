import { describe, expect, it } from 'vitest';
import { cleanRut, computeRutDv, formatRut, isValidRut } from './rut';
import { parseFormDetails, toFormDetails } from './reservationForm';
import {
  defaultFormShape,
  parseFullForm,
  stepForPath,
  validateStep,
  type ReservationFormShape,
} from '@/components/reservations/form/formShape';
import { generateReservationFormPdf, reservationFolio } from './reservationFormPdf';
import { RESERVATION_PAYMENT_ACCOUNT } from './reservationTerms';

const PROJECT = '11111111-1111-4111-8111-111111111111';
const LOT = '22222222-2222-4222-8222-222222222222';

const buyer = (overrides: Partial<ReservationFormShape['primary']['buyer']> = {}) => ({
  fullName: 'María José Pérez Soto',
  rut: '12345678-5',
  nationality: 'Chilena',
  maritalStatus: 'soltero' as const,
  profession: 'Ingeniera',
  address: 'Av. Siempre Viva 742',
  commune: 'Las Condes',
  phone: '+56 9 1234 5678',
  email: 'maria@example.com',
  ...overrides,
});

const spouse = {
  fullName: 'Juan Andrés Rojas',
  rut: '11.111.111-1',
  nationality: 'Chilena',
  profession: '',
  address: '',
  commune: '',
  phone: '',
  email: '',
};

const filled = (overrides: Partial<ReservationFormShape> = {}): ReservationFormShape => {
  const base = defaultFormShape(PROJECT, LOT);
  return {
    ...base,
    primary: { ...base.primary, buyer: buyer() },
    acceptTerms: true,
    ...overrides,
  };
};

describe('rut', () => {
  it('valida el dígito verificador y formatea', () => {
    expect(computeRutDv('12345678')).toBe('5');
    expect(isValidRut('12.345.678-5')).toBe(true);
    expect(isValidRut('12345678-4')).toBe(false);
    expect(isValidRut('77333862-0')).toBe(true);
    expect(formatRut('123456785')).toBe('12.345.678-5');
    expect(cleanRut('9.876.543-k')).toBe('9876543K');
  });
});

describe('formulario de reserva', () => {
  it('acepta un comprador soltero y normaliza el RUT', () => {
    const result = parseFullForm(filled());
    expect(result.issues).toEqual([]);
    expect(result.values?.primary.buyer.rut).toBe('12.345.678-5');
    expect(result.values?.primary.spouse).toBeNull();
    expect(result.values?.secondary).toBeNull();
  });

  it('exige el cónyuge en sociedad conyugal', () => {
    const base = filled();
    const shape = filled({ primary: { ...base.primary, buyer: buyer({ maritalStatus: 'casado_sociedad_conyugal' }) } });
    const issues = validateStep('compradores', shape);
    expect(issues.map((i) => i.path)).toContain('primary.spouse.fullName');
    expect(stepForPath('primary.spouse.fullName')).toBe('compradores');

    const ok = parseFullForm({ ...shape, primary: { ...shape.primary, spouse } });
    expect(ok.issues).toEqual([]);
    expect(ok.values?.primary.spouse?.rut).toBe('11.111.111-1');
  });

  it('el cónyuge es opcional con separación de bienes e ignora el interruptor en solteros', () => {
    const base = filled();
    const separacion = filled({
      primary: { ...base.primary, buyer: buyer({ maritalStatus: 'casado_separacion' }) },
    });
    expect(validateStep('compradores', separacion)).toEqual([]);

    const soltero = filled({ primary: { ...base.primary, hasSpouse: true } });
    expect(validateStep('compradores', soltero)).toEqual([]);
    expect(parseFullForm(soltero).values?.primary.spouse).toBeNull();
  });

  it('valida el comprador 2 sólo cuando se activa', () => {
    const base = filled();
    expect(validateStep('compradores', filled({ hasSecondBuyer: false })).length).toBe(0);
    const issues = validateStep('compradores', filled({ hasSecondBuyer: true }));
    expect(issues.some((i) => i.path.startsWith('secondary.buyer'))).toBe(true);

    const two = parseFullForm(
      filled({
        hasSecondBuyer: true,
        secondary: { ...base.secondary, buyer: buyer({ fullName: 'Pedro Pérez', rut: '11111111-1' }) },
      }),
    );
    expect(two.issues).toEqual([]);
    expect(two.values && toFormDetails(two.values).parties).toHaveLength(2);
  });

  it('rechaza RUT inválido, parcela vacía y condiciones no aceptadas', () => {
    const base = filled();
    expect(validateStep('parcela', defaultFormShape()).map((i) => i.path)).toEqual(['projectId', 'lotId']);
    const badRut = validateStep('compradores', filled({ primary: { ...base.primary, buyer: buyer({ rut: '12345678-0' }) } }));
    expect(badRut).toEqual([{ path: 'primary.buyer.rut', message: 'RUT inválido' }]);
    expect(parseFullForm(filled({ acceptTerms: false })).issues.map((i) => i.path)).toContain('acceptTerms');
  });

  it('lee de vuelta buyer_details y descarta jsonb ajeno', () => {
    const values = parseFullForm(filled()).values!;
    const stored = JSON.parse(JSON.stringify(toFormDetails(values)));
    expect(parseFormDetails(stored)?.parties[0].buyer.fullName).toBe('María José Pérez Soto');
    expect(parseFormDetails({ parcel: 1 })).toBeNull();
    expect(parseFormDetails(null)).toBeNull();
  });
});

describe('PDF del formulario', () => {
  it('genera el PDF con los datos del comprador y la cuenta de pago', () => {
    const base = filled();
    const values = parseFullForm(
      filled({
        primary: { ...base.primary, buyer: buyer({ maritalStatus: 'casado_gananciales' }), spouse },
        observations: 'Visitó el terreno con su asesor.',
        estimatedDeedDate: '2026-11-20',
      }),
    ).values!;
    const doc = generateReservationFormPdf({
      reservationId: 'abcdef12-0000-4000-8000-000000000000',
      createdAt: '2026-10-30T13:00:00.000Z',
      termsAcceptedAt: '2026-10-30T13:00:00.000Z',
      termsVersion: 'test',
      expiresAt: '2026-11-01T13:00:00.000Z',
      projectName: 'Valle Escondido',
      lotNumber: '12',
      lotArea: 5000,
      lotPrice: 19_900_000,
      reservationAmount: 400_000,
      details: toFormDetails(values),
    });
    const raw = doc.output();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2);
    expect(raw).toContain('Asesor');
    expect(raw).toContain(RESERVATION_PAYMENT_ACCOUNT.accountNumber);
    expect(raw).toContain('Juan Andr');
    expect(reservationFolio('abcdef12-0000')).toBe('OT-RES-ABCDEF12');
  });
});
