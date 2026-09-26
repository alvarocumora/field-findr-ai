import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useMyOrganization } from '@/hooks/useMyOrganization';

export interface WorkspaceScope {
  organizationId?: string;
  projectId?: string;
  source: 'explicit' | 'route' | 'query' | 'organization';
  isProjectScoped: boolean;
}

/**
 * Adds or replaces the canonical project query parameter without losing any
 * existing query/hash in the destination.
 */
export const withProjectScope = (path: string, projectId?: string | null) => {
  if (!projectId) return path;

  const [beforeHash, hash = ''] = path.split('#', 2);
  const [pathname, rawQuery = ''] = beforeHash.split('?', 2);
  const query = new URLSearchParams(rawQuery);
  query.set('project', projectId);
  const search = query.toString();

  return `${pathname}${search ? `?${search}` : ''}${hash ? `#${hash}` : ''}`;
};

/**
 * Canonical SaaS workspace scope.
 *
 * Priority:
 * 1. explicit project supplied by a feature,
 * 2. /asesor/project/:projectId route,
 * 3. ?project= query parameter,
 * 4. organization-only workspace.
 */
export const useWorkspaceScope = (explicitProjectId?: string | null): WorkspaceScope => {
  const params = useParams<{ projectId?: string }>();
  const [searchParams] = useSearchParams();
  const { data: team } = useMyOrganization();

  return useMemo(() => {
    const routeProjectId = params.projectId || undefined;
    const queryProjectId = searchParams.get('project') || undefined;
    const projectId = explicitProjectId || routeProjectId || queryProjectId || undefined;

    const source: WorkspaceScope['source'] = explicitProjectId
      ? 'explicit'
      : routeProjectId
        ? 'route'
        : queryProjectId
          ? 'query'
          : 'organization';

    return {
      organizationId: team?.organization?.id,
      projectId,
      source,
      isProjectScoped: Boolean(projectId),
    };
  }, [explicitProjectId, params.projectId, searchParams, team?.organization?.id]);
};
