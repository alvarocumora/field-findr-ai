import { normalizePolygon } from '@/lib/polygonUtils';
import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle, GripVertical, Layers, RotateCw, ZoomIn,
  Move, Eye, EyeOff, ArrowLeftRight
} from 'lucide-react';

interface Lot {
  id: string;
  lot_number: string;
  area: number;
  price: number | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
  polygon: unknown;
}

interface PlanImage {
  label: string;
  url: string;
}

interface PlanCompareViewProps {
  lots: Lot[];
  projectCenter: { lat: number; lng: number };
  planImages: PlanImage[];
}

interface OverlaySettings {
  opacity: number;
  rotation: number;
  scale: number;
  offsetLng: number;
  offsetLat: number;
}

const generateLotGeoJSON = (lots: Lot[]) => {
  const features: GeoJSON.Feature[] = lots
    .filter(lot => lot.polygon && Array.isArray(lot.polygon) && normalizePolygon(lot.polygon).coords.length >= 3)
    .map(lot => {
      const coords = [...normalizePolygon(lot.polygon).coords];
      if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
        coords.push(coords[0]);
      }
      return {
        type: 'Feature' as const,
        id: lot.id,
        properties: {
          id: lot.id,
          lot_number: lot.lot_number,
          area: lot.area,
          status: lot.status || 'available',
        },
        geometry: { type: 'Polygon' as const, coordinates: [coords] },
      };
    });
  return { type: 'FeatureCollection' as const, features };
};

