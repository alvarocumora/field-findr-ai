import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Grid3X3, Wand2 } from 'lucide-react';
import { SubdivisionEngine } from '@/components/masterplan/SubdivisionEngine';
import { normalizePolygon } from '@/lib/polygonUtils';

/**
 * Estudio de Loteo — entry point for the auto-subdivision engine.
 *
 * The projects schema has no boundary polygon, so the agent supplies the
 * perimeter here: either a rectangular macro-lote (ancho × largo) or pasted
 * [lng, lat] coordinates (e.g. from a KMZ / GIS export). Both resolve to a
 * local-meters polygon that feeds SubdivisionEngine.
 */

// Shoelace area for a local-meters ring.
const ringArea = (pts: [number, number][]) => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
  }
  return Math.abs(a) / 2;
};

const parseCoords = (raw: string): number[][] => {
  // Accepts "lng,lat" per line or a JSON array of [lng,lat] pairs.
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

const SubdivisionStudio = () => {
  const [mode, setMode] = useState<'rect' | 'coords'>('rect');
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(240);
  const [coordsRaw, setCoordsRaw] = useState('');
  const [built, setBuilt] = useState<{ polygon: [number, number][]; area: number } | null>(null);

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
    setBuilt({ polygon, area: w * h });
  };

  const handleBuildCoords = () => {
    const coords = parseCoords(coordsRaw);
    if (coords.length < 3) {
      setBuilt(null);
      return;
    }
    const norm = normalizePolygon(coords);
    if (!norm.valid) {
      setBuilt(null);
      return;
    }
    setBuilt({ polygon: norm.localCoords, area: ringArea(norm.localCoords) });
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
            Genera una subdivisión automática y exporta el plano en PDF o DXF (AutoCAD).
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">1 · Perímetro del terreno</CardTitle>
          <CardDescription className="text-xs">
            Define el macro-lote a subdividir.
          </CardDescription>
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
          <h2 className="text-base font-semibold text-foreground">2 · Subdivisión</h2>
          <SubdivisionEngine
            polygon={built.polygon}
            totalArea={built.area}
            projectName="Loteo"
          />
        </div>
      )}
    </div>
  );
};

export default SubdivisionStudio;
