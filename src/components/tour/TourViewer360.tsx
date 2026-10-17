import { useState, useCallback, useRef, useEffect } from 'react';
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { CompassPlugin } from '@photo-sphere-viewer/compass-plugin';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';
import '@photo-sphere-viewer/markers-plugin/index.css';
import '@photo-sphere-viewer/compass-plugin/index.css';
import '@photo-sphere-viewer/core/index.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import type { TourScene, TourHotspot, PolygonOverlay } from '@/hooks/useTourScenes';
import { TourMinimap } from './TourMinimap';
import { tourLotLabel, tourLotState, tourPolygonCenter } from '@/lib/tourLotMarkers';

interface TourViewer360Props {
  scenes: TourScene[];
  initialSceneIndex?: number;
  onLotClick?: (lotId: string) => void;
  /** Yaw actual de la cámara (radianes) para sincronizar el mini-mapa. */
  onYawChange?: (yaw: number) => void;
  minimap?: { center: { lat: number; lng: number }; lots: any[] };
  lots?: { id: string; status: string | null }[];
  showCompass?: boolean;
}

export function TourViewer360({
  scenes,
  initialSceneIndex = 0,
  onLotClick,
  onYawChange,
  minimap,
  lots = [],
  showCompass = true,
}: TourViewer360Props) {
  const [currentIndex, setCurrentIndex] = useState(initialSceneIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentYaw, setCurrentYaw] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  const currentScene = scenes[currentIndex] || null;

  const navigateToScene = useCallback(
    (sceneId: string) => {
      const idx = scenes.findIndex((s) => s.id === sceneId);
      if (idx >= 0) setCurrentIndex(idx);
    },
    [scenes],
  );

  /** Pinta hotspots y polígonos de la escena activa. */
  const renderMarkers = useCallback(
    (instance: any, scene: TourScene) => {
      const markersPlugin = instance?.getPlugin?.(MarkersPlugin);
      if (!markersPlugin) return;
      markersPlugin.clearMarkers();

      scene.hotspots.forEach((hs: TourHotspot) => {
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

      scene.polygon_overlays.forEach((poly: PolygonOverlay) => {
        if (poly.points.length < 3) return;
        const lot = lots.find(candidate => candidate.id === poly.lot_id);
        const state = tourLotState(lot?.status);
        markersPlugin.addMarker({
          id: `poly-${poly.id}`,
          polygon: poly.points.map((p) => [p.yaw, p.pitch]) as [number, number][],
          svgStyle: {
            fill: state.key === 'available' ? 'hsl(0 0% 100% / 0.06)' : `hsl(var(--${state.token}) / 0.18)`,
            stroke: 'hsl(0 0% 100% / 0.95)',
            strokeWidth: '2px',
            strokeLinejoin: 'round',
            cursor: 'pointer',
          },
          tooltip: { content: `${poly.name} · ${state.label}`, position: 'top center' },
          data: { type: 'polygon', lotId: poly.lot_id },
        });
        const position = tourPolygonCenter(poly.points);
        if (position) markersPlugin.addMarker({
          id: `label-${poly.id}`, position, html: tourLotLabel(poly.name, lot?.status),
          anchor: 'center center', data: { type: 'polygon', lotId: poly.lot_id },
        });
      });
    },
    [lots],
  );

  const handleReady = useCallback(
    (instance: any) => {
      viewerRef.current = instance;
      try {
        if (!currentScene) return;
        renderMarkers(instance, currentScene);

        const markersPlugin = instance.getPlugin(MarkersPlugin);
        markersPlugin?.addEventListener('select-marker', (e: any) => {
          const marker = e.marker;
          if (marker.data?.type === 'hotspot' && marker.data.targetId) {
            navigateToScene(marker.data.targetId);
          } else if (marker.data?.type === 'polygon' && marker.data.lotId) {
            onLotClick?.(marker.data.lotId);
          }
        });

        // Giro suave al entrar; se detiene en cuanto el visitante interactúa.
        const autorotate = instance.getPlugin(AutorotatePlugin);
        autorotate?.start?.();

        instance.addEventListener('position-updated', (e: any) => {
          const yaw = e.position?.yaw ?? 0;
          setCurrentYaw(yaw);
          onYawChange?.(yaw);
        });
      } catch (err) {
        console.warn('Plugins del tour no disponibles:', err);
      }
    },
    [currentScene, navigateToScene, onLotClick, onYawChange, renderMarkers],
  );

  /** Cambio de escena con transición suave (sin remontar el visor). */
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !currentScene) return;
    viewer
      .setPanorama(currentScene.panorama_url, {
        transition: 1000,
        showLoader: true,
        position: {
          yaw: currentScene.yaw_default || 0,
          pitch: currentScene.pitch_default || 0,
        },
      })
      .then(() => renderMarkers(viewer, currentScene))
      .catch(() => {
        /* el visor ya muestra su propio error de carga */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScene?.id]);

  useEffect(() => {
    if (viewerRef.current && currentScene) renderMarkers(viewerRef.current, currentScene);
  }, [currentScene, renderMarkers]);

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
    ...(showCompass ? [[
      CompassPlugin,
      {
        size: '72px',
        position: 'bottom left',
        navigation: true,
        backgroundSvg:
          '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="49" fill="rgba(0,0,0,.55)" stroke="rgba(255,255,255,.35)"/></svg>',
      },
    ]] : []),
    [AutorotatePlugin, { autostartDelay: 2500, autorotateSpeed: '0.25rpm' }],
  ];

  const firstSceneUrl = scenes[0]?.panorama_url;

  if (!currentScene) return null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden shadow-xl bg-background ${
        isFullscreen ? 'h-[100svh]' : 'h-[70svh] min-h-[420px] max-h-[640px] rounded-lg'
      }`}
    >
      <ReactPhotoSphereViewer
        src={firstSceneUrl}
        width="100%"
        height="100%"
        defaultYaw={scenes[0]?.yaw_default || 0}
        defaultPitch={scenes[0]?.pitch_default || 0}
        plugins={plugins}
        navbar={['zoom', 'move', 'caption', 'fullscreen']}
        onReady={handleReady}
        littlePlanet={false}
      />

      {minimap && (
        <TourMinimap
          center={minimap.center}
          lots={minimap.lots}
          yaw={currentYaw}
          onLotClick={onLotClick}
        />
      )}

      {/* Nombre de la escena */}
      <div className="absolute top-4 left-4 z-10">
        <Badge className="bg-black/60 text-white backdrop-blur-md border-0 text-sm px-3 py-1.5">
          {currentScene.name}
        </Badge>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="bg-black/50 text-white hover:bg-black/70 backdrop-blur-md h-9 w-9"
          onClick={toggleFullscreen}
          aria-label="Pantalla completa"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {scenes.length > 1 && (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 backdrop-blur-md h-10 w-10"
            onClick={() => setCurrentIndex((i) => (i - 1 + scenes.length) % scenes.length)}
            aria-label="Escena anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white hover:bg-black/70 backdrop-blur-md h-10 w-10"
            onClick={() => setCurrentIndex((i) => (i + 1) % scenes.length)}
            aria-label="Escena siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Leyenda de estados */}
      <div className="absolute top-16 right-4 z-10 flex flex-col gap-1.5 rounded-xl bg-black/60 px-3 py-2 text-xs text-white backdrop-blur-md">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-white bg-black/30" />Disponible</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-white bg-warning" />Reservado</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-white bg-destructive" />Vendido</span>
      </div>

      {/* Miniaturas deslizables (pensadas para el celular) */}
      {scenes.length > 1 && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-black/60 backdrop-blur-md rounded-xl p-2 max-w-[70%] overflow-x-auto snap-x">
          {scenes.map((scene, idx) => (
            <Button variant="ghost"
              key={scene.id}
              onClick={() => setCurrentIndex(idx)}
              aria-label={scene.name}
              className={`shrink-0 snap-start w-20 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              {scene.thumbnail_url ? (
                <img
                  src={scene.thumbnail_url}
                  alt={scene.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] text-white">
                  {idx + 1}
                </div>
              )}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
