import { describe, expect, it } from 'vitest';
import { withProjectScope } from './useWorkspaceScope';

describe('withProjectScope', () => {
  it('adds the canonical project parameter', () => {
    expect(withProjectScope('/asesor/crm', 'project-1'))
      .toBe('/asesor/crm?project=project-1');
  });

  it('preserves existing query parameters', () => {
    expect(withProjectScope('/asesor/visitas?action=new', 'project-1'))
      .toBe('/asesor/visitas?action=new&project=project-1');
  });

  it('replaces an existing project parameter', () => {
    expect(withProjectScope('/asesor/lots?project=old&status=available', 'new'))
      .toBe('/asesor/lots?project=new&status=available');
  });

  it('preserves hashes', () => {
    expect(withProjectScope('/asesor/reports#sales', 'project-1'))
      .toBe('/asesor/reports?project=project-1#sales');
  });

  it('leaves the path unchanged without a project', () => {
    expect(withProjectScope('/asesor/crm', undefined))
      .toBe('/asesor/crm');
  });
});
