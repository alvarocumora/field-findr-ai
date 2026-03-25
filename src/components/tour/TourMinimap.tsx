import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapboxToken } from '@/hooks/useMapboxToken';

interface TourMinimapProps {
  center: { lat: number; lng: number };
  lots: any[];
  yaw?: number;
  onLotClick?: (lotId: string) => void;
}

export function TourMinimap({ center, lots, yaw = 0, onLotClick }: TourMinimapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const { token } = useMapboxToken();

  useEffect(() => {
    if (!mapContainer.current || !token) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [center.lng, center.lat],
      zoom: 16,
      interactive: true,
      attributionControl: false,
    });

    mapRef.current = map;

    // Add camera position marker
    const el = document.createElement('div');
    el.innerHTML = `<div style="width:24px;height:24px;background:rgba(59,130,246,0.9);border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`;
    markerRef.current = new mapboxgl.Marker(el)
      .setLngLat([center.lng, center.lat])
      .addTo(map);

    map.on('load', () => {
      // Add lot polygons
      const features = lots
        .filter(l => l.polygon?.coordinates)
        .map(l => ({
          type: 'Feature' as const,
          properties: { id: l.id, lot_number: l.lot_number, status: l.status },
          geometry: l.polygon,
        }));

      if (features.length > 0) {
        map.addSource('minimap-lots', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features },
        });

        map.addLayer({
          id: 'minimap-lots-fill',
          type: 'fill',
          source: 'minimap-lots',
          paint: {
            'fill-color': [
              'match', ['get', 'status'],
              'available', 'rgba(5,150,105,0.4)',
              'reserved', 'rgba(245,158,11,0.4)',
              'sold', 'rgba(107,114,128,0.4)',
              'rgba(5,150,105,0.3)',
            ],
            'fill-outline-color': 'rgba(255,255,255,0.8)',
          },
        });

        map.addLayer({
          id: 'minimap-lots-outline',
          type: 'line',
          source: 'minimap-lots',
          paint: {
            'line-color': 'rgba(255,255,255,0.9)',
            'line-width': 1,
          },
        });

        // Click handler
        map.on('click', 'minimap-lots-fill', (e) => {
          const feature = e.features?.[0];
          if (feature?.properties?.id) {
            onLotClick?.(feature.properties.id);
          }
        });

        map.on('mouseenter', 'minimap-lots-fill', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'minimap-lots-fill', () => {
          map.getCanvas().style.cursor = '';
        });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [token, center, lots]);

  return (
    <div className="absolute bottom-20 left-4 z-10 w-48 h-36 rounded-xl overflow-hidden shadow-xl border-2 border-white/30">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
