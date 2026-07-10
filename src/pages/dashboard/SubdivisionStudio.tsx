import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid3X3, Wand2, MapPin } from 'lucide-react';
import { SubdivisionEngine } from '@/components/masterplan/SubdivisionEngine';
import { normalizePolygon } from '@/lib/polygonUtils';
import { useProjects } from '@/hooks/useProjects';
import { usePersistSubdivision } from '@/hooks/usePersistSubdivision';
import { subdivisionToLotInserts, perimeterToGeo } from '@/lib/subdivision/persistLots';
import type { SubdivisionResult } from '@/lib/subdivision/autoSubdivide';
import { toast } from 'sonner';

/**
 * Estudio de Loteo — auto-subdivision engine wired to persistence.
 *
 * The perimeter comes from a rectangular macro-lote, pasted [lng,lat] coords
 * (e.g. a KMZ / GIS export) or an existing project's saved boundary. Once a
 * subdivision is generated it can be saved as real `lots` of a chosen project
 * (and the boundary is stored on the project for later re-loteo).
 */

const ringArea = (pts: [number, number][]) => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  return Math.abs(a) / 2;
};

const parseCoords = (raw: string): number[][] => {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  try {
    const json = JSON.parse(trimmed);
    if (Array.isArray(json)) {
      return json
        .map((p: unknown) => (Array.isArray(p) ? [Number(p[0]), Number(p[1])] : null))
        .filter((p): p is number[] => !!p && p.every((n) => Number.isFinite(n)));
    }
  } catch {
    // not JSON — fall through to line parsing
  }
  return trimmed
    .split(/\n+/)
    .map((line) => line.split(/[,;\s]+/).map(Number).filter((n) => Number.isFinite(n)))
    .filter((nums) => nums.length >= 2)
    .map((nums) => [nums[0], nums[1]]);
};

interface BuiltPerimeter {
  polygon: [number, number][];
  area: number;
  /** Geo anchor when the perimeter carries geo (coords / project boundary). */
  center: { lng: number; lat: number } | null;
}

