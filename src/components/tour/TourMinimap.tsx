import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Satellite } from 'lucide-react';
import { useSentinelImagery } from '@/hooks/useSentinelImagery';
import { syncSentinelRasterLayers } from '@/lib/satellite/mapboxSentinel';
import { formatSentinelDate } from '@/lib/satellite/sentinel';

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
  const { data: sentinelImagery } = useSentinelImagery({
    lots,
    center,
    enabled: true,
    maxCloudCover: 35,
    lookbackDays: 90,
  });

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
    el.style.width = '40px';
    el.style.height = '40px';
    el.innerHTML = `
      <div style="position:relative;width:40px;height:40px;">
        <div data-tour-heading style="position:absolute;left:18px;top:0;width:4px;height:24px;transform-origin:2px 20px;transition:transform .18s ease;">
          <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:16px solid #f6c64e;transform:translateX(-5px);filter:drop-shadow(0 2px 3px rgba(0,0,0,.55));"></div>
        </div>
        <div style="position:absolute;left:8px;top:8px;width:24px;height:24px;background:rgba(5,150,105,.95);border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.45);"></div>
      </div>`;
    markerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([center.lng, center.lat])
      .addTo(map);

    map.on('load', () => {
      if (sentinelImagery?.available) {
        syncSentinelRasterLayers(map, sentinelImagery, undefined, 1);
      }

      // Add lot polygons
      const features = lots.flatMap((l) => {
        const geometry = l.polygon?.coordinates
          ? l.polygon
          : Array.isArray(l.polygon) && l.polygon.length >= 3
            ? {
                type: 'Polygon' as const,
                coordinates: [[
                  ...l.polygon,
                  ...(l.polygon[0]?.[0] === l.polygon[l.polygon.length - 1]?.[0] &&
                  l.polygon[0]?.[1] === l.polygon[l.polygon.length - 1]?.[1]
                    ? []
                    : [l.polygon[0]]),
                ]],
              }
            : null;
        if (!geometry) return [];
        return [{
          type: 'Feature' as const,
          properties: { id: l.id, lot_number: l.lot_number, status: l.status },
          geometry,
        }];
      });

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

        const bounds = new mapboxgl.LngLatBounds();
        features.forEach((feature: any) => {
          feature.geometry.coordinates[0].forEach(([lng, lat]: [number, number]) => bounds.extend([lng, lat]));
        });
        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 18, duration: 0 });

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
  }, [token, center, lots, onLotClick, sentinelImagery]);

  useEffect(() => {
    const el = markerRef.current?.getElement();
    const heading = el?.querySelector<HTMLElement>('[data-tour-heading]');
    if (!heading) return;
    heading.style.transform = `rotate(${(yaw * 180) / Math.PI}deg)`;
  }, [yaw]);

  return (
    <div className="absolute bottom-20 left-4 z-10 w-48 h-36 rounded-xl overflow-hidden shadow-xl border-2 border-white/30">
      <div ref={mapContainer} className="w-full h-full" />
      {sentinelImagery?.available && (
        <div className="pointer-events-none absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/65 px-1.5 py-1 text-[8px] font-medium text-white backdrop-blur">
          <Satellite className="h-2.5 w-2.5 text-emerald-300" />
          {formatSentinelDate(sentinelImagery.acquisition_datetime)}
        </div>
      )}
    </div>
  );
}
