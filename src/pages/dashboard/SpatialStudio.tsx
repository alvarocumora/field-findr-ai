import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  CheckCircle2,
  Download,
  ExternalLink,
  FileArchive,
  Grid3X3,
  Map as MapIcon,
  Mountain,
  Palette,
  RefreshCw,
  Route,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KMZImportDialog } from '@/components/projects/KMZImportDialog';
import { LotMapView } from '@/components/lots/LotMapView';
import { LotDesigner3DDialog } from '@/components/lots/LotDesigner3DDialog';
import { ProjectDownloads } from '@/components/projects/ProjectDownloads';
import { useProjects } from '@/hooks/useProjects';
import { useLots, type Lot } from '@/hooks/useLots';

type SpatialMeta = {
  source_file_name?: string;
  source_file_url?: string | null;
  imported_at?: string;
  parser_version?: string;
  polygons?: number;
  roads?: number;
  roads_geojson?: GeoJSON.FeatureCollection<GeoJSON.LineString>;
};

const SpatialStudio = () => {
  const { projects, isLoading: projectsLoading, refetch: refetchProjects } = useProjects();
  const [projectId, setProjectId] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [designerLot, setDesignerLot] = useState<Lot | null>(null);

  const activeProjectId = projectId || projects[0]?.id || '';
  const project = projects.find((p) => p.id === activeProjectId) ?? null;
  const { lots, isLoading: lotsLoading, refetch: refetchLots } = useLots(activeProjectId || undefined);

  const spatial = useMemo<SpatialMeta>(() => {
    const config = project?.landing_config as Record<string, unknown> | null | undefined;
    if (!config || typeof config !== 'object') return {};
    const value = config.spatial;
    return value && typeof value === 'object' ? (value as SpatialMeta) : {};
  }, [project]);

  const validPolygons = useMemo(
    () => lots.filter((lot) => Array.isArray(lot.polygon) && lot.polygon.length >= 3).length,
    [lots],
  );

  const sourceReady = Boolean((project as any)?.kmz_file_url || spatial.source_file_url);
  const mapReady = lots.length > 0 && validPolygons > 0;
  const designReady = mapReady;

  const projectForKit = project
    ? ({
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        location: project.location,
        region: project.region,
        latitude: project.latitude,
        longitude: project.longitude,
        images: project.images,
        conditions: (project as any).commercial_conditions ?? null,
      } as any)
    : null;

  const refresh = async () => {
    await Promise.all([refetchProjects(), refetchLots()]);
  };

  if (projectsLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Cargando Spatial Studio…</div>;
  }

  if (!projects.length) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Spatial Studio</CardTitle>
            <CardDescription>Primero crea un proyecto para importar su KMZ/KML.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link to="/asesor/projects">Crear proyecto</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-primary/10 p-2"><Boxes className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Rural Finder Spatial Engine</p>
              <h1 className="text-3xl font-bold tracking-tight">Spatial Studio</h1>
            </div>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Una sola fuente KMZ/KML alimenta el inventario, masterplan, caminos/servidumbres, tour y diseño 3D de cada parcela.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={activeProjectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Selecciona proyecto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void refresh()}><RefreshCw className="mr-2 h-4 w-4" />Actualizar</Button>
        </div>
      </div>

      {project && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Fuente espacial', value: sourceReady ? 'Conectada' : 'Pendiente', icon: FileArchive, ready: sourceReady },
              { label: 'Parcelas KMZ', value: `${validPolygons} / ${lots.length}`, icon: Grid3X3, ready: mapReady },
              { label: 'Caminos / servidumbres', value: String(spatial.roads ?? 0), icon: Route, ready: (spatial.roads ?? 0) > 0 },
              { label: 'Design Lote', value: designReady ? 'Disponible' : 'Sin geometría', icon: Palette, ready: designReady },
            ].map((item) => (
              <Card key={item.label} className={item.ready ? 'border-emerald-500/20' : undefined}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-lg font-bold">{item.value}</p>
                  </div>
                  <item.icon className={`h-5 w-5 ${item.ready ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="source" className="space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
              <TabsTrigger value="source" className="gap-2"><FileArchive className="h-4 w-4" />Fuente KMZ</TabsTrigger>
              <TabsTrigger value="masterplan" className="gap-2"><MapIcon className="h-4 w-4" />Masterplan</TabsTrigger>
              <TabsTrigger value="design" className="gap-2"><Mountain className="h-4 w-4" />Design Lote</TabsTrigger>
              <TabsTrigger value="publish" className="gap-2"><Download className="h-4 w-4" />Publicar / exportar</TabsTrigger>
            </TabsList>

            <TabsContent value="source">
              <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Fuente técnica del proyecto</CardTitle>
                    <CardDescription>
                      Reimportar reemplaza geometría coincidente por número sin duplicar lotes y vuelve a extraer caminos/servidumbres.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl border bg-muted/25 p-4 text-sm">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div><p className="text-xs text-muted-foreground">Archivo</p><p className="font-medium">{spatial.source_file_name || 'Sin archivo persistido'}</p></div>
                        <div><p className="text-xs text-muted-foreground">Parser</p><p className="font-medium">{spatial.parser_version || '—'}</p></div>
                        <div><p className="text-xs text-muted-foreground">Polígonos</p><p className="font-medium">{spatial.polygons ?? validPolygons}</p></div>
                        <div><p className="text-xs text-muted-foreground">Caminos / servidumbres</p><p className="font-medium">{spatial.roads ?? 0}</p></div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => setImportOpen(true)}><FileArchive className="mr-2 h-4 w-4" />{sourceReady ? 'Actualizar KMZ/KML' : 'Importar KMZ/KML'}</Button>
                      {(project as any).kmz_file_url && (
                        <Button variant="outline" asChild>
                          <a href={(project as any).kmz_file_url} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Archivo fuente</a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Pipeline único</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {[
                      ['1', 'KMZ/KML', 'Archivo original persistido y versionable.'],
                      ['2', 'Parse & Validate', 'Reconstruye polígonos y extrae servidumbres.'],
                      ['3', 'Inventario espacial', 'Sincroniza superficie, centroides y deslindes.'],
                      ['4', 'Masterplan + 3D', 'Una geometría alimenta web, PDF, tour y diseño.'],
                    ].map(([n, title, text]) => (
                      <div key={n} className="flex gap-3 rounded-xl border p-3">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{n}</div>
                        <div><p className="font-semibold">{title}</p><p className="text-xs text-muted-foreground">{text}</p></div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="masterplan">
              <Card className="overflow-hidden">
                <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle>Masterplan vivo</CardTitle>
                    <CardDescription>Inventario sobre satélite con la geometría importada desde la fuente técnica.</CardDescription>
                  </div>
                  {mapReady && <Badge className="bg-emerald-500/10 text-emerald-700"><CheckCircle2 className="mr-1 h-3 w-3" />KMZ sincronizado</Badge>}
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[70vh] min-h-[560px]">
                    <LotMapView
                      lots={lots}
                      projectCenter={{ lat: Number(project.latitude || -33.45), lng: Number(project.longitude || -70.66) }}
                      selectedLotId={designerLot?.id ?? null}
                      onLotClick={(lot) => setDesignerLot(lot as Lot)}
                      projectId={project.id}
                      kmzFileUrl={(project as any).kmz_file_url}
                      externalRoads={spatial.roads_geojson ?? null}
                      readOnly
                      tourMode
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="design">
              <Card>
                <CardHeader>
                  <CardTitle>Design Lote</CardTitle>
                  <CardDescription>Abre cualquier parcela con su forma real, vecinos y terreno 3D para diseñar una propuesta.</CardDescription>
                </CardHeader>
                <CardContent>
                  {lotsLoading ? (
                    <p className="text-sm text-muted-foreground">Cargando parcelas…</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                      {lots.map((lot) => (
                        <button
                          key={lot.id}
                          type="button"
                          onClick={() => setDesignerLot(lot)}
                          className="rounded-2xl border p-3 text-left transition hover:border-primary hover:bg-primary/5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold">Lote {lot.lot_number}</p>
                            <Badge variant="outline" className="text-[10px]">{lot.status || 'available'}</Badge>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">{Number(lot.area).toLocaleString('es-CL')} m²</p>
                          <p className="mt-1 text-xs font-medium text-primary">Abrir diseñador 3D →</p>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="publish">
              <div className="space-y-4">
                {projectForKit && (
                  <ProjectDownloads
                    project={projectForKit}
                    lots={lots}
                    projectOwnerId={project.user_id}
                    requireLead={false}
                    showLotSheets
                    title="Material generado desde la geometría espacial"
                    description="Dossier, lista de precios, masterplan y fichas usan el mismo inventario y polígonos sincronizados."
                  />
                )}
                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                    <div>
                      <p className="font-semibold">Vista pública del proyecto</p>
                      <p className="text-xs text-muted-foreground">Verifica mapa, disponibilidad, tour y fichas antes de compartir.</p>
                    </div>
                    <Button asChild variant="outline">
                      <Link to={`/proyecto/${project.id}`}><ExternalLink className="mr-2 h-4 w-4" />Abrir proyecto</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
              <DialogHeader><DialogTitle>Spatial Engine · {project.name}</DialogTitle></DialogHeader>
              <KMZImportDialog
                projectId={project.id}
                projectName={project.name}
                onComplete={() => {
                  setImportOpen(false);
                  void refresh();
                }}
                onCancel={() => setImportOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <LotDesigner3DDialog
            lot={designerLot}
            open={Boolean(designerLot)}
            onOpenChange={(open) => !open && setDesignerLot(null)}
          />
        </>
      )}
    </div>
  );
};

export default SpatialStudio;
