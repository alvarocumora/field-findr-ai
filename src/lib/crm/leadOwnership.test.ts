import { describe, expect, it } from 'vitest';
import { matchesLeadOwner } from './leadOwnership';

describe('matchesLeadOwner', () => {
  it('mis leads solo incluye los asignados al vendedor', () => {
    expect(matchesLeadOwner({ assigned_to: 'u1' }, 'mine', 'u1')).toBe(true);
    expect(matchesLeadOwner({ assigned_to: 'u2' }, 'mine', 'u1')).toBe(false);
    expect(matchesLeadOwner({ assigned_to: null }, 'mine', 'u1')).toBe(false);
  });
  it('sin asignar excluye leads con responsable', () => {
    expect(matchesLeadOwner({ assigned_to: null }, 'unassigned', 'u1')).toBe(true);
    expect(matchesLeadOwner({ assigned_to: 'u2' }, 'unassigned', 'u1')).toBe(false);
  });
});
