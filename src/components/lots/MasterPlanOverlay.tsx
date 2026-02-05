import { useState, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Image, RotateCw, Move, ZoomIn, X } from 'lucide-react';

interface MasterPlanOverlayProps {
  map: mapboxgl.Map | null;
  imageUrl: string;
  isVisible: boolean;
  onClose: () => void;
}

interface OverlaySettings {
  opacity: number;
  rotation: number;
  scale: number;
  offsetLng: number;
  offsetLat: number;
}

export const MasterPlanOverlay = ({ map, imageUrl, isVisible, onClose }: MasterPlanOverlayProps) => {
  const [settings, setSettings] = useState<OverlaySettings>({
    opacity: 0.7,
    rotation: 0,
    scale: 1,
    offsetLng: 0,
    offsetLat: 0,
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Base coordinates for the overlay (approximate location of the project)
  const baseCoords = {
    north: -34.975,
    south: -35.005,
    east: -71.625,
    west: -71.655,
  };

  const updateOverlay = useCallback(() => {
    if (!map || !map.isStyleLoaded()) return;

    const sourceId = 'masterplan-overlay';
    const layerId = 'masterplan-layer';

    // Calculate adjusted coordinates based on settings
    const width = (baseCoords.east - baseCoords.west) * settings.scale;
    const height = (baseCoords.north - baseCoords.south) * settings.scale;
    const centerLng = (baseCoords.east + baseCoords.west) / 2 + settings.offsetLng;
    const centerLat = (baseCoords.north + baseCoords.south) / 2 + settings.offsetLat;

    const coords: [[number, number], [number, number], [number, number], [number, number]] = [
      [centerLng - width / 2, centerLat + height / 2], // top-left
      [centerLng + width / 2, centerLat + height / 2], // top-right
      [centerLng + width / 2, centerLat - height / 2], // bottom-right
      [centerLng - width / 2, centerLat - height / 2], // bottom-left
    ];

    // Apply rotation around center
    const rotatePoint = (point: [number, number], angle: number): [number, number] => {
      const rad = (angle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const dx = point[0] - centerLng;
      const dy = point[1] - centerLat;
      return [
        centerLng + dx * cos - dy * sin,
        centerLat + dx * sin + dy * cos,
      ];
    };

    const rotatedCoords = coords.map(c => rotatePoint(c, settings.rotation)) as [
      [number, number],
      [number, number],
      [number, number],
      [number, number]
    ];

    if (map.getSource(sourceId)) {
      // Update existing source
      const source = map.getSource(sourceId) as mapboxgl.ImageSource;
      source.updateImage({ 
        url: imageUrl,
        coordinates: rotatedCoords
      });
    } else {
      // Add new source and layer
      map.addSource(sourceId, {
        type: 'image',
        url: imageUrl,
        coordinates: rotatedCoords,
      });

      // Add below lot polygons but above satellite
      const insertBefore = map.getLayer('lots-fill') ? 'lots-fill' : undefined;
      
      map.addLayer({
        id: layerId,
        type: 'raster',
        source: sourceId,
        paint: {
          'raster-opacity': settings.opacity,
          'raster-fade-duration': 0,
        },
      }, insertBefore);
    }

    // Update opacity
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'raster-opacity', settings.opacity);
    }
  }, [map, imageUrl, settings]);

  // Add/update overlay when settings change
  useEffect(() => {
    if (isVisible) {
      updateOverlay();
    }
  }, [isVisible, updateOverlay]);

  // Remove overlay when hidden
  useEffect(() => {
    if (!isVisible && map) {
      if (map.getLayer('masterplan-layer')) {
        map.removeLayer('masterplan-layer');
      }
      if (map.getSource('masterplan-overlay')) {
        map.removeSource('masterplan-overlay');
      }
    }
  }, [isVisible, map]);

  // Handle keyboard adjustments
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 0.001 : 0.0002;
      const rotStep = e.shiftKey ? 5 : 1;
      const scaleStep = e.shiftKey ? 0.1 : 0.02;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSettings(s => ({ ...s, offsetLat: s.offsetLat + step }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSettings(s => ({ ...s, offsetLat: s.offsetLat - step }));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setSettings(s => ({ ...s, offsetLng: s.offsetLng - step }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setSettings(s => ({ ...s, offsetLng: s.offsetLng + step }));
          break;
        case 'r':
        case 'R':
          setSettings(s => ({ ...s, rotation: s.rotation + rotStep }));
          break;
        case 'e':
        case 'E':
          setSettings(s => ({ ...s, rotation: s.rotation - rotStep }));
          break;
        case '+':
        case '=':
          setSettings(s => ({ ...s, scale: Math.min(3, s.scale + scaleStep) }));
          break;
        case '-':
        case '_':
          setSettings(s => ({ ...s, scale: Math.max(0.2, s.scale - scaleStep) }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="absolute top-3 right-16 p-4 glass rounded-lg w-64 space-y-4 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Image className="h-4 w-4" />
          Superposición Master Plan
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {/* Opacity */}
        <div className="space-y-1">
          <Label className="text-xs">Opacidad: {Math.round(settings.opacity * 100)}%</Label>
          <Slider
            value={[settings.opacity]}
            min={0}
            max={1}
            step={0.05}
            onValueChange={([v]) => setSettings(s => ({ ...s, opacity: v }))}
          />
        </div>

        {/* Rotation */}
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <RotateCw className="h-3 w-3" />
            Rotación: {settings.rotation.toFixed(1)}°
          </Label>
          <Slider
            value={[settings.rotation]}
            min={-180}
            max={180}
            step={0.5}
            onValueChange={([v]) => setSettings(s => ({ ...s, rotation: v }))}
          />
        </div>

        {/* Scale */}
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <ZoomIn className="h-3 w-3" />
            Escala: {settings.scale.toFixed(2)}x
          </Label>
          <Slider
            value={[settings.scale]}
            min={0.2}
            max={3}
            step={0.02}
            onValueChange={([v]) => setSettings(s => ({ ...s, scale: v }))}
          />
        </div>

        {/* Position offset */}
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <Move className="h-3 w-3" />
            Posición
          </Label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Lng:</span> {settings.offsetLng.toFixed(4)}
            </div>
            <div>
              <span className="text-muted-foreground">Lat:</span> {settings.offsetLat.toFixed(4)}
            </div>
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

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setSettings({
          opacity: 0.7,
          rotation: 0,
          scale: 1,
          offsetLng: 0,
          offsetLat: 0,
        })}
      >
        Resetear posición
      </Button>
    </div>
  );
};
