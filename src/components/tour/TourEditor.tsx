import { useState, useCallback, useRef } from 'react';
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import '@photo-sphere-viewer/markers-plugin/index.css';
import '@photo-sphere-viewer/core/index.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crosshair, MapPin, Hexagon, Save, Trash2, Undo } from 'lucide-react';
import { useTourScenes, type TourScene, type TourHotspot, type PolygonOverlay } from '@/hooks/useTourScenes';
import { toast } from 'sonner';

interface TourEditorProps {
  scene: TourScene;
  allScenes: TourScene[];
  lots: any[];
  projectId: string;
}

type EditorMode = 'view' | 'hotspot' | 'polygon';

export function TourEditor({ scene, allScenes, lots, projectId }: TourEditorProps) {
  const { updateScene } = useTourScenes(projectId);
  const [mode, setMode] = useState<EditorMode>('view');
  const [hotspots, setHotspots] = useState<TourHotspot[]>(scene.hotspots);
  const [polygons, setPolygons] = useState<PolygonOverlay[]>(scene.polygon_overlays);
  const [currentPolygonPoints, setCurrentPolygonPoints] = useState<{ yaw: number; pitch: number }[]>([]);
  const [selectedTargetScene, setSelectedTargetScene] = useState<string>('');
  const [selectedLotId, setSelectedLotId] = useState<string>('');
  const [hotspotTooltip, setHotspotTooltip] = useState('');
  const viewerRef = useRef<any>(null);
  const markersRef = useRef<any>(null);
  const [dirty, setDirty] = useState(false);

  const otherScenes = allScenes.filter(s => s.id !== scene.id);

  const handleReady = useCallback((instance: any) => {
    viewerRef.current = instance;
    try {
      const mp = instance.getPlugin(MarkersPlugin);
      markersRef.current = mp;
      refreshMarkers(mp);
    } catch (err) {
      console.warn('Markers plugin error:', err);
    }
  }, [hotspots, polygons]);

  const refreshMarkers = (mp: any) => {
    if (!mp) return;
    mp.clearMarkers();

    hotspots.forEach((hs) => {
      mp.addMarker({
        id: `hs-${hs.id}`,
        position: { yaw: hs.yaw, pitch: hs.pitch },
        html: `<div style="width:20px;height:20px;border-radius:50%;background:rgba(59,130,246,0.8);border:3px solid white;cursor:pointer;" title="${hs.tooltip}"></div>`,
        anchor: 'center center',
        tooltip: hs.tooltip || 'Hotspot',
      });
    });

    polygons.forEach((poly) => {
      if (poly.points.length >= 3) {
        mp.addMarker({
          id: `poly-${poly.id}`,
          polygon: poly.points.map(p => [p.yaw, p.pitch]) as [number, number][],
          svgStyle: {
            fill: poly.color || 'rgba(5,150,105,0.3)',
            stroke: poly.color || 'rgba(5,150,105,0.9)',
            strokeWidth: '2px',
          },
          tooltip: poly.name,
        });
      }
    });

    // Show current polygon being drawn
    if (currentPolygonPoints.length >= 2) {
      mp.addMarker({
        id: 'drawing-polygon',
        polyline: currentPolygonPoints.map(p => [p.yaw, p.pitch]) as [number, number][],
        svgStyle: {
          stroke: 'rgba(234,179,8,0.9)',
          strokeWidth: '3px',
          strokeDasharray: '5 5',
          fill: 'none',
        },
      });
    }

    currentPolygonPoints.forEach((pt, i) => {
      mp.addMarker({
        id: `draw-pt-${i}`,
        position: { yaw: pt.yaw, pitch: pt.pitch },
        html: `<div style="width:10px;height:10px;border-radius:50%;background:yellow;border:2px solid #333;"></div>`,
        anchor: 'center center',
      });
    });
  };

  const handleClick = useCallback((data: any) => {
    if (mode === 'view') return;

    const yaw = data.yaw;
    const pitch = data.pitch;

    if (mode === 'hotspot') {
      if (!selectedTargetScene) {
        toast.error('Selecciona una escena destino primero');
        return;
      }
      const newHs: TourHotspot = {
        id: crypto.randomUUID(),
        yaw,
        pitch,
        target_scene_id: selectedTargetScene,
        tooltip: hotspotTooltip || 'Navegar',
      };
      const updated = [...hotspots, newHs];
      setHotspots(updated);
      setDirty(true);
      if (markersRef.current) refreshMarkers(markersRef.current);
      toast.success('Hotspot agregado');
    }

    if (mode === 'polygon') {
      const updated = [...currentPolygonPoints, { yaw, pitch }];
      setCurrentPolygonPoints(updated);
      if (markersRef.current) {
        // Re-render with updated drawing points
        try {
          markersRef.current.clearMarkers();
          refreshMarkers(markersRef.current);
        } catch {}
      }
    }
  }, [mode, selectedTargetScene, hotspotTooltip, hotspots, currentPolygonPoints]);

  // Attach click handler
  const handleViewerReady = useCallback((instance: any) => {
    handleReady(instance);
    instance.addEventListener('click', handleClick);
    return () => instance.removeEventListener('click', handleClick);
  }, [handleReady, handleClick]);

  const finishPolygon = () => {
    if (currentPolygonPoints.length < 3) {
      toast.error('Se necesitan al menos 3 puntos');
      return;
    }
    const lot = lots.find(l => l.id === selectedLotId);
    const newPoly: PolygonOverlay = {
      id: crypto.randomUUID(),
      name: lot ? `Lote ${lot.lot_number}` : `Polígono ${polygons.length + 1}`,
      lot_id: selectedLotId || undefined,
      points: currentPolygonPoints,
      color: 'rgba(5,150,105,0.5)',
      opacity: 0.5,
    };
    setPolygons(prev => [...prev, newPoly]);
    setCurrentPolygonPoints([]);
    setDirty(true);
    toast.success('Polígono creado');
  };

  const handleSave = async () => {
    try {
      await updateScene.mutateAsync({
        id: scene.id,
        updates: {
          hotspots: hotspots as any,
          polygon_overlays: polygons as any,
        },
      });
      setDirty(false);
      toast.success('Cambios guardados');
    } catch {}
  };

  const plugins: any[] = [[MarkersPlugin, { markers: [] }]];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <Button
                size="sm"
                variant={mode === 'view' ? 'default' : 'ghost'}
                onClick={() => setMode('view')}
                className="gap-1.5 text-xs"
              >
                <Crosshair className="h-3.5 w-3.5" />
                Ver
              </Button>
              <Button
                size="sm"
                variant={mode === 'hotspot' ? 'default' : 'ghost'}
                onClick={() => setMode('hotspot')}
                className="gap-1.5 text-xs"
              >
                <MapPin className="h-3.5 w-3.5" />
                Hotspot
              </Button>
              <Button
                size="sm"
                variant={mode === 'polygon' ? 'default' : 'ghost'}
                onClick={() => setMode('polygon')}
                className="gap-1.5 text-xs"
              >
                <Hexagon className="h-3.5 w-3.5" />
                Polígono
              </Button>
            </div>

            {mode === 'hotspot' && (
              <div className="flex items-center gap-2">
                <Select value={selectedTargetScene} onValueChange={setSelectedTargetScene}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="Escena destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherScenes.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="w-32 h-8 text-xs"
                  placeholder="Tooltip"
                  value={hotspotTooltip}
                  onChange={e => setHotspotTooltip(e.target.value)}
                />
              </div>
            )}

            {mode === 'polygon' && (
              <div className="flex items-center gap-2">
                <Select value={selectedLotId} onValueChange={setSelectedLotId}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="Asociar a lote" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin lote</SelectItem>
                    {lots.map(l => (
                      <SelectItem key={l.id} value={l.id}>Lote {l.lot_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="outline" className="text-xs">
                  {currentPolygonPoints.length} puntos
                </Badge>
                <Button size="sm" variant="secondary" className="text-xs h-7" onClick={finishPolygon}>
                  Cerrar polígono
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7"
                  onClick={() => setCurrentPolygonPoints([])}
                >
                  <Undo className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="ml-auto flex gap-2">
              <Badge variant="outline" className="text-xs">
                {hotspots.length} hotspots · {polygons.length} polígonos
              </Badge>
              {dirty && (
                <Button size="sm" className="gap-1.5 text-xs" onClick={handleSave}>
                  <Save className="h-3.5 w-3.5" />
                  Guardar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Viewer */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-xl bg-black" style={{ height: '500px' }}>
        <ReactPhotoSphereViewer
          key={scene.id}
          src={scene.panorama_url}
          width="100%"
          height="100%"
          defaultYaw={scene.yaw_default || 0}
          defaultPitch={scene.pitch_default || 0}
          plugins={plugins}
          onReady={handleViewerReady}
          littlePlanet={false}
        />
        {mode !== 'view' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
            <Badge className="bg-amber-500/90 text-white border-0 animate-pulse">
              Modo edición: Click para agregar {mode === 'hotspot' ? 'hotspot' : 'punto del polígono'}
            </Badge>
          </div>
        )}
      </div>

      {/* Hotspots & Polygons List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Hotspots ({hotspots.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {hotspots.map(hs => (
              <div key={hs.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                <span>{hs.tooltip || 'Hotspot'}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive"
                  onClick={() => {
                    setHotspots(prev => prev.filter(h => h.id !== hs.id));
                    setDirty(true);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Polígonos ({polygons.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {polygons.map(p => (
              <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                <span>{p.name} ({p.points.length} pts)</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive"
                  onClick={() => {
                    setPolygons(prev => prev.filter(x => x.id !== p.id));
                    setDirty(true);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
