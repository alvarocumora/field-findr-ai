import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import './interactive-earth.css';

interface InteractiveEarthProps {
  reducedMotion: boolean;
  onReady?: () => void;
}

interface GlobeProject {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  available_lots: number | null;
}

const CHILE_CENTER: [number, number] = [-70.6693, -33.4489];
const SOUTH_AMERICA_CENTER: [number, number] = [-73, -24];

const resolveMapboxToken = async () => {
  const configured = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
  if (configured) return configured;

  const { data, error } = await supabase.functions.invoke('get-mapbox-token');
  if (error) throw error;

  const token = (data as { token?: string } | null)?.token?.trim();
  if (!token) throw new Error('Mapbox token not configured');
  return token;
};

const makeProjectMarker = (project: GlobeProject, onSelect: () => void) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'atlas-project-marker';
  button.setAttribute('aria-label', `Abrir ${project.name}`);
  button.title = [
    project.name,
    project.city || project.region,
    project.available_lots ? `${project.available_lots} lotes disponibles` : null,
  ].filter(Boolean).join(' · ');

  const pulse = document.createElement('span');
  pulse.className = 'atlas-project-marker__pulse';
  const core = document.createElement('span');
  core.className = 'atlas-project-marker__core';
  button.append(pulse, core);
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    onSelect();
  });
  return button;
};

const InteractiveEarth = ({ reducedMotion, onReady }: InteractiveEarthProps) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    let cancelled = false;

    const initialize = async () => {
      try {
        const token = await resolveMapboxToken();
        if (cancelled || !containerRef.current) return;

        mapboxgl.accessToken = token;
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          projection: 'globe',
          center: SOUTH_AMERICA_CENTER,
          zoom: 1.15,
          pitch: 8,
          bearing: -8,
          antialias: true,
          attributionControl: false,
          fadeDuration: reducedMotion ? 0 : 500,
        });

        mapRef.current = map;
        map.scrollZoom.disable();
        // On touch devices let one-finger swipes scroll the page; two fingers pan the map.
        if (window.matchMedia('(pointer: coarse)').matches) {
          map.dragPan.disable();
          map.touchZoomRotate.disableRotation();
          map.getCanvas().style.touchAction = 'pan-y';
        }
        // On phones, keep the globe visual and let one finger scroll the page.
        // Desktop retains zoom/compass controls for active globe exploration.
        if (!window.matchMedia('(pointer: coarse)').matches) {
          map.addControl(new mapboxgl.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true,
          }), 'bottom-right');
        }
        map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

        map.on('load', async () => {
          if (cancelled) return;

          map.getStyle().layers?.forEach((layer) => {
            const isLabel = layer.type === 'symbol';
            const isBoundary = /boundary|admin/i.test(layer.id);
            if (isLabel || isBoundary) {
              map.setLayoutProperty(layer.id, 'visibility', 'none');
            }
          });

          map.setFog({
            color: 'rgb(5, 10, 14)',
            'high-color': 'rgb(12, 58, 72)',
            'horizon-blend': 0.08,
            'space-color': 'rgb(2, 4, 7)',
            'star-intensity': 0.12,
          });

          if (!map.getSource('atlas-terrain')) {
            map.addSource('atlas-terrain', {
              type: 'raster-dem',
              url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
              tileSize: 512,
              maxzoom: 14,
            });
            map.setTerrain({ source: 'atlas-terrain', exaggeration: 1.15 });
          }

          onReadyRef.current?.();

          if (!reducedMotion) {
            map.easeTo({
              center: CHILE_CENTER,
              zoom: 1.65,
              pitch: 12,
              bearing: -4,
              duration: 4200,
              essential: true,
            });
          } else {
            map.jumpTo({ center: CHILE_CENTER, zoom: 1.65, pitch: 12 });
          }

          const { data } = await supabase
            .from('projects')
            .select('id, name, city, region, latitude, longitude, available_lots')
            .eq('status', 'active')
            .eq('country', 'Chile')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .order('featured', { ascending: false })
            .limit(30);

          if (cancelled) return;

          markersRef.current.forEach((marker) => marker.remove());
          markersRef.current = ((data ?? []) as GlobeProject[])
            .filter((project) => Number.isFinite(project.latitude) && Number.isFinite(project.longitude))
            .map((project) => new mapboxgl.Marker({
              element: makeProjectMarker(project, () => navigate(`/proyecto/${project.id}?tab=map`)),
              anchor: 'center',
            })
              .setLngLat([Number(project.longitude), Number(project.latitude)])
              .addTo(map));
        });
      } catch (error) {
        console.warn('Live Chile globe unavailable; keeping image fallback.', error);
      }
    };

    void initialize();

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [navigate, reducedMotion]);

  return (
    <div className="atlas-live-globe absolute inset-0">
      <div
        ref={containerRef}
        className="h-full w-full touch-pan-y"
        role="application"
        aria-label="Globo satelital interactivo de Chile. Arrastra para explorar y selecciona un proyecto."
      />
      <div className="atlas-live-globe__badge pointer-events-none">
        <span className="atlas-live-globe__status" />
        Satélite real · Chile
      </div>
    </div>
  );
};

export default InteractiveEarth;