export const PlanCompareView = ({ lots, projectCenter, planImages }: PlanCompareViewProps) => {
  const { token, loading: tokenLoading, error: tokenError } = useMapboxToken();

  const containerRef = useRef<HTMLDivElement>(null);
  const leftMapContainer = useRef<HTMLDivElement>(null);
  const rightMapContainer = useRef<HTMLDivElement>(null);
  const leftMap = useRef<mapboxgl.Map | null>(null);
  const rightMap = useRef<mapboxgl.Map | null>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [mapsReady, setMapsReady] = useState({ left: false, right: false });
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [showPolygonsOnRight, setShowPolygonsOnRight] = useState(true);
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>({
    opacity: 0.75, rotation: 0, scale: 1, offsetLng: 0, offsetLat: 0,
  });

  const syncing = useRef(false);

  const currentPlan = planImages[selectedPlanIndex];
  const baseSpan = 0.015;

  // Calculate bounds from lots
  const calculateBounds = useCallback(() => {
    const lotsWithPolygons = lots.filter(l => normalizePolygon(l.polygon).coords.length >= 3);
    if (lotsWithPolygons.length === 0) return null;
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    lotsWithPolygons.forEach(lot => {
      normalizePolygon(lot.polygon).coords.forEach(([lng, lat]: [number, number]) => {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      });
    });
    return new mapboxgl.LngLatBounds([minLng, minLat], [maxLng, maxLat]);
  }, [lots]);

  // Sync viewports
  const syncMap = useCallback((source: mapboxgl.Map, target: mapboxgl.Map) => {
    if (syncing.current) return;
    syncing.current = true;
    target.jumpTo({
      center: source.getCenter(),
      zoom: source.getZoom(),
      bearing: source.getBearing(),
      pitch: source.getPitch(),
    });
    syncing.current = false;
  }, []);

  // Add polygon layers to a map
  const addPolygonLayers = useCallback((mapInstance: mapboxgl.Map, sourceId: string) => {
    const geojson = generateLotGeoJSON(lots);
    mapInstance.addSource(sourceId, { type: 'geojson', data: geojson });
    mapInstance.addLayer({
      id: `${sourceId}-fill`,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': [
          'case',
          ['==', ['get', 'status'], 'sold'], '#6b7280',
          ['==', ['get', 'status'], 'reserved'], '#f59e0b',
          '#10b981'
        ],
        'fill-opacity': 0.6,
      },
    });
    mapInstance.addLayer({
      id: `${sourceId}-outline`,
      type: 'line',
      source: sourceId,
      paint: { 'line-color': '#ffffff', 'line-width': 2 },
    });
    mapInstance.addLayer({
      id: `${sourceId}-labels`,
      type: 'symbol',
      source: sourceId,
      layout: {
        'text-field': ['concat', 'Lote ', ['get', 'lot_number']],
        'text-size': 13,
        'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      },
      paint: { 'text-color': '#ffffff', 'text-halo-color': '#000000', 'text-halo-width': 1 },
    });
  }, [lots]);

  // Add plan overlay to right map
  const addPlanOverlay = useCallback((mapInstance: mapboxgl.Map) => {
    if (!currentPlan) return;

    const sourceId = 'plan-overlay';
    const layerId = 'plan-layer';
    const cLng = projectCenter.lng + overlaySettings.offsetLng;
    const cLat = projectCenter.lat + overlaySettings.offsetLat;
    const width = baseSpan * overlaySettings.scale;
    const height = baseSpan * 0.75 * overlaySettings.scale;

    const coords: [[number, number], [number, number], [number, number], [number, number]] = [
      [cLng - width / 2, cLat + height / 2],
      [cLng + width / 2, cLat + height / 2],
      [cLng + width / 2, cLat - height / 2],
      [cLng - width / 2, cLat - height / 2],
    ];

    const rotatePoint = (point: [number, number], angle: number): [number, number] => {
      const rad = (angle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = point[0] - cLng;
      const dy = point[1] - cLat;
      return [cLng + dx * cos - dy * sin, cLat + dx * sin + dy * cos];
    };

    const rotatedCoords = coords.map(c => rotatePoint(c, overlaySettings.rotation)) as [
      [number, number], [number, number], [number, number], [number, number]
    ];

    try {
      if (mapInstance.getLayer(layerId)) mapInstance.removeLayer(layerId);
      if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId);
    } catch { /* ignore */ }

    mapInstance.addSource(sourceId, {
      type: 'image',
      url: currentPlan.url,
      coordinates: rotatedCoords,
    });

    // Insert overlay below polygons if they exist
    const insertBefore = mapInstance.getLayer('right-lots-fill') ? 'right-lots-fill' : undefined;
    mapInstance.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: { 'raster-opacity': overlaySettings.opacity, 'raster-fade-duration': 0 },
    }, insertBefore);
  }, [currentPlan, projectCenter, overlaySettings, baseSpan]);

  // Initialize both maps
  useEffect(() => {
    if (!token || !leftMapContainer.current || !rightMapContainer.current) return;
    if (leftMap.current || rightMap.current) return;

    mapboxgl.accessToken = token;
    const bounds = calculateBounds();
    const initCenter = bounds ? bounds.getCenter() : new mapboxgl.LngLat(projectCenter.lng, projectCenter.lat);

    // Left map: satellite with polygons only
    leftMap.current = new mapboxgl.Map({
      container: leftMapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: initCenter,
      zoom: 15,
      pitch: 0,
      attributionControl: false,
    });

    // Right map: satellite with plan overlay
    rightMap.current = new mapboxgl.Map({
      container: rightMapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: initCenter,
      zoom: 15,
      pitch: 0,
      attributionControl: false,
    });

    rightMap.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Sync events
    const syncEvents = ['move', 'zoom', 'rotate', 'pitch'];

    leftMap.current.on('load', () => {
      if (!leftMap.current) return;
      addPolygonLayers(leftMap.current, 'left-lots');
      if (bounds) leftMap.current.fitBounds(bounds, { padding: 40 });
      setMapsReady(prev => ({ ...prev, left: true }));

      syncEvents.forEach(event => {
        leftMap.current!.on(event, () => {
          if (rightMap.current) syncMap(leftMap.current!, rightMap.current);
        });
      });
    });

    rightMap.current.on('load', () => {
      if (!rightMap.current) return;
      if (showPolygonsOnRight) addPolygonLayers(rightMap.current, 'right-lots');
      addPlanOverlay(rightMap.current);
      if (bounds) rightMap.current.fitBounds(bounds, { padding: 40 });
      setMapsReady(prev => ({ ...prev, right: true }));

      syncEvents.forEach(event => {
        rightMap.current!.on(event, () => {
          if (leftMap.current) syncMap(rightMap.current!, leftMap.current);
        });
      });
    });

    return () => {
      leftMap.current?.remove();
      rightMap.current?.remove();
      leftMap.current = null;
      rightMap.current = null;
      setMapsReady({ left: false, right: false });
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update plan overlay when settings change
  useEffect(() => {
    if (!rightMap.current || !mapsReady.right) return;
    try {
      addPlanOverlay(rightMap.current);
    } catch { /* map might not be ready */ }
  }, [overlaySettings, selectedPlanIndex, addPlanOverlay, mapsReady.right]);

  // Toggle polygon visibility on right map
  useEffect(() => {
    if (!rightMap.current || !mapsReady.right) return;
    const layers = ['right-lots-fill', 'right-lots-outline', 'right-lots-labels'];
    try {
      if (showPolygonsOnRight) {
        if (!rightMap.current.getSource('right-lots')) {
          addPolygonLayers(rightMap.current, 'right-lots');
        }
        layers.forEach(l => {
          if (rightMap.current!.getLayer(l)) {
            rightMap.current!.setLayoutProperty(l, 'visibility', 'visible');
          }
        });
      } else {
        layers.forEach(l => {
          if (rightMap.current!.getLayer(l)) {
            rightMap.current!.setLayoutProperty(l, 'visibility', 'none');
          }
        });
      }
    } catch { /* ignore */ }
  }, [showPolygonsOnRight, mapsReady.right, addPolygonLayers]);

  // Dragging the divider
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(10, Math.min(90, (x / rect.width) * 100));
    setSplitPosition(pct);
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    // Resize both maps after drag
    setTimeout(() => {
      leftMap.current?.resize();
      rightMap.current?.resize();
    }, 0);
  }, []);

  // Keyboard shortcuts for overlay adjustment
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 0.001 : 0.0002;
      const rotStep = e.shiftKey ? 5 : 1;
      const scaleStep = e.shiftKey ? 0.1 : 0.02;
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); setOverlaySettings(s => ({ ...s, offsetLat: s.offsetLat + step })); break;
        case 'ArrowDown': e.preventDefault(); setOverlaySettings(s => ({ ...s, offsetLat: s.offsetLat - step })); break;
        case 'ArrowLeft': e.preventDefault(); setOverlaySettings(s => ({ ...s, offsetLng: s.offsetLng - step })); break;
        case 'ArrowRight': e.preventDefault(); setOverlaySettings(s => ({ ...s, offsetLng: s.offsetLng + step })); break;
        case 'r': case 'R': setOverlaySettings(s => ({ ...s, rotation: s.rotation + rotStep })); break;
        case 'e': case 'E': setOverlaySettings(s => ({ ...s, rotation: s.rotation - rotStep })); break;
        case '+': case '=': setOverlaySettings(s => ({ ...s, scale: Math.min(3, s.scale + scaleStep) })); break;
        case '-': case '_': setOverlaySettings(s => ({ ...s, scale: Math.max(0.2, s.scale - scaleStep) })); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (tokenLoading) return <Skeleton className="w-full h-[600px] rounded-xl" />;

  if (tokenError) {
    return (
      <div className="w-full h-[600px] rounded-xl bg-muted flex items-center justify-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg">
        {/* Plan selector */}
        {planImages.length > 1 && (
          <Select value={String(selectedPlanIndex)} onValueChange={v => setSelectedPlanIndex(Number(v))}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {planImages.map((img, idx) => (
                <SelectItem key={idx} value={String(idx)}>{img.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Overlay controls */}
        <div className="flex items-center gap-2">
          <Label className="text-xs">Opacidad:</Label>
          <Slider value={[overlaySettings.opacity]} min={0} max={1} step={0.05}
            onValueChange={([v]) => setOverlaySettings(s => ({ ...s, opacity: v }))}
            className="w-24" />
          <span className="text-xs text-muted-foreground w-8">{Math.round(overlaySettings.opacity * 100)}%</span>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs flex items-center gap-1">
            <RotateCw className="h-3 w-3" />
          </Label>
          <Slider value={[overlaySettings.rotation]} min={-180} max={180} step={0.5}
            onValueChange={([v]) => setOverlaySettings(s => ({ ...s, rotation: v }))}
            className="w-20" />
          <span className="text-xs text-muted-foreground w-10">{overlaySettings.rotation.toFixed(1)}°</span>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs flex items-center gap-1">
            <ZoomIn className="h-3 w-3" />
          </Label>
          <Slider value={[overlaySettings.scale]} min={0.2} max={3} step={0.02}
            onValueChange={([v]) => setOverlaySettings(s => ({ ...s, scale: v }))}
            className="w-20" />
          <span className="text-xs text-muted-foreground w-10">{overlaySettings.scale.toFixed(2)}x</span>
        </div>

        <Button
          variant={showPolygonsOnRight ? 'default' : 'outline'}
          size="sm"
          className="gap-1 text-xs h-7"
          onClick={() => setShowPolygonsOnRight(!showPolygonsOnRight)}
        >
          {showPolygonsOnRight ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          Polígonos
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1 text-xs h-7"
          onClick={() => setOverlaySettings({ opacity: 0.75, rotation: 0, scale: 1, offsetLng: 0, offsetLat: 0 })}
        >
          Resetear
        </Button>
      </div>

      {/* Split-view comparison */}
      <div
        ref={containerRef}
        className="relative w-full h-[600px] rounded-xl overflow-hidden select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Left map: polygons only */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
        >
          <div ref={leftMapContainer} className="w-full h-full" />
        </div>

        {/* Right map: plan overlay */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 0 0 ${splitPosition}%)` }}
        >
          <div ref={rightMapContainer} className="w-full h-full" />
        </div>

        {/* Draggable divider */}
        <div
          ref={dividerRef}
          className="absolute top-0 bottom-0 z-20 flex items-center justify-center cursor-col-resize"
          style={{ left: `${splitPosition}%`, transform: 'translateX(-50%)' }}
          onPointerDown={handlePointerDown}
        >
          <div className="w-1 h-full bg-white/80 shadow-lg" />
          <div className="absolute flex items-center justify-center w-10 h-10 rounded-full bg-background/90 border-2 border-primary shadow-lg">
            <ArrowLeftRight className="h-4 w-4 text-primary" />
          </div>
        </div>

        {/* Labels */}
        <Badge className="absolute top-3 left-3 z-10 bg-background/80 text-foreground border">
          <Layers className="h-3 w-3 mr-1" />
          Polígonos KMZ
        </Badge>
        <Badge className="absolute top-3 right-14 z-10 bg-background/80 text-foreground border">
          <Move className="h-3 w-3 mr-1" />
          Plano Oficial
        </Badge>

        {/* Position info */}
        <div className="absolute bottom-3 left-3 z-10 px-2 py-1 rounded bg-background/70 text-xs text-muted-foreground">
          Offset: Lng {overlaySettings.offsetLng.toFixed(4)}, Lat {overlaySettings.offsetLat.toFixed(4)}
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-xs text-muted-foreground text-center">
        ↑↓←→ mover plano · R/E rotar · +/- escala · Shift = paso grande · Arrastra el divisor para comparar
      </p>
    </div>
  );
};
