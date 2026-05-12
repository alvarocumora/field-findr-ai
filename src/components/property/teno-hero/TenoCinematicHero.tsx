import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { normalizePolygon } from '@/lib/polygonUtils';
import { Box, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import HeroLayoutToggle from './HeroLayoutToggle';
import { buildLayout, type LayoutType, type LayoutBuilding, type DetailLevel } from './layouts';
import { mountThreeboxOverlay, type ThreeboxHandle } from './threeboxOverlay';

/** Pick detail tier based on device + user motion preference. */
function detectDetail(): DetailLevel {
  if (typeof window === 'undefined') return 'high';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'low';
  const w = window.innerWidth;
  // Heuristic: coarse pointer (touch) + small viewport = low; tablet = med
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (coarse && w < 640) return 'low';
  if (w < 1024) return 'med';
  return 'high';
}

interface Props {
  polygon: number[][];
  title: string;
  areaM2?: number | null;
  onOpenDesigner?: () => void;
  canDesign?: boolean;
}

const FIT_LAYER_ID = 'teno-fit';
const OUTLINE_SRC = 'teno-outline-src';
const OUTLINE_LAYER = 'teno-outline-layer';
const BLDG_SRC = 'teno-bldg-src';
const BLDG_LAYER = 'teno-bldg-layer';

const TenoCinematicHero = ({ polygon, title, areaM2, onOpenDesigner, canDesign }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mode, setMode] = useState<LayoutType>('packing');
  const [mapReady, setMapReady] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const userInteractingRef = useRef(false);
  const lastInteractionRef = useRef(0);
  const { token, loading: tokenLoading } = useMapboxToken();

  const detail = useMemo<DetailLevel>(() => detectDetail(), []);
  const norm = useMemo(() => normalizePolygon(polygon), [polygon]);
  const layout = useMemo(
    () => (norm.valid ? buildLayout(mode, norm.bounds, norm.localCoords, detail) : null),
    [mode, norm, detail],
  );

  // Convert local meters to lng/lat
  const localToLngLat = useMemo(() => {
    const mPerLng = 111320 * Math.cos((norm.centroidLat * Math.PI) / 180);
    const mPerLat = 110540;
    return (x: number, y: number): [number, number] => [
      norm.centroidLng + x / mPerLng,
      norm.centroidLat + y / mPerLat,
    ];
  }, [norm]);

  // Outline GeoJSON
  const outlineGeoJSON = useMemo<GeoJSON.Feature<GeoJSON.Polygon>>(() => {
    const ring = norm.coords.map(([lng, lat]) => [lng, lat]);
    if (ring.length) ring.push(ring[0]);
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [ring] },
    };
  }, [norm]);

  // Buildings GeoJSON — one feature per building part (base + roof + ...)
  const buildingsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    if (!layout) return { type: 'FeatureCollection', features: [] };
    const features: GeoJSON.Feature[] = [];
    layout.buildings.forEach((b: LayoutBuilding, idx: number) => {
      b.parts.forEach((part, partIdx) => {
        const ring = part.coords.map(([x, y]) => localToLngLat(x, y));
        ring.push(ring[0]);
        features.push({
          type: 'Feature',
          properties: {
            id: `${b.id}-p${partIdx}`,
            color: part.color,
            base: part.base,
            height: part.height,
            order: idx,
            label: b.label ?? '',
          },
          geometry: { type: 'Polygon', coordinates: [ring] },
        });
      });
    });
    return { type: 'FeatureCollection', features };
  }, [layout, localToLngLat]);

  // Init map
  useEffect(() => {
    if (!containerRef.current || tokenLoading || !token || !norm.valid) return;
    mapboxgl.accessToken = token;

    const isLow = detail === 'low';
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [norm.centroidLng, norm.centroidLat],
      zoom: 13.5,
      pitch: 0,
      bearing: 0,
      maxPitch: 75,
      attributionControl: false,
      interactive: true,
      antialias: !isLow,        // disable AA on mobile for perf
      cooperativeGestures: false,
      dragRotate: true,
      pitchWithRotate: true,
      touchPitch: true,
      touchZoomRotate: true,
      fadeDuration: isLow ? 0 : 300,
    });
    mapRef.current = map;
    // Cursor hint that the scene is grabbable
    if (containerRef.current) containerRef.current.style.cursor = 'grab';

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    // Right-side stack: nav control sits above attribution. Avoids colliding
    // with the bottom info bar (badges + legend on the left side).
    map.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true, showCompass: true, showZoom: true }),
      'bottom-right',
    );

    // Pause cinematic oscillation while user interacts
    const markInteracting = () => {
      userInteractingRef.current = true;
      lastInteractionRef.current = performance.now();
      if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
    };
    const markIdle = () => {
      userInteractingRef.current = false;
      lastInteractionRef.current = performance.now();
      if (containerRef.current) containerRef.current.style.cursor = 'grab';
    };
    map.on('mousedown', markInteracting);
    map.on('touchstart', markInteracting);
    map.on('dragstart', markInteracting);
    map.on('zoomstart', markInteracting);
    map.on('rotatestart', markInteracting);
    map.on('mouseup', markIdle);
    map.on('touchend', markIdle);
    map.on('dragend', markIdle);
    map.on('zoomend', markIdle);
    map.on('rotateend', markIdle);

    map.on('load', () => {
      // Terrain — lighter on mobile to reduce DEM tile cost
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: isLow ? 12 : 14,
      });
      map.setTerrain({ source: 'mapbox-dem', exaggeration: isLow ? 1.0 : 1.3 });

      // Sky
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0, 60],
          'sky-atmosphere-sun-intensity': 12,
        },
      });

      // Outline source + animated dashed line
      map.addSource(OUTLINE_SRC, { type: 'geojson', data: outlineGeoJSON });
      map.addLayer({
        id: OUTLINE_LAYER,
        type: 'line',
        source: OUTLINE_SRC,
        paint: {
          'line-color': '#10b981',
          'line-width': 4,
          'line-opacity': 0.95,
          'line-blur': 0.5,
        },
      });
      // Glow layer behind
      map.addLayer({
        id: OUTLINE_LAYER + '-glow',
        type: 'line',
        source: OUTLINE_SRC,
        paint: {
          'line-color': '#10b981',
          'line-width': 14,
          'line-opacity': 0.25,
          'line-blur': 8,
        },
      }, OUTLINE_LAYER);

      // Buildings (fill-extrusion) — start with height 0 and opacity 0
      map.addSource(BLDG_SRC, { type: 'geojson', data: buildingsGeoJSON });
      map.addLayer({
        id: BLDG_LAYER,
        type: 'fill-extrusion',
        source: BLDG_SRC,
        paint: {
          'fill-extrusion-color': ['get', 'color'],
          'fill-extrusion-height': 0,
          'fill-extrusion-base': ['get', 'base'],
          'fill-extrusion-opacity': 0,
          'fill-extrusion-vertical-gradient': true,
        },
      });

      setMapReady(true);

      // Cinematic flyover
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const targetCenter: [number, number] = [norm.centroidLng, norm.centroidLat];

      if (reduceMotion) {
        map.jumpTo({ center: targetCenter, zoom: 16.2, pitch: 55, bearing: -25 });
        animateBuildings(map, buildingsGeoJSON, 0);
      } else {
        setTimeout(() => {
          map.flyTo({
            center: targetCenter,
            zoom: 16.2,
            pitch: 60,
            bearing: -25,
            duration: 4500,
            curve: 1.4,
            speed: 0.6,
            essential: true,
          });
        }, 300);

        // Buildings animate in just after flyover ends
        setTimeout(() => {
          if (mapRef.current) animateBuildings(mapRef.current, buildingsGeoJSON, 1800);
        }, 4600);

        // Subtle bearing oscillation — pauses while user interacts and
        // resumes 4s after the last interaction. Skipped on low-detail.
        if (!isLow) {
          const baseBearing = -25;
          let osc = 0;
          const IDLE_RESUME_MS = 4000;
          const oscillate = () => {
            const m = mapRef.current;
            if (!m || (m as unknown as { _removed?: boolean })._removed) return;
            const sinceUser = performance.now() - lastInteractionRef.current;
            const userActive =
              userInteractingRef.current || sinceUser < IDLE_RESUME_MS;
            if (!userActive) {
              osc += 0.005;
              m.setBearing(baseBearing + Math.sin(osc) * 4);
            }
            animFrameRef.current = requestAnimationFrame(oscillate);
          };
          setTimeout(() => { oscillate(); }, 5200);
        }
      }
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tokenLoading, norm.valid]);

  // Update outline when polygon changes (rare)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const src = map.getSource(OUTLINE_SRC) as mapboxgl.GeoJSONSource | undefined;
    src?.setData(outlineGeoJSON);
  }, [outlineGeoJSON, mapReady]);

  // Update / animate buildings on mode change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const src = map.getSource(BLDG_SRC) as mapboxgl.GeoJSONSource | undefined;
    if (!src) return;

    // Fade out, swap data, fade in
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      src.setData(buildingsGeoJSON);
      animateBuildings(map, buildingsGeoJSON, 0);
      return;
    }
    // Smooth swap: fade extrusion opacity to 0, then setData, then animate up
    map.setPaintProperty(BLDG_LAYER, 'fill-extrusion-opacity-transition', { duration: 350 } as never);
    map.setPaintProperty(BLDG_LAYER, 'fill-extrusion-opacity', 0);
    setTimeout(() => {
      src.setData(buildingsGeoJSON);
      animateBuildings(map, buildingsGeoJSON, 800);
    }, 360);
  }, [buildingsGeoJSON, mapReady]);

  if (!norm.valid) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border/50 shadow-2xl bg-slate-900 group">
      <div
        ref={containerRef}
        className="w-full h-[55vh] min-h-[380px] max-h-[640px] md:h-[60vh]"
      />

      {/* Loading overlay */}
      {(tokenLoading || !mapReady) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900">
          <Skeleton className="absolute inset-0" />
          <div className="relative z-10 flex items-center gap-2 text-white/80 text-sm">
            <Sparkles className="h-4 w-4 animate-pulse text-primary" />
            Preparando vista cinemática…
          </div>
        </div>
      )}

      {/* Top-left: layout toggle */}
      <div
        className="absolute top-3 left-3 md:top-4 md:left-4"
        style={{ zIndex: 'var(--z-map-overlay)' }}
      >
        <HeroLayoutToggle value={mode} onChange={setMode} />
      </div>

      {/* Top-right: open designer CTA */}
      {canDesign && onOpenDesigner && (
        <div
          className="absolute top-3 right-3 md:top-4 md:right-4"
          style={{ zIndex: 'var(--z-map-overlay)' }}
        >
          <Button
            size="sm"
            onClick={onOpenDesigner}
            className="gap-2 shadow-xl bg-primary/90 hover:bg-primary backdrop-blur-md"
          >
            <Box className="h-4 w-4" />
            <span className="hidden sm:inline">Diseñar mi versión</span>
            <span className="sm:hidden">Diseñar 3D</span>
          </Button>
        </div>
      )}

      {/* Bottom gradient + info bar — reserves right padding for the
          navigation control stack at bottom-right (~44px wide). */}
      <div
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pt-16 pb-3 pl-4 pr-16 md:pl-5 md:pr-20 pointer-events-none"
        style={{ zIndex: 'var(--z-content)' }}
      >
        <div className="flex flex-wrap items-end justify-between gap-3 pointer-events-auto">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-primary/90 text-primary-foreground text-[10px] uppercase tracking-wider">
                Vista cinemática · {mode === 'packing' ? 'Packing' : 'Conjunto'}
              </Badge>
              {areaM2 && (
                <Badge variant="outline" className="bg-background/50 backdrop-blur text-xs">
                  {(areaM2 / 10000).toLocaleString('es-CL', { maximumFractionDigits: 1 })} ha
                </Badge>
              )}
            </div>
            <h2 className="text-white font-semibold text-base md:text-lg leading-tight line-clamp-1">
              {title}
            </h2>
          </div>
          {/* Legend */}
          {layout && (
            <div className="flex flex-wrap gap-1.5">
              {layout.legend.map((l) => (
                <div
                  key={l.label}
                  className="flex items-center gap-1.5 rounded-full bg-background/70 backdrop-blur-md border border-border/40 px-2 py-1 text-[10px] font-medium text-foreground"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: l.color }}
                  />
                  {l.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Animate fill-extrusion height from 0 to real height with stagger.
 * We use a data-driven expression with `feature-state`-like trick via
 * interpolated multiplier `t` on the `height` property over time.
 */
function animateBuildings(
  map: mapboxgl.Map,
  data: GeoJSON.FeatureCollection,
  delay: number,
) {
  const total = (data.features?.length ?? 0);
  if (!total) return;

  const start = performance.now() + delay;
  const perBuildingDelay = 80;
  const riseDuration = 600;
  const totalDuration = perBuildingDelay * total + riseDuration;

  // Use a single global animation: per-feature progress = clamp((t - order*delay)/rise, 0, 1)
  // We bake order via 'order' property and use 'time' via repeated paint updates.
  const tick = (now: number) => {
    if (!map || (map as unknown as { _removed?: boolean })._removed) return;
    const elapsed = now - start;
    if (elapsed < 0) {
      requestAnimationFrame(tick);
      return;
    }
    if (!map.getLayer('teno-bldg-layer')) return;

    // Height expression: per-feature based on order. Interpolate from base→height
    // so roof parts (with base>0) don't invert.
    map.setPaintProperty('teno-bldg-layer', 'fill-extrusion-height', [
      'let',
      'progress',
      [
        'max',
        0,
        [
          'min',
          1,
          ['/', ['-', elapsed, ['*', ['get', 'order'], perBuildingDelay]], riseDuration],
        ],
      ],
      [
        '+',
        ['get', 'base'],
        ['*', ['-', ['get', 'height'], ['get', 'base']], ['var', 'progress']],
      ],
    ] as never);

    map.setPaintProperty('teno-bldg-layer', 'fill-extrusion-opacity', Math.min(1, elapsed / 400) * 0.92);

    if (elapsed < totalDuration) {
      requestAnimationFrame(tick);
    }
  };
  requestAnimationFrame(tick);
}

export default TenoCinematicHero;
