import { describe, it, expect } from 'vitest';
import {
  CAPTACION_STATUS_META,
  CAPTACION_TRANSITIONS,
  isValidTransition,
  isCaptacionStatus,
  isEditableByReferrer,
  type CaptacionStatus,
} from './status';

describe('captaciones — estados', () => {
  it('todo estado tiene meta y transiciones definidas', () => {
    for (const s of Object.keys(CAPTACION_STATUS_META) as CaptacionStatus[]) {
      expect(CAPTACION_STATUS_META[s].label.length).toBeGreaterThan(0);
      expect(CAPTACION_TRANSITIONS[s]).toBeDefined();
    }
  });

  it('flujo feliz: nueva → revisión → negociación → acuerdo → publicada', () => {
    expect(isValidTransition('nueva', 'en_revision')).toBe(true);
    expect(isValidTransition('en_revision', 'en_negociacion')).toBe(true);
    expect(isValidTransition('en_negociacion', 'acuerdo_firmado')).toBe(true);
    expect(isValidTransition('acuerdo_firmado', 'publicada')).toBe(true);
  });

  it('no se puede saltar etapas ni retroceder desde publicada', () => {
    expect(isValidTransition('nueva', 'publicada')).toBe(false);
    expect(isValidTransition('nueva', 'acuerdo_firmado')).toBe(false);
    expect(isValidTransition('publicada', 'rechazada')).toBe(false);
    expect(CAPTACION_TRANSITIONS.publicada).toHaveLength(0);
  });

  it('una rechazada puede reabrirse a revisión', () => {
    expect(isValidTransition('rechazada', 'en_revision')).toBe(true);
  });

  it('el corredor solo edita en estado nueva', () => {
    expect(isEditableByReferrer('nueva')).toBe(true);
    expect(isEditableByReferrer('en_negociacion')).toBe(false);
    expect(isEditableByReferrer('publicada')).toBe(false);
  });

  it('type guard de estados', () => {
    expect(isCaptacionStatus('en_negociacion')).toBe(true);
    expect(isCaptacionStatus('inventado')).toBe(false);
  });
});
