import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { hasWebGLSupport } from '@/components/lots/LotMapView';

export interface GlobeProject {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
}

interface Props {
  projects: GlobeProject[];
  activeId?: string;
  reducedMotion?: boolean;
  onSelect?: (id: string) => void;
  /** Rendered when the globe can't run (no WebGL / token / style error). */
  fallback: React.ReactNode;
}

const toGeoJSON = (projects: GlobeProject[], activeId?: string) => ({
  type: 'FeatureCollection' as const,
  features: projects
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .map((p) => ({
      type: 'Feature' as const,
      properties: { id: p.id, name: p.name, active: p.id === activeId ? 1 : 0 },
      geometry: { type: 'Point' as const, coordinates: [p.lng as number, p.lat as number] },
    })),
});

/**
 * Landing hero globe: one Mapbox instance (globe projection + DEM terrain)
 * that flies to the active project. Projects sync via setData; the map is
 * created once per token, never per render.
 */
const HeroTerrainGlobe = ({ projects, activeId, reducedMotion, onSelect, fallback }: Props) => {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(() => !hasWebGLSupport());
  const { token, error } = useMapboxToken();
  const dataRef = useRef({ projects, activeId });
  dataRef.current = { projects, activeId };
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!token || failed || !container.current || map.current) return;
    mapboxgl.accessToken = token;
    let m: mapboxgl.Map;
    try {
      m = new mapboxgl.Map({
        container: container.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        projection: 'globe',
        center: [-71.5, -30],
        zoom: 1.6,
        pitch: 0,
        attributionControl: false,
        cooperativeGestures: true,
        antialias: false,
      });
    } catch {
      setFailed(true);
      return;
    }
    map.current = m;
    m.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    const giveUp = window.setTimeout(() => { if (!m.loaded()) setFailed(true); }, 15000);

    m.on('style.load', () => {
      // Atlas look: the globe floats on the platform's paper tone, no black space.
      m.setFog({ color: 'rgb(236,233,224)', 'high-color': 'rgb(226,225,216)', 'horizon-blend': 0.12, 'space-color': 'rgb(247,245,240)', 'star-intensity': 0 });
      if (!m.getSource('dem')) m.addSource('dem', { type: 'raster-dem', url: 'mapbox://mapbox.mapbox-terrain-dem-v1', tileSize: 512, maxzoom: 14 });
      m.setTerrain({ source: 'dem', exaggeration: 1.6 });
      m.addSource('hero-projects', { type: 'geojson', data: toGeoJSON(dataRef.current.projects, dataRef.current.activeId) });
      m.addLayer({ id: 'hero-projects-halo', type: 'circle', source: 'hero-projects', paint: {
        'circle-radius': ['case', ['==', ['get', 'active'], 1], 20, 0], 'circle-color': '#22C55E', 'circle-opacity': 0.3,
      } });
      m.addLayer({ id: 'hero-projects-dot', type: 'circle', source: 'hero-projects', paint: {
        'circle-radius': ['case', ['==', ['get', 'active'], 1], 8, 5], 'circle-color': ['case', ['==', ['get', 'active'], 1], '#22C55E', '#214C3C'],
        'circle-stroke-color': '#F7F5F0', 'circle-stroke-width': 2,
      } });
      m.addLayer({ id: 'hero-projects-label', type: 'symbol', source: 'hero-projects', layout: {
        'text-field': ['get', 'name'], 'text-size': 12, 'text-offset': [0, 1.4], 'text-anchor': 'top', 'text-optional': true,
      }, paint: { 'text-color': '#1A2420', 'text-halo-color': 'rgba(247,245,240,0.95)', 'text-halo-width': 1.6 } });
      m.on('click', 'hero-projects-dot', (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) onSelectRef.current?.(String(id));
      });
      m.on('mouseenter', 'hero-projects-dot', () => { m.getCanvas().style.cursor = 'pointer'; });
      m.on('mouseleave', 'hero-projects-dot', () => { m.getCanvas().style.cursor = ''; });
      setReady(true);
    });
    m.on('error', (e) => { if (!m.isStyleLoaded() && /style/i.test(String(e?.error?.message))) setFailed(true); });
    m.getCanvas().addEventListener('webglcontextlost', () => setFailed(true));

    return () => { window.clearTimeout(giveUp); m.remove(); map.current = null; setReady(false); };
  }, [token, failed]);

  // Sync markers.
  useEffect(() => {
    const src = map.current?.getSource('hero-projects') as mapboxgl.GeoJSONSource | undefined;
    if (ready && src) src.setData(toGeoJSON(projects, activeId));
  }, [ready, projects, activeId]);

  // Fly to the active project.
  useEffect(() => {
    const m = map.current;
    const p = projects.find((x) => x.id === activeId);
    if (!ready || !m || !p || !Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return;
    const target = { center: [p.lng as number, p.lat as number] as [number, number], zoom: 13.2, pitch: 62, bearing: -25 };
    if (reducedMotion) m.jumpTo(target);
    else m.flyTo({ ...target, duration: 6500, curve: 1.6, essential: false });
  }, [ready, activeId, projects, reducedMotion]);

  // Slow cinematic orbit around the active project while nobody interacts.
  useEffect(() => {
    const m = map.current;
    if (!ready || !m || reducedMotion) return;
    let touched = false;
    const stop = () => { touched = true; };
    const drift = (e: { originalEvent?: unknown }) => {
      if (touched || e.originalEvent) return;
      m.easeTo({ bearing: m.getBearing() + 40, duration: 24000, easing: (t) => t, essential: false });
    };
    m.on('moveend', drift);
    m.on('mousedown', stop); m.on('touchstart', stop); m.on('wheel', stop);
    return () => { m.off('moveend', drift); m.off('mousedown', stop); m.off('touchstart', stop); m.off('wheel', stop); };
  }, [ready, reducedMotion]);

  if (failed || error) return <>{fallback}</>;
  return (
    <div className="absolute inset-0">
      <div ref={container} className="absolute inset-0" aria-label="Globo 3D con la ubicación de los proyectos" role="img" />
      {!ready && <div className="absolute inset-0">{fallback}</div>}
    </div>
  );
};

export default HeroTerrainGlobe;
