import { useState, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image, RotateCw, Move, ZoomIn, X } from 'lucide-react';

interface PlanImage {
  label: string;
  url: string;
}

interface MasterPlanOverlayProps {
  map: mapboxgl.Map | null;
  /** @deprecated Use `images` instead */
  imageUrl?: string | null;
  images?: PlanImage[];
  isVisible: boolean;
  onClose: () => void;
  /** Optional initial bounds for the overlay based on project location */
  projectCenter?: { lat: number; lng: number };
}

interface OverlaySettings {
  opacity: number;
  rotation: number;
  scale: number;
  offsetLng: number;
  offsetLat: number;
}

export const MasterPlanOverlay = ({ map, imageUrl, images, isVisible, onClose, projectCenter }: MasterPlanOverlayProps) => {
  // Build image list from props
  const imageList: PlanImage[] = images && images.length > 0
    ? images
    : imageUrl ? [{ label: 'Master Plan', url: imageUrl }] : [];

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [settings, setSettings] = useState<OverlaySettings>({
    opacity: 0.7,
    rotation: 0,
    scale: 1,
    offsetLng: 0,
    offsetLat: 0,
  });

  const currentImage = imageList[selectedImageIndex]?.url;

  // Base coordinates for the overlay centered on the project
  const centerLat = projectCenter?.lat ?? -34.99;
  const centerLng = projectCenter?.lng ?? -71.64;
  const baseSpan = 0.015; // ~1.5km spread

  const updateOverlay = useCallback(() => {
    if (!map || !map.isStyleLoaded() || !currentImage) return;

    const sourceId = 'masterplan-overlay';
    const layerId = 'masterplan-layer';

    const width = baseSpan * settings.scale;
    const height = baseSpan * 0.75 * settings.scale; // aspect ratio ~4:3
    const cLng = centerLng + settings.offsetLng;
    const cLat = centerLat + settings.offsetLat;

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

    const rotatedCoords = coords.map(c => rotatePoint(c, settings.rotation)) as [
      [number, number], [number, number], [number, number], [number, number]
    ];

    if (map.getSource(sourceId)) {
      const source = map.getSource(sourceId) as mapboxgl.ImageSource;
      source.updateImage({ url: currentImage, coordinates: rotatedCoords });
    } else {
      map.addSource(sourceId, {
        type: 'image',
        url: currentImage,
        coordinates: rotatedCoords,
      });

      const insertBefore = map.getLayer('lots-fill') ? 'lots-fill' : undefined;
      map.addLayer({
        id: layerId,
        type: 'raster',
        source: sourceId,
        paint: { 'raster-opacity': settings.opacity, 'raster-fade-duration': 0 },
      }, insertBefore);
    }

    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'raster-opacity', settings.opacity);
    }
  }, [map, currentImage, settings, centerLat, centerLng, baseSpan]);

  useEffect(() => {
    if (isVisible) updateOverlay();
  }, [isVisible, updateOverlay]);

  // Remove overlay when hidden
  useEffect(() => {
    if (!isVisible && map) {
      try {
        if (map.isStyleLoaded()) {
          if (map.getLayer('masterplan-layer')) map.removeLayer('masterplan-layer');
          if (map.getSource('masterplan-overlay')) map.removeSource('masterplan-overlay');
        }
      } catch (error) {
        console.warn('Error removing masterplan overlay:', error);
      }
    }
  }, [isVisible, map]);

  // When image changes, remove old source so it gets re-added with new URL
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;
    try {
      if (map.getLayer('masterplan-layer')) map.removeLayer('masterplan-layer');
      if (map.getSource('masterplan-overlay')) map.removeSource('masterplan-overlay');
    } catch { /* ignore */ }
    if (isVisible) updateOverlay();
  }, [selectedImageIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 0.001 : 0.0002;
      const rotStep = e.shiftKey ? 5 : 1;
      const scaleStep = e.shiftKey ? 0.1 : 0.02;
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); setSettings(s => ({ ...s, offsetLat: s.offsetLat + step })); break;
        case 'ArrowDown': e.preventDefault(); setSettings(s => ({ ...s, offsetLat: s.offsetLat - step })); break;
        case 'ArrowLeft': e.preventDefault(); setSettings(s => ({ ...s, offsetLng: s.offsetLng - step })); break;
        case 'ArrowRight': e.preventDefault(); setSettings(s => ({ ...s, offsetLng: s.offsetLng + step })); break;
        case 'r': case 'R': setSettings(s => ({ ...s, rotation: s.rotation + rotStep })); break;
        case 'e': case 'E': setSettings(s => ({ ...s, rotation: s.rotation - rotStep })); break;
        case '+': case '=': setSettings(s => ({ ...s, scale: Math.min(3, s.scale + scaleStep) })); break;
        case '-': case '_': setSettings(s => ({ ...s, scale: Math.max(0.2, s.scale - scaleStep) })); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  if (!isVisible || imageList.length === 0) return null;

  return (
    <div className="absolute top-3 right-16 p-4 glass rounded-lg w-64 space-y-4 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Image className="h-4 w-4" />
          Superposición Plano
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Image selector */}
      {imageList.length > 1 && (
        <Select
          value={String(selectedImageIndex)}
          onValueChange={(v) => setSelectedImageIndex(Number(v))}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {imageList.map((img, idx) => (
              <SelectItem key={idx} value={String(idx)}>
                {img.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Opacidad: {Math.round(settings.opacity * 100)}%</Label>
          <Slider value={[settings.opacity]} min={0} max={1} step={0.05}
            onValueChange={([v]) => setSettings(s => ({ ...s, opacity: v }))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <RotateCw className="h-3 w-3" /> Rotación: {settings.rotation.toFixed(1)}°
          </Label>
          <Slider value={[settings.rotation]} min={-180} max={180} step={0.5}
            onValueChange={([v]) => setSettings(s => ({ ...s, rotation: v }))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <ZoomIn className="h-3 w-3" /> Escala: {settings.scale.toFixed(2)}x
          </Label>
          <Slider value={[settings.scale]} min={0.2} max={3} step={0.02}
            onValueChange={([v]) => setSettings(s => ({ ...s, scale: v }))} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <Move className="h-3 w-3" /> Posición
          </Label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-muted-foreground">Lng:</span> {settings.offsetLng.toFixed(4)}</div>
            <div><span className="text-muted-foreground">Lat:</span> {settings.offsetLat.toFixed(4)}</div>
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground border-t pt-2">
        <p className="font-medium mb-1">Atajos de teclado:</p>
        <ul className="space-y-0.5">
          <li>↑↓←→ Mover imagen</li>
          <li>R/E Rotar ±1°</li>
          <li>+/- Escala</li>
          <li>Shift + tecla = paso grande</li>
        </ul>
      </div>

      <Button variant="outline" size="sm" className="w-full"
        onClick={() => setSettings({ opacity: 0.7, rotation: 0, scale: 1, offsetLng: 0, offsetLat: 0 })}>
        Resetear posición
      </Button>
    </div>
  );
};
