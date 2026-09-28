import { useMemo } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { useLots } from '@/hooks/useLots';
import { useReservations } from '@/hooks/useReservations';
import { resolveChileCommune, resolveRegionTerritory } from '@/lib/territories';
import {
  buildProjectWorkspaceReadiness,
  buildProjectWorkspaceStats,
} from '@/lib/projects/projectWorkspace';

export const useProjectWorkspace = (projectId: string) => {
  const { projects, isLoading: projectsLoading } = useProjects();
  const project = projects.find((item) => item.id === projectId);
  const { lots, isLoading: lotsLoading } = useLots(projectId || undefined);
  const reservationsQuery = useReservations(projectId || undefined);
  const reservations = (reservationsQuery.data ?? []) as any[];

  const territory = useMemo(
    () => resolveRegionTerritory(project?.region || 'Sin región', project?.country || 'Chile'),
    [project?.region, project?.country],
  );

  const communeTerritory = useMemo(
    () => resolveChileCommune(project?.city, project?.region),
    [project?.city, project?.region],
  );

  const spatial = useMemo(() => {
    const config = project?.landing_config;
    if (!config || typeof config !== 'object' || Array.isArray(config)) return null;
    const value = (config as Record<string, unknown>).spatial;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  }, [project?.landing_config]);

  const docs = useMemo(() => {
    const projectRecord = project as any;
    const config = projectRecord?.landing_config;
    const configured = config && typeof config === 'object' ? config.documents : null;
    const candidates = [
      ...(Array.isArray(projectRecord?.legal_documents) ? projectRecord.legal_documents : []),
      ...(Array.isArray(configured) ? configured : []),
    ];
    return candidates.filter(Boolean);
  }, [project]);

  const stats = useMemo(
    () => buildProjectWorkspaceStats(lots, reservations),
    [lots, reservations],
  );

  const readiness = useMemo(
    () => buildProjectWorkspaceReadiness(project, lots, Boolean(spatial)),
    [project, lots, spatial],
  );

  const activeReservations = useMemo(
    () => reservations.filter((reservation) =>
      ['pending_payment', 'paid'].includes(reservation.status),
    ),
    [reservations],
  );

  const publicPath = project
    ? (project.slug ? `/p/${project.slug}` : `/proyecto/${project.id}/experiencia`)
    : '';

  return {
    project,
    lots,
    reservations,
    activeReservations,
    territory,
    communeTerritory,
    spatial,
    docs,
    stats,
    readiness,
    publicPath,
    isLoading: projectsLoading || lotsLoading,
    reservationsLoading: reservationsQuery.isLoading,
  };
};
