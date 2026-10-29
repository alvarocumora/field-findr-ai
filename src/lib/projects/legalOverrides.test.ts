import { describe, expect, it } from 'vitest';
import { applyLegalOverrides, parseLegalItems } from './legalOverrides';
import { hasRecordedLegalReview, uniqueLegalTypes } from './legalReview';

describe('project legal evidence', () => {
  it('never elevates approval based on a project name, slug or known ID', () => {
    for (const project of [{ name: 'Parcelas Licantén' }, { slug: 'valle-escondido-licanten' }, { id: 'b4363fda-e99f-400d-ae95-2cbc8244b770' }]) {
      expect(applyLegalOverrides(project, [{ type: 'titulo_dominio', status: 'pending' }], [], 'pending'))
        .toEqual({ legalDocuments: [{ type: 'titulo_dominio', status: 'pending' }], permits: [], legalStatus: 'pending' });
    }
  });
  it('preserves actual persisted status and review data without changing remote records', () => {
    const doc = { type: 'plano', status: 'verified', file_url: '/plano.pdf', verified_at: '2026-10-01' };
    expect(applyLegalOverrides(null, [doc], [], 'verified').legalDocuments).toEqual([doc]);
    expect(hasRecordedLegalReview(doc)).toBe(true);
  });
  it('does not count pending, missing evidence, invalid dates or duplicate types as verified', () => {
    const reviewed = { type: 'plano', status: 'verified', file_url: 'https://example.com/plano.pdf', verified_at: '2026-10-01' };
    for (const doc of [{ ...reviewed, status: 'pending' }, { ...reviewed, file_url: undefined }, { ...reviewed, verified_at: 'invalid' }, { ...reviewed, file_url: 'javascript:alert(1)' }]) expect(hasRecordedLegalReview(doc)).toBe(false);
    const types = uniqueLegalTypes([{ type: 'PLANO', status: 'pending' }, reviewed, reviewed]);
    expect(types).toHaveLength(1);
    expect(types.filter(hasRecordedLegalReview)).toHaveLength(1);
  });
  it('normalizes legacy and malformed JSON without inventing approvals', () => {
    expect(parseLegalItems([null, 1, [], 'escritura', { type: 'plano', status: 'pending', name: 7 }]))
      .toEqual([{ type: 'escritura', name: 'escritura' }, { type: 'plano', status: 'pending' }]);
  });
});
