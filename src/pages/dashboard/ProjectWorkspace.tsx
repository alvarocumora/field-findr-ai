import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  FileText,
  Gauge,
  Globe2,
  Grid3X3,
  MapPinned,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjects } from '@/hooks/useProjects';
import { useLots } from '@/hooks/useLots';
import { useReservations } from '@/hooks/useReservations';
import { resolveRegionTerritory } from '@/lib/territories';

const money = (amount: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const statusLabel: Record<string, string> = {
  draft: 'Borrador',
  planning: 'Configurando',
  pending_review: 'En revisión',
  active: 'Publicado',
  inactive: 'Pausado',
  sold_out: 'Agotado',
  completed: 'Completado',
  rejected: 'Rechazado',
};

const lotStatus: Record<string, { label: string; className: string }> = {
  available: { label: 'Disponible', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' },
  reserved: { label: 'Reservado', className: 'border-amber-500/30 bg-amber-500/10 text-amber-700' },
  sold: { label: 'Vendido', className: 'border-sky-500/30 bg-sky-500/10 text-sky-700' },
  blocked: { label: 'Bloqueado', className: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-600' },
};

const reservationStatus: Record<string, string> = {
  pending_payment: 'Pago pendiente',
  paid: 'Pagada',
  converted: 'Convertida',
  expired: 'Vencida',
  cancelled: 'Cancelada',
};

const workspaceTabs = [
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

type WorkspaceTab = (typeof workspaceTabs)[number];

const ProjectWorkspace = () => {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') as WorkspaceTab | null;
  const activeTab: WorkspaceTab = requestedTab && workspaceTabs.includes(requestedTab) ? requestedTab : 'resumen';

  const { projects, isLoading: projectsLoading } = useProjects();
  const project = projects.find((item) => item.id === projectId);
  const { lots, isLoading: lotsLoading } = useLots(projectId || undefined);
  const { data: reservations = [], isLoading: reservationsLoading } = useReservations(projectId || undefined);

  const territory = useMemo(
    () => resolveRegionTerritory(project?.region || 'Sin región', project?.country || 'Chile'),
    [project?.region, project?.country],
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
    const projectAny = project as any;
    const config = projectAny?.landing_config;
    const configured = config && typeof config === 'object' ? config.documents : null;
    const candidates = [
      ...(Array.isArray(projectAny?.legal_documents) ? projectAny.legal_documents : []),
      ...(Array.isArray(configured) ? configured : []),
    ];
    return candidates.filter(Boolean);
  }, [project]);

  const stats = useMemo(() => {
    const available = lots.filter((lot) => lot.status === 'available');
    const reserved = lots.filter((lot) => lot.status === 'reserved');
    const sold = lots.filter((lot) => lot.status === 'sold');
    const pendingReservations = (reservations as any[]).filter((reservation) => reservation.status === 'pending_payment');
    const paidReservations = (reservations as any[]).filter((reservation) => reservation.status === 'paid');
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
      deposited: (reservations as any[])
        .filter((reservation) => ['paid', 'converted'].includes(reservation.status))
        .reduce((sum, reservation) => sum + Number(reservation.reservation_amount || 0), 0),
    };
  }, [lots, reservations]);

  const readiness = useMemo(() => {
    if (!project) return { checks: [], score: 0 };
    const checks = [
      { label: 'Territorio definido', ready: Boolean(project.region && project.country) },
      { label: 'Fuente KMZ / espacial', ready: Boolean(project.kmz_file_url || spatial) },
      { label: 'Inventario cargado', ready: lots.length > 0 },
      { label: 'Precios completos', ready: lots.length > 0 && lots.every((lot) => Number(lot.price || 0) > 0 || lot.status === 'sold') },
      { label: 'Imágenes del proyecto', ready: Boolean(project.images?.length) },
      { label: 'Proyecto publicado', ready: project.status === 'active' },
    ];
    return {
      checks,
      score: Math.round((checks.filter((check) => check.ready).length / checks.length) * 100),
    };
  }, [project, lots, spatial]);

  if (projectsLoading || lotsLoading) {
    return (
      <div className="space-y-5 p-4 md:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Building2 className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Proyecto no encontrado</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          El proyecto no está disponible para tu organización o ya no existe.
        </p>
        <Button asChild><Link to="/asesor/projects">Volver a proyectos</Link></Button>
      </div>
    );
  }

  const projectAny = project as any;
  const publicPath = projectAny.slug ? `/p/${projectAny.slug}` : `/proyecto/${project.id}/experiencia`;
  const activeReservations = (reservations as any[]).filter((reservation) =>
    ['pending_payment', 'paid'].includes(reservation.status),
  );

  const setTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'resumen') next.delete('tab');
    else next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <header className="flex flex-col gap-4 rounded-2xl border bg-card p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 h-8">
            <Link to="/asesor/projects"><ArrowLeft className="mr-1.5 h-4 w-4" />Proyectos</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-bold tracking-tight md:text-3xl">{project.name}</h1>
            <Badge variant="outline">{statusLabel[project.status || 'draft'] || project.status}</Badge>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <MapPinned className="h-4 w-4" />
            {project.city || project.location || 'Ubicación por completar'}
            {project.region ? <> · {territory.displayName}</> : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={publicPath} target="_blank"><ExternalLink className="mr-2 h-4 w-4" />Sitio público</Link>
          </Button>
          <Button asChild>
            <Link to={`/asesor/spatial?project=${project.id}`}><MapPinned className="mr-2 h-4 w-4" />Masterplan</Link>
          </Button>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setTab} className="space-y-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto min-w-max justify-start gap-1 bg-muted/60 p-1">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="inventario">Inventario</TabsTrigger>
            <TabsTrigger value="masterplan">Masterplan</TabsTrigger>
            <TabsTrigger value="publicacion">Publicación</TabsTrigger>
            <TabsTrigger value="comercial">Comercial</TabsTrigger>
            <TabsTrigger value="reservas">Reservas</TabsTrigger>
            <TabsTrigger value="ventas">Ventas</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="reportes">Reportes</TabsTrigger>
            <TabsTrigger value="configuracion">Configuración</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="resumen" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Lotes disponibles', value: stats.available, hint: `${stats.total} lotes totales`, icon: Grid3X3 },
              { label: 'Reservas activas', value: stats.pendingReservations + stats.paidReservations, hint: `${stats.paidReservations} pagadas`, icon: CalendarCheck },
              { label: 'Ventas', value: stats.sold, hint: `${stats.soldPct}% absorción`, icon: ShoppingCart },
              { label: 'Valor vendido', value: money(stats.soldValue), hint: `Stock ${money(stats.inventoryValue)}`, icon: CircleDollarSign },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs">{item.label}</span>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <p className="mt-2 text-2xl font-bold">{item.value}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{item.hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-3 text-base">
                  <span className="flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" />Preparación comercial</span>
                  <span>{readiness.score}%</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={readiness.score} className="h-2.5" />
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {readiness.checks.map((check) => (
                    <div key={check.label} className="flex items-center gap-2 rounded-lg border p-2.5 text-sm">
                      <CheckCircle2 className={`h-4 w-4 ${check.ready ? 'text-emerald-500' : 'text-muted-foreground/30'}`} />
                      <span className={check.ready ? '' : 'text-muted-foreground'}>{check.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Siguiente acción</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {readiness.score < 100 ? (
                  <>
                    <p className="text-sm text-muted-foreground">Completa configuración, inventario y publicación antes de escalar campañas.</p>
                    <Button className="w-full" asChild>
                      <Link to={`/asesor/spatial?project=${project.id}`}>Completar proyecto</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">El proyecto está preparado comercialmente. Revisa pipeline y reservas.</p>
                    <Button className="w-full" onClick={() => setTab('comercial')}>Ir a Comercial</Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventario">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Inventario del proyecto</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Fuente única para disponibilidad, precios y portal público.</p>
              </div>
              <Button asChild variant="outline"><Link to={`/asesor/lots?project=${project.id}`}>Gestión avanzada</Link></Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr><th className="p-3">Lote</th><th>Superficie</th><th>Precio</th><th>Estado</th><th>Precio/m²</th></tr>
                  </thead>
                  <tbody>
                    {lots.slice(0, 20).map((lot) => {
                      const config = lotStatus[lot.status || 'available'] || lotStatus.available;
                      return (
                        <tr key={lot.id} className="border-t">
                          <td className="p-3 font-medium">Lote {lot.lot_number}</td>
                          <td>{Number(lot.area || 0).toLocaleString('es-CL')} m²</td>
                          <td>{lot.price ? money(Number(lot.price)) : 'Consultar'}</td>
                          <td><Badge variant="outline" className={config.className}>{config.label}</Badge></td>
                          <td>{lot.price && lot.area ? money(Number(lot.price) / Number(lot.area)) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {lots.length > 20 && <p className="mt-3 text-xs text-muted-foreground">Mostrando 20 de {lots.length} lotes.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="masterplan">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MapPinned className="h-5 w-5" />Fuente espacial</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">KMZ/KML</span><span className="font-medium">{project.kmz_file_url ? 'Cargado' : 'Pendiente'}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Parcelas detectadas</span><span className="font-medium">{String(spatial?.polygon_count ?? lots.length)}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Caminos/servidumbres</span><span className="font-medium">{String(spatial?.road_count ?? '—')}</span></div>
                <Button className="w-full" asChild><Link to={`/asesor/spatial?project=${project.id}`}>Abrir Spatial Studio</Link></Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Flujo espacial</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>KMZ/KML → Lotes → Caminos/servidumbres → Masterplan → Design Lote → PDF/Tour.</p>
                <p>La geometría del proyecto sigue siendo la fuente de verdad para la experiencia pública.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="publicacion">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Globe2 className="h-5 w-5" />Publicación del proyecto</CardTitle></CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-[1fr_auto]">
              <div>
                <Progress value={readiness.score} className="h-2.5" />
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {readiness.checks.map((check) => (
                    <div key={check.label} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 ${check.ready ? 'text-emerald-500' : 'text-muted-foreground/30'}`} />
                      {check.label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex min-w-[190px] flex-col gap-2">
                <Button asChild><Link to={publicPath} target="_blank">Vista pública</Link></Button>
                <Button asChild variant="outline"><Link to="/asesor/projects">Estado y aprobación</Link></Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comercial">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'CRM', text: 'Clientes y seguimiento', to: '/asesor/crm', icon: Users },
              { label: 'Pipeline', text: 'Etapas comerciales', to: '/asesor/pipeline', icon: BarChart3 },
              { label: 'Visitas', text: 'Agenda en terreno', to: '/asesor/visitas', icon: MapPinned },
              { label: 'Reservas', text: `${stats.pendingReservations + stats.paidReservations} activas`, to: '/asesor/reservations', icon: CalendarCheck },
            ].map((action) => (
              <Card key={action.label} className="transition hover:border-primary/30">
                <CardContent className="p-4">
                  <action.icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 font-semibold">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.text}</p>
                  <Button asChild variant="ghost" size="sm" className="-ml-3 mt-2"><Link to={action.to}>Abrir</Link></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reservas">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div><CardTitle>Reservas</CardTitle><p className="mt-1 text-sm text-muted-foreground">Operación comercial de este proyecto.</p></div>
              <Button asChild variant="outline"><Link to="/asesor/reservations">Gestor completo</Link></Button>
            </CardHeader>
            <CardContent>
              {reservationsLoading ? <Skeleton className="h-36 w-full" /> : activeReservations.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">No hay reservas activas en este proyecto.</div>
              ) : (
                <div className="divide-y rounded-xl border">
                  {activeReservations.slice(0, 10).map((reservation: any) => (
                    <div key={reservation.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{reservation.buyer_name}</p>
                        <p className="text-xs text-muted-foreground">Lote {reservation.lots?.lot_number} · {reservation.buyer_email}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{reservationStatus[reservation.status] || reservation.status}</Badge>
                        <p className="mt-1 text-xs text-muted-foreground">{money(Number(reservation.reservation_amount || 0))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ventas">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <Card>
              <CardHeader><CardTitle>Resultado comercial</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><p className="text-xs text-muted-foreground">Valor vendido</p><p className="text-3xl font-bold">{money(stats.soldValue)}</p></div>
                <div><p className="text-xs text-muted-foreground">Señas cobradas</p><p className="text-xl font-semibold">{money(stats.deposited)}</p></div>
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline"><Link to="/asesor/sales">Ventas</Link></Button>
                  <Button asChild variant="outline"><Link to="/asesor/comisiones">Comisiones</Link></Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Lotes vendidos</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {lots.filter((lot) => lot.status === 'sold').slice(0, 8).map((lot) => (
                  <div key={lot.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span className="font-medium">Lote {lot.lot_number}</span><span>{money(Number(lot.price || 0))}</span>
                  </div>
                ))}
                {stats.sold === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay ventas registradas.</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Documentos</CardTitle></CardHeader>
            <CardContent>
              {docs.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-muted-foreground">No hay documentos de proyecto configurados en la landing.</p>
                  <Button asChild variant="outline" className="mt-3"><Link to="/asesor/projects">Gestionar proyecto</Link></Button>
                </div>
              ) : (
                <div className="divide-y rounded-xl border">
                  {docs.slice(0, 12).map((doc: any, index: number) => (
                    <div key={doc.id || doc.url || index} className="flex items-center justify-between p-3">
                      <span className="text-sm font-medium">{doc.name || doc.title || `Documento ${index + 1}`}</span>
                      {doc.url && <Button asChild size="sm" variant="ghost"><a href={doc.url} target="_blank" rel="noreferrer">Abrir</a></Button>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reportes">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Absorción', `${stats.soldPct}%`],
              ['Inventario disponible', money(stats.inventoryValue)],
              ['Ventas', money(stats.soldValue)],
              ['Reservas pagadas', String(stats.paidReservations)],
            ].map(([label, value]) => (
              <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></CardContent></Card>
            ))}
          </div>
          <Button asChild variant="outline" className="mt-4"><Link to="/asesor/reports">Abrir centro de reportes</Link></Button>
        </TabsContent>

        <TabsContent value="configuracion">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Proyecto</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Nombre</span><span className="font-medium">{project.name}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">ROL</span><span className="font-medium">{project.rol_number || '—'}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Estado</span><span className="font-medium">{statusLabel[project.status || 'draft'] || project.status}</span></div>
                <Button asChild variant="outline" className="w-full"><Link to="/asesor/projects">Editar proyecto</Link></Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Globe2 className="h-5 w-5" />Territorio</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">País</span><span className="font-medium">{project.country || 'Chile'}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Región canónica</span><span className="font-medium">{project.region ? territory.displayName : 'Pendiente'}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Comuna / ciudad</span><span className="font-medium">{project.city || 'Pendiente'}</span></div>
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">Ubicación</span><span className="font-medium text-right">{project.location || 'Pendiente'}</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectWorkspace;
