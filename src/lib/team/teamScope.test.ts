import { describe, it, expect } from 'vitest';
import { pickPrimaryOrganization, resolveTeamUserIds } from './teamScope';

describe('pickPrimaryOrganization', () => {
  const org = (id: string, owner: string) => ({ id, owner_id: owner });

  it('prefiere la organización propia sobre la membresía', () => {
    expect(pickPrimaryOrganization([org('a', 'u1')], [org('b', 'u2')])?.id).toBe('a');
  });
  it('cae a la primera membresía si no es dueño de ninguna', () => {
    expect(pickPrimaryOrganization([], [org('b', 'u2')])?.id).toBe('b');
  });
  it('null sin organizaciones', () => {
    expect(pickPrimaryOrganization([], [])).toBeNull();
  });
});

describe('resolveTeamUserIds', () => {
  it('une dueño + miembros sin duplicados', () => {
    expect(resolveTeamUserIds('self', 'owner', ['m1', 'owner', 'm2'])).toEqual(['owner', 'm1', 'm2']);
  });
  it('sin organización cae al propio usuario', () => {
    expect(resolveTeamUserIds('self', null, [])).toEqual(['self']);
  });
  it('ignora ids nulos/vacíos de miembros', () => {
    expect(resolveTeamUserIds('self', 'owner', [null, undefined, ''])).toEqual(['owner']);
  });
  it('NUNCA devuelve vacío si hay usuario', () => {
    expect(resolveTeamUserIds('self', undefined, [null]).length).toBeGreaterThan(0);
  });
});
