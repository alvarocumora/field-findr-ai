export const PROJECT_WORKSPACE_TABS = [
  'resumen',
  'inventario',
  'masterplan',
  'publicacion',
  'comercial',
  'reservas',
  'ventas',
  'documentos',
  'reportes',
  'configuracion',
] as const;

export type ProjectWorkspaceTab = (typeof PROJECT_WORKSPACE_TABS)[number];

export const resolveProjectWorkspaceTab = (
  value: string | null | undefined,
): ProjectWorkspaceTab =>
  value && PROJECT_WORKSPACE_TABS.includes(value as ProjectWorkspaceTab)
    ? value as ProjectWorkspaceTab
    : 'resumen';

export const projectWorkspacePath = (
  projectId: string,
  tab: ProjectWorkspaceTab = 'resumen',
): string =>
  tab === 'resumen'
    ? `/asesor/project/${projectId}`
    : `/asesor/project/${projectId}?tab=${tab}`;

export interface WorkspaceLotLike {
  status?: string | null;
  price?: number | string | null;
  area?: number | string | null;
}

export interface WorkspaceReservationLike {
  status?: string | null;
  reservation_amount?: number | string | null;
}

export interface WorkspaceProjectLike {
  region?: string | null;
  country?: string | null;
  kmz_file_url?: string | null;
  images?: string[] | null;
  status?: string | null;
}

export interface WorkspaceStats {
  total: number;
  available: number;
  reserved: number;
  sold: number;
  soldPct: number;
  inventoryValue: number;
  soldValue: number;
  pendingReservations: number;
  paidReservations: number;
  deposited: number;
}

export const buildProjectWorkspaceStats = (
  lots: readonly WorkspaceLotLike[],
  reservations: readonly WorkspaceReservationLike[],
): WorkspaceStats => {
  const available = lots.filter((lot) => lot.status === 'available');
  const reserved = lots.filter((lot) => lot.status === 'reserved');
  const sold = lots.filter((lot) => lot.status === 'sold');
  const pendingReservations = reservations.filter(
    (reservation) => reservation.status === 'pending_payment',
  );
  const paidReservations = reservations.filter(
    (reservation) => reservation.status === 'paid',
  );

  return {
    total: lots.length,
    available: available.length,
    reserved: reserved.length,
    sold: sold.length,
    soldPct: lots.length ? Math.round((sold.length / lots.length) * 100) : 0,
    inventoryValue: available.reduce((sum, lot) => sum + Number(lot.price || 0), 0),
    soldValue: sold.reduce((sum, lot) => sum + Number(lot.price || 0), 0),
    pendingReservations: pendingReservations.length,
    paidReservations: paidReservations.length,
    deposited: reservations
      .filter((reservation) => ['paid', 'converted'].includes(reservation.status || ''))
      .reduce((sum, reservation) => sum + Number(reservation.reservation_amount || 0), 0),
  };
};

export interface WorkspaceReadiness {
  checks: Array<{ label: string; ready: boolean }>;
  score: number;
}

export const buildProjectWorkspaceReadiness = (
  project: WorkspaceProjectLike | null | undefined,
  lots: readonly WorkspaceLotLike[],
  hasSpatialSource: boolean,
): WorkspaceReadiness => {
  if (!project) return { checks: [], score: 0 };

  const checks = [
    { label: 'Territorio definido', ready: Boolean(project.region && project.country) },
    { label: 'Fuente KMZ / espacial', ready: Boolean(project.kmz_file_url || hasSpatialSource) },
    { label: 'Inventario cargado', ready: lots.length > 0 },
    {
      label: 'Precios completos',
      ready: lots.length > 0
        && lots.every((lot) => Number(lot.price || 0) > 0 || lot.status === 'sold'),
    },
    { label: 'Imágenes del proyecto', ready: Boolean(project.images?.length) },
    { label: 'Proyecto publicado', ready: project.status === 'active' },
  ];

  return {
    checks,
    score: Math.round((checks.filter((check) => check.ready).length / checks.length) * 100),
  };
};
