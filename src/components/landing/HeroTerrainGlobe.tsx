import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { useTheme } from '@/components/theme/ThemeProvider';
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

// Keep the Earth visible in every selected-project state; the visitor should
// never unexpectedly leave the brand-level world view for a parcel close-up.
const GLOBE_ZOOM = 1.7;

const getAtmosphere = (isDark: boolean) => isDark
  ? {
      color: 'rgb(5, 25, 24)',
      'high-color': 'rgb(12, 59, 66)',
      'horizon-blend': 0.1,
      'space-color': 'rgb(3, 11, 17)',
      'star-intensity': 0.12,
    }
  : {
      color: 'rgb(236,233,224)',
      'high-color': 'rgb(226,225,216)',
      'horizon-blend': 0.12,
      'space-color': 'rgb(247,245,240)',
      'star-intensity': 0,
    };

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
  const { resolvedTheme } = useTheme();
  const themeRef = useRef(resolvedTheme);
  themeRef.current = resolvedTheme;
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
      // The globe inherits the Rural Finder light/dark identity.
      m.setFog(getAtmosphere(themeRef.current === 'dark'));
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
      // Keep the static Earth visible until the map actually finishes its first load.
      m.once('load', () => setReady(true));
    });
    m.on('error', (e) => { if (!m.isStyleLoaded() && /style/i.test(String(e?.error?.message))) setFailed(true); });
    m.getCanvas().addEventListener('webglcontextlost', () => setFailed(true));

    return () => { window.clearTimeout(giveUp); m.remove(); map.current = null; setReady(false); };
  }, [token, failed]);

  // Update the atmosphere on theme changes without rebuilding WebGL.
  useEffect(() => {
    const current = map.current;
    if (ready && current?.isStyleLoaded()) {
      current.setFog(getAtmosphere(resolvedTheme === 'dark'));
    }
  }, [ready, resolvedTheme]);

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
    const target = {
      center: [p.lng as number, p.lat as number] as [number, number],
      zoom: GLOBE_ZOOM,
      pitch: 0,
      bearing: 0,
    };
    if (reducedMotion) m.jumpTo(target);
    else m.easeTo({ ...target, duration: 1900, essential: false });
  }, [ready, activeId, projects, reducedMotion]);

  if (failed || error) return <>{fallback}</>;
  return (
    <div className="absolute inset-0">
      <div ref={container} className="absolute inset-0" aria-label="Globo 3D con la ubicación de los proyectos" role="img" />
      {!ready && <div className="absolute inset-0">{fallback}</div>}
    </div>
  );
};

export default HeroTerrainGlobe;
