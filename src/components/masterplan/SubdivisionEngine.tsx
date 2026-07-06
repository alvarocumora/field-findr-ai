import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Grid3X3, TreePine, Route, Ruler, Download, Wand2 } from 'lucide-react';
import { autoSubdivide, type SubdivisionParams, type SubdivisionResult } from '@/lib/subdivision/autoSubdivide';
import {
  NORMATIVE_PROFILES, calculateAreaBreakdown, validateSubdivision, estimateMaxLots,
} from '@/lib/subdivision/areaCalculations';
import { downloadScaledPdf, type PdfLot } from '@/lib/exporters/scaledPdfExporter';
import { downloadDxf, type DxfLot } from '@/lib/exporters/dxfExporter';
import { toast } from 'sonner';

const slugify = (s: string) =>
  (s || 'loteo').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'loteo';

interface SubdivisionEngineProps {
  polygon: [number, number][] | null;
  totalArea: number;
  projectName?: string;
  onApplyLots?: (lots: SubdivisionResult) => void;
}

export const SubdivisionEngine = ({
  polygon, totalArea, projectName, onApplyLots,
}: SubdivisionEngineProps) => {
  const [profileKey, setProfileKey] = useState('rural_5000');
  const [customParams, setCustomParams] = useState<SubdivisionParams>({
    minLotArea: 5000,
    roadPercentage: 15,
    greenPercentage: 10,
    minFrontage: 20,
    roadWidth: 8,
    targetLots: undefined,
  });
  const [result, setResult] = useState<SubdivisionResult | null>(null);

  const profile = NORMATIVE_PROFILES[profileKey];

  // Update params when profile changes
  const handleProfileChange = (key: string) => {
    setProfileKey(key);
    const p = NORMATIVE_PROFILES[key];
    setCustomParams({
      minLotArea: p.minLotArea,
      roadPercentage: p.roadPercentage,
      greenPercentage: p.greenPercentage,
      minFrontage: p.minFrontage,
      roadWidth: p.roadWidth,
    });
  };

  const areaBreakdown = useMemo(() =>
    calculateAreaBreakdown(totalArea, customParams.roadPercentage, customParams.greenPercentage),
    [totalArea, customParams.roadPercentage, customParams.greenPercentage]
  );

  const maxLots = useMemo(() => estimateMaxLots(totalArea, profile), [totalArea, profile]);

  const validation = useMemo(() => {
    const numLots = customParams.targetLots || maxLots;
    return validateSubdivision(totalArea, numLots, profile);
  }, [totalArea, customParams.targetLots, maxLots, profile]);

  const handleSubdivide = () => {
    if (!polygon || polygon.length < 3) {
      toast.error('Se necesita un polígono válido para subdividir');
      return;
    }
    const r = autoSubdivide(polygon, customParams);
    setResult(r);
    toast.success(`Subdivisión generada: ${r.lots.length} lotes`);
  };

  const handleApply = () => {
    if (result && onApplyLots) {
      onApplyLots(result);
      toast.success('Lotes aplicados al proyecto');
    }
  };

  const handleExportPdf = () => {
    if (!result) return;
    const lots: PdfLot[] = result.lots.map((l) => ({
      id: String(l.id),
      label: `L${l.id}`,
      polygon: l.polygon,
      area: l.area,
      status: 'available',
    }));
    const roads = result.roads.map((r) => r.polygon);
    downloadScaledPdf(lots, `plano-loteo-${slugify(projectName || '')}`, roads, {
      projectName: projectName || 'Loteo',
      scale: 1000,
    });
    toast.success('Plano PDF descargado');
  };

  const handleExportDxf = () => {
    if (!result) return;
    const lots: DxfLot[] = result.lots.map((l) => ({
      id: String(l.id),
      label: `L${l.id}`,
      polygon: l.polygon,
      area: l.area,
    }));
    const roads = result.roads.map((r) => r.polygon);
    downloadDxf(lots, `loteo-${slugify(projectName || '')}`, roads, {
      projectName: projectName || 'Loteo',
      scale: 1000,
    });
    toast.success('Archivo DXF descargado');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Configuration Panel */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Motor de Subdivisión
          </CardTitle>
          <CardDescription className="text-xs">
            Configura los parámetros de parcelación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-3">
            <div className="space-y-4">
              {/* Normative Profile */}
              <div className="space-y-1.5">
                <Label className="text-xs">Perfil Normativo</Label>
                <Select value={profileKey} onValueChange={handleProfileChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NORMATIVE_PROFILES).map(([key, p]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">{profile.description}</p>
              </div>

              <Separator />

              {/* Area Info */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <p className="text-xs font-medium">Área Total: {totalArea.toLocaleString('es-CL')} m²</p>
                <p className="text-xs text-muted-foreground">
                  ({(totalArea / 10000).toFixed(2)} ha) · Máx {maxLots} lotes
                </p>
              </div>

              {/* Parameters */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Área mínima por lote (m²)</Label>
                  <Input
                    type="number"
                    value={customParams.minLotArea}
                    onChange={e => setCustomParams(p => ({ ...p, minLotArea: Number(e.target.value) }))}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Frente mínimo (m)</Label>
                  <Input
                    type="number"
                    value={customParams.minFrontage}
                    onChange={e => setCustomParams(p => ({ ...p, minFrontage: Number(e.target.value) }))}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">N° de lotes objetivo (opcional)</Label>
                  <Input
                    type="number"
                    value={customParams.targetLots || ''}
                    placeholder="Auto"
                    onChange={e => setCustomParams(p => ({
                      ...p,
                      targetLots: e.target.value ? Number(e.target.value) : undefined,
                    }))}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-xs">Vialidad: {customParams.roadPercentage}%</Label>
                    <span className="text-[10px] text-muted-foreground">
                      {Math.round(areaBreakdown.roadArea).toLocaleString('es-CL')} m²
                    </span>
                  </div>
                  <Slider
                    value={[customParams.roadPercentage]}
                    min={5}
                    max={30}
                    step={1}
                    onValueChange={([v]) => setCustomParams(p => ({ ...p, roadPercentage: v }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-xs">Áreas Verdes: {customParams.greenPercentage}%</Label>
                    <span className="text-[10px] text-muted-foreground">
                      {Math.round(areaBreakdown.greenArea).toLocaleString('es-CL')} m²
                    </span>
                  </div>
                  <Slider
                    value={[customParams.greenPercentage]}
                    min={0}
                    max={25}
                    step={1}
                    onValueChange={([v]) => setCustomParams(p => ({ ...p, greenPercentage: v }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Ancho de camino (m)</Label>
                  <Slider
                    value={[customParams.roadWidth]}
                    min={4}
                    max={14}
                    step={0.5}
                    onValueChange={([v]) => setCustomParams(p => ({ ...p, roadWidth: v }))}
                  />
                  <p className="text-[10px] text-muted-foreground text-right">{customParams.roadWidth}m</p>
                </div>
              </div>

              {/* Validation */}
              <div className="space-y-2">
                {validation.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-destructive">
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    <p className="text-[10px]">{err}</p>
                  </div>
                ))}
                {validation.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-yellow-600">
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    <p className="text-[10px]">{w}</p>
                  </div>
                ))}
                {validation.valid && validation.warnings.length === 0 && (
                  <div className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    <p className="text-[10px]">Cumple normativa</p>
                  </div>
                )}
              </div>

              <Button onClick={handleSubdivide} className="w-full" disabled={!polygon}>
                <Wand2 className="h-4 w-4 mr-2" />
                Generar Subdivisión
              </Button>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resultado</CardTitle>
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="h-[500px] flex items-center justify-center text-muted-foreground text-sm">
              Configura los parámetros y genera la subdivisión
            </div>
          ) : (
            <Tabs defaultValue="preview" className="h-[500px]">
              <TabsList className="h-8">
                <TabsTrigger value="preview" className="text-xs h-7">Vista Previa</TabsTrigger>
                <TabsTrigger value="stats" className="text-xs h-7">Estadísticas</TabsTrigger>
                <TabsTrigger value="lots" className="text-xs h-7">Lotes ({result.lots.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="h-[450px]">
                <SubdivisionPreview result={result} />
              </TabsContent>

              <TabsContent value="stats">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <StatCard icon={<Grid3X3 className="h-4 w-4" />} label="Total Lotes" value={result.stats.totalLots} />
                  <StatCard icon={<Ruler className="h-4 w-4" />} label="Área Promedio" value={`${Math.round(result.stats.avgLotArea).toLocaleString('es-CL')} m²`} />
                  <StatCard icon={<Route className="h-4 w-4" />} label="Vialidad" value={`${Math.round(result.stats.roadArea).toLocaleString('es-CL')} m²`} />
                  <StatCard icon={<TreePine className="h-4 w-4" />} label="Eficiencia" value={`${result.stats.efficiency.toFixed(1)}%`} />
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-medium">Desglose de áreas</p>
                  <AreaBar label="Lotes" value={result.stats.usableArea} total={result.stats.totalArea} color="bg-primary" />
                  <AreaBar label="Vialidad" value={result.stats.roadArea} total={result.stats.totalArea} color="bg-muted-foreground" />
                  <AreaBar label="Áreas Verdes" value={result.stats.greenArea} total={result.stats.totalArea} color="bg-green-500" />
                </div>
              </TabsContent>

              <TabsContent value="lots">
                <ScrollArea className="h-[440px]">
                  <div className="space-y-1">
                    {result.lots.map(lot => (
                      <div key={lot.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">L{lot.id}</Badge>
                          <span>{Math.round(lot.area).toLocaleString('es-CL')} m²</span>
                        </div>
                        <span className="text-muted-foreground">
                          {lot.frontage.toFixed(1)}m × {lot.depth.toFixed(1)}m
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}

          {result && (
            <div className="flex flex-wrap gap-2 mt-3">
              <Button variant="outline" onClick={handleExportPdf} className="gap-1.5">
                <Download className="h-4 w-4" /> Plano PDF
              </Button>
              <Button variant="outline" onClick={handleExportDxf} className="gap-1.5">
                <Download className="h-4 w-4" /> DXF (AutoCAD)
              </Button>
              {onApplyLots && (
                <Button onClick={handleApply} className="flex-1">
                  Aplicar {result.lots.length} Lotes al Proyecto
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/** SVG preview of the subdivision */
const SubdivisionPreview = ({ result }: { result: SubdivisionResult }) => {
  const allPoints = result.lots.flatMap(l => l.polygon);
  if (allPoints.length === 0) return null;

  const xs = allPoints.map(p => p[0]);
  const ys = allPoints.map(p => p[1]);
  const minX = Math.min(...xs) - 5;
  const maxX = Math.max(...xs) + 5;
  const minY = Math.min(...ys) - 5;
  const maxY = Math.max(...ys) + 5;
  const w = maxX - minX;
  const h = maxY - minY;

  return (
    <svg viewBox={`${minX} ${minY} ${w} ${h}`} className="w-full h-full bg-muted/30 rounded-lg" style={{ transform: 'scaleY(-1)' }}>
      {/* Roads */}
      {result.roads.map(road => (
        <polygon
          key={road.id}
          points={road.polygon.map(p => `${p[0]},${p[1]}`).join(' ')}
          fill="hsl(var(--muted-foreground))"
          opacity={0.4}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={0.3}
        />
      ))}
      {/* Green areas */}
      {result.greenAreas.map(ga => (
        <polygon
          key={ga.id}
          points={ga.polygon.map(p => `${p[0]},${p[1]}`).join(' ')}
          fill="#4CAF50"
          opacity={0.3}
          stroke="#2E7D32"
          strokeWidth={0.3}
        />
      ))}
      {/* Lots */}
      {result.lots.map(lot => {
        const cx = lot.polygon.reduce((s, p) => s + p[0], 0) / lot.polygon.length;
        const cy = lot.polygon.reduce((s, p) => s + p[1], 0) / lot.polygon.length;
        return (
          <g key={lot.id}>
            <polygon
              points={lot.polygon.map(p => `${p[0]},${p[1]}`).join(' ')}
              fill="hsl(var(--primary))"
              opacity={0.15}
              stroke="hsl(var(--primary))"
              strokeWidth={0.4}
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={Math.min(w, h) * 0.025}
              fill="hsl(var(--foreground))"
              style={{ transform: 'scaleY(-1)', transformOrigin: `${cx}px ${cy}px` }}
            >
              L{lot.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <div className="bg-muted/50 rounded-lg p-3 text-center">
    <div className="flex justify-center mb-1 text-muted-foreground">{icon}</div>
    <p className="text-lg font-bold text-foreground">{value}</p>
    <p className="text-[10px] text-muted-foreground">{label}</p>
  </div>
);

const AreaBar = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => (
  <div className="space-y-0.5">
    <div className="flex justify-between text-[10px]">
      <span>{label}</span>
      <span>{Math.round(value).toLocaleString('es-CL')} m² ({((value / total) * 100).toFixed(1)}%)</span>
    </div>
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / total) * 100}%` }} />
    </div>
  </div>
);