const SubdivisionStudio = () => {
  const { projects } = useProjects();
  const persist = usePersistSubdivision();

  const [mode, setMode] = useState<'rect' | 'coords'>('rect');
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(240);
  const [coordsRaw, setCoordsRaw] = useState('');
  const [built, setBuilt] = useState<BuiltPerimeter | null>(null);

  const [projectId, setProjectId] = useState<string>('');
  const [pricePerSqm, setPricePerSqm] = useState<number>(0);

  const selectedProject = projects.find((p) => p.id === projectId);
  const projectBoundary = (selectedProject as unknown as { boundary?: number[][] } | undefined)?.boundary;

  const rectPreviewArea = useMemo(() => Math.max(0, width) * Math.max(0, height), [width, height]);

  const handleBuildRect = () => {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    const polygon: [number, number][] = [
      [-w / 2, -h / 2],
      [w / 2, -h / 2],
      [w / 2, h / 2],
      [-w / 2, h / 2],
    ];
    setBuilt({ polygon, area: w * h, center: null });
  };

  const handleBuildCoords = () => {
    const coords = parseCoords(coordsRaw);
    if (coords.length < 3) return setBuilt(null);
    const norm = normalizePolygon(coords);
    if (!norm.valid) return setBuilt(null);
    setBuilt({
      polygon: norm.localCoords,
      area: ringArea(norm.localCoords),
      center: { lng: norm.centroidLng, lat: norm.centroidLat },
    });
  };

  const handleLoadProjectBoundary = () => {
    if (!projectBoundary || projectBoundary.length < 3) return;
    const norm = normalizePolygon(projectBoundary);
    if (!norm.valid) return toast.error('El perímetro guardado del proyecto no es válido');
    setBuilt({
      polygon: norm.localCoords,
      area: ringArea(norm.localCoords),
      center: { lng: norm.centroidLng, lat: norm.centroidLat },
    });
    toast.success('Perímetro del proyecto cargado');
  };

  const handlePersist = (result: SubdivisionResult) => {
    if (!built || !selectedProject) return;
    if (result.lots.length === 0) return toast.error('Genera una subdivisión con lotes antes de guardar');

    // Geo anchor: the perimeter's own centre, else the project's coordinates.
    const center =
      built.center ??
      (selectedProject.latitude != null && selectedProject.longitude != null
        ? { lng: Number(selectedProject.longitude), lat: Number(selectedProject.latitude) }
        : null);
    if (!center) {
      toast.error('Este proyecto no tiene coordenadas. Usa el modo "Coordenadas" o define lat/lng del proyecto.');
      return;
    }

    const lots = subdivisionToLotInserts(result, {
      projectId: selectedProject.id,
      centerLng: center.lng,
      centerLat: center.lat,
      pricePerSqm,
    });
    const boundary = perimeterToGeo(built.polygon, center.lng, center.lat);
    persist.mutate({ projectId: selectedProject.id, lots, boundary });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <Grid3X3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estudio de Loteo</h1>
          <p className="text-sm text-muted-foreground">
            Genera una subdivisión automática, guárdala como lotes del proyecto y exporta el plano (PDF / DXF).
          </p>
        </div>
      </div>

      {/* Project + pricing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">1 · Proyecto destino</CardTitle>
          <CardDescription className="text-xs">
            Elige a qué proyecto se guardarán los lotes generados y su precio referencial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Proyecto</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="h-9 w-72"><SelectValue placeholder="Selecciona un proyecto…" /></SelectTrigger>
                <SelectContent>
                  {projects.length === 0 && <SelectItem value="none" disabled>No tienes proyectos</SelectItem>}
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Precio por m² (opcional)</Label>
              <Input
                type="number"
                value={pricePerSqm || ''}
                placeholder="0"
                className="h-9 w-40"
                onChange={(e) => setPricePerSqm(Math.max(0, Number(e.target.value)))}
              />
            </div>
            {selectedProject && projectBoundary && projectBoundary.length >= 3 && (
              <Button variant="outline" className="gap-1.5" onClick={handleLoadProjectBoundary}>
                <MapPin className="h-4 w-4" /> Cargar perímetro del proyecto
              </Button>
            )}
          </div>
          {!projectId && (
            <p className="text-[11px] text-muted-foreground mt-2">
              Sin proyecto seleccionado puedes generar y exportar el plano, pero no guardar los lotes.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">2 · Perímetro del terreno</CardTitle>
          <CardDescription className="text-xs">Define el macro-lote a subdividir.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'rect' | 'coords')}>
            <TabsList className="h-8">
              <TabsTrigger value="rect" className="text-xs h-7">Rectangular</TabsTrigger>
              <TabsTrigger value="coords" className="text-xs h-7">Coordenadas (lng, lat)</TabsTrigger>
            </TabsList>

            <TabsContent value="rect" className="pt-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Ancho (m)</Label>
                  <Input type="number" value={width} className="h-9 w-32"
                    onChange={(e) => setWidth(Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Largo (m)</Label>
                  <Input type="number" value={height} className="h-9 w-32"
                    onChange={(e) => setHeight(Number(e.target.value))} />
                </div>
                <div className="text-sm text-muted-foreground">
                  Superficie: <strong>{rectPreviewArea.toLocaleString('es-CL')} m²</strong>
                  {' '}({(rectPreviewArea / 10000).toFixed(2)} ha)
                </div>
                <Button onClick={handleBuildRect} className="gap-1.5">
                  <Wand2 className="h-4 w-4" /> Usar este perímetro
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                El macro-lote rectangular se ancla en las coordenadas del proyecto al guardar.
              </p>
            </TabsContent>

            <TabsContent value="coords" className="pt-4 space-y-3">
              <Label className="text-xs">
                Pega los vértices como <code>lng,lat</code> (uno por línea) o un array JSON de pares
              </Label>
              <Textarea
                value={coordsRaw}
                onChange={(e) => setCoordsRaw(e.target.value)}
                rows={5}
                placeholder={'-71.160,-34.870\n-71.158,-34.870\n-71.158,-34.868\n-71.160,-34.868'}
                className="font-mono text-xs"
              />
              <Button onClick={handleBuildCoords} className="gap-1.5">
                <Wand2 className="h-4 w-4" /> Usar este perímetro
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {built && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">3 · Subdivisión y guardado</h2>
          <SubdivisionEngine
            polygon={built.polygon}
            totalArea={built.area}
            projectName={selectedProject?.name || 'Loteo'}
            onApplyLots={projectId ? handlePersist : undefined}
            applyLabel={persist.isPending ? 'Guardando…' : undefined}
            applyDisabled={persist.isPending}
          />
        </div>
      )}
    </div>
  );
};

export default SubdivisionStudio;
