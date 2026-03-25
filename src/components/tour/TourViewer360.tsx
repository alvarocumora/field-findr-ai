import { useState, useCallback, useRef, useEffect } from 'react';
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import '@photo-sphere-viewer/markers-plugin/index.css';
import '@photo-sphere-viewer/core/index.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Maximize2, RotateCcw } from 'lucide-react';
import type { TourScene, TourHotspot, PolygonOverlay } from '@/hooks/useTourScenes';

interface TourViewer360Props {
  scenes: TourScene[];
  initialSceneIndex?: number;
  onLotClick?: (lotId: string) => void;
}

export function TourViewer360({ scenes, initialSceneIndex = 0, onLotClick }: TourViewer360Props) {
  const [currentIndex, setCurrentIndex] = useState(initialSceneIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  const currentScene = scenes[currentIndex];
  if (!currentScene) return null;

  const navigateToScene = useCallback((sceneId: string) => {
    const idx = scenes.findIndex(s => s.id === sceneId);
    if (idx >= 0) setCurrentIndex(idx);
  }, [scenes]);

  const handleReady = useCallback((instance: any) => {
    viewerRef.current = instance;
    try {
      const markersPlugin = instance.getPlugin(MarkersPlugin);
      if (!markersPlugin) return;

      // Clear existing markers
      markersPlugin.clearMarkers();

      // Add hotspot markers
      currentScene.hotspots.forEach((hs: TourHotspot) => {
        markersPlugin.addMarker({
          id: `hotspot-${hs.id}`,
          position: { yaw: hs.yaw, pitch: hs.pitch },
          html: `<div class="tour-hotspot" title="${hs.tooltip || 'Ir'}">
            <div class="tour-hotspot-pulse"></div>
            <div class="tour-hotspot-dot"></div>
          </div>`,
          anchor: 'center center',
          data: { type: 'hotspot', targetId: hs.target_scene_id },
          tooltip: hs.tooltip || 'Navegar',
        });
      });

      // Add polygon overlay markers
      currentScene.polygon_overlays.forEach((poly: PolygonOverlay) => {
        if (poly.points.length < 3) return;
        markersPlugin.addMarker({
          id: `poly-${poly.id}`,
          polygon: poly.points.map(p => [p.yaw, p.pitch]) as [number, number][],
          svgStyle: {
            fill: poly.color || 'rgba(5, 150, 105, 0.3)',
            stroke: poly.color || 'rgba(5, 150, 105, 0.9)',
            strokeWidth: '2px',
          },
          tooltip: poly.name,
          data: { type: 'polygon', lotId: poly.lot_id },
        });
      });

      // Handle marker clicks
      markersPlugin.addEventListener('select-marker', (e: any) => {
        const marker = e.marker;
        if (marker.data?.type === 'hotspot' && marker.data.targetId) {
          navigateToScene(marker.data.targetId);
        } else if (marker.data?.type === 'polygon' && marker.data.lotId) {
          onLotClick?.(marker.data.lotId);
        }
      });
    } catch (err) {
      console.warn('Markers plugin not available:', err);
    }
  }, [currentScene, navigateToScene, onLotClick]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const plugins: any[] = [
    [MarkersPlugin, { markers: [] }],
  ];

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden shadow-xl bg-black"
      style={{ height: isFullscreen ? '100vh' : '600px' }}
    >
      <ReactPhotoSphereViewer
        key={currentScene.id}
        src={currentScene.panorama_url}
        width="100%"
        height="100%"
        defaultYaw={currentScene.yaw_default || 0}
        defaultPitch={currentScene.pitch_default || 0}
        plugins={plugins}
        navbar={['zoom', 'move', 'caption', 'fullscreen']}
        onReady={handleReady}
        littlePlanet={false}
      />

      {/* Scene info overlay */}
      <div className="absolute top-4 left-4 z-10">
        <Badge className="bg-black/60 text-white backdrop-blur-md border-0 text-sm px-3 py-1.5">
          {currentScene.name}
        </Badge>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-md h-9 w-9"
          onClick={toggleFullscreen}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Scene navigation arrows */}
      {scenes.length > 1 && (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 backdrop-blur-md h-10 w-10"
            onClick={() => setCurrentIndex(i => (i - 1 + scenes.length) % scenes.length)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 backdrop-blur-md h-10 w-10"
            onClick={() => setCurrentIndex(i => (i + 1) % scenes.length)}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Scene thumbnails bar */}
      {scenes.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-black/60 backdrop-blur-md rounded-xl p-2 max-w-[80%] overflow-x-auto">
          {scenes.map((scene, idx) => (
            <button
              key={scene.id}
              onClick={() => setCurrentIndex(idx)}
              className={`shrink-0 w-16 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              {scene.thumbnail_url ? (
                <img src={scene.thumbnail_url} alt={scene.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] text-white">
                  {idx + 1}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
