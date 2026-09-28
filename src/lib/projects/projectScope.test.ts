import { describe, expect, it } from 'vitest';
import { mergeProjectScopes, resolveProjectDataScope } from './projectScope';

describe('projectScope', () => {
  it('uses the active organization as canonical tenant and keeps legacy team owners', () => {
    expect(resolveProjectDataScope('org-1', 'user-1', ['user-1', 'user-2', 'user-1'])).toEqual({
      organizationId: 'org-1',
      legacyOwnerIds: ['user-1', 'user-2'],
    });
  });

  it('falls back to the current user for solo workspaces', () => {
    expect(resolveProjectDataScope(null, 'user-1', [])).toEqual({
      organizationId: null,
      legacyOwnerIds: ['user-1'],
    });
  });

  it('deduplicates transitional rows and prefers the canonical organization row', () => {
    const legacy = [
      { id: 'p1', name: 'legacy', created_at: '2026-01-01T00:00:00Z' },
      { id: 'p2', name: 'second', created_at: '2026-02-01T00:00:00Z' },
    ];
    const canonical = [
      { id: 'p1', name: 'canonical', created_at: '2026-03-01T00:00:00Z' },
    ];

    expect(mergeProjectScopes(canonical, legacy)).toEqual([
      { id: 'p1', name: 'canonical', created_at: '2026-03-01T00:00:00Z' },
      { id: 'p2', name: 'second', created_at: '2026-02-01T00:00:00Z' },
    ]);
  });
});
