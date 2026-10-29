import { describe, expect, it } from 'vitest';
import { applyLegalOverrides, parseLegalItems } from './legalOverrides';

describe('applyLegalOverrides', () => {
  it('normalizes legacy names and malformed JSON without inventing verified status', () => {
    expect(parseLegalItems([null, 1, [], 'escritura', { type: 'plano', status: 'pending', file_url: 'document.pdf', name: 7 }]))
      .toEqual([{ type: 'escritura', name: 'escritura' }, { type: 'plano', status: 'pending', file_url: 'document.pdf' }]);
    expect(parseLegalItems({})).toEqual([]);
  });
  it('aprueba todo en el proyecto de Licantén, conservando campos existentes', () => {
    const r = applyLegalOverrides(
      { slug: 'valle-escondido-licanten', name: 'Valle Escondido Licantén' },
      [{ type: 'titulo_dominio', name: 'Título de Dominio', status: 'pending', file_url: 'x' }],
      [],
      'pending',
    );
    expect(r.legalStatus).toBe('verified');
    expect(r.legalDocuments).toHaveLength(7);
    expect(r.legalDocuments.every((d) => d.status === 'verified')).toBe(true);
    expect(r.legalDocuments[0].file_url).toBe('x');
    expect(r.permits).toHaveLength(4);
    expect(r.permits.every((p) => p.status === 'approved')).toBe(true);
  });

  it('detecta Licantén por nombre aunque el slug sea otro', () => {
    const r = applyLegalOverrides({ slug: 'parcelas-x', name: 'Parcelas Licantén' }, [], [], 'pending');
    expect(r.legalStatus).toBe('verified');
  });

  it('detecta Licantén por id aunque nombre y slug sean otros', () => {
    const r = applyLegalOverrides(
      { id: 'b4363fda-e99f-400d-ae95-2cbc8244b770', slug: 'valle-escondido', name: 'Valle Escondido' },
      [], [], 'pending',
    );
    expect(r.legalStatus).toBe('verified');
  });

  it('no toca otros proyectos', () => {
    const docs = [{ type: 'titulo_dominio', name: 'Título de Dominio', status: 'pending' }];
    const r = applyLegalOverrides({ slug: 'brisas-de-caone', name: 'Brisas de Caone' }, docs, [], 'pending');
    expect(r).toEqual({ legalDocuments: docs, permits: [], legalStatus: 'pending' });
  });
});
