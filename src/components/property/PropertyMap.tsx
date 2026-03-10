import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Button } from '@/components/ui/button';
import { Layers, Navigation, MapPin, ExternalLink, Satellite, Map as MapIcon, Moon, Mountain } from 'lucide-react';
import MapErrorState from '@/components/map/MapErrorState';
import MapLoadingSkeleton from '@/components/map/MapLoadingSkeleton';
import { cn } from '@/lib/utils';

type PropertyMapStyle = 'satellite' | 'streets' | 'dark' | '3d';

const STYLE_URLS: Record<PropertyMapStyle, string> = {
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  streets: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  '3d': 'mapbox://styles/mapbox/outdoors-v12',
};

const STYLE_LABELS: Record<PropertyMapStyle, string> = {
  satellite: 'Satélite',
  streets: 'Calles',
  dark: 'Oscuro',
  '3d': '3D',
};

interface PropertyMapProps {
  lat: number | null;
  lng: number | null;
  title: string;
  className?: string;
}

const PropertyMap = ({ lat, lng, title, className = '' }: PropertyMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const { token, loading, error, retry } = useMapboxToken();
  const [mapStyle, setMapStyle] = useState<PropertyMapStyle>('satellite');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const initializeMap = useCallback(() => {
    if (!mapContainer.current || !token || !lat || !lng) return;

    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    try {
      mapboxgl.accessToken = token;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: STYLE_URLS[mapStyle],
        center: [lng, lat],
        zoom: 14,
        pitch: mapStyle === '3d' ? 50 : 45,
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        setMapError(null);
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Error al cargar el estilo del mapa');
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      const markerEl = document.createElement('div');
      markerEl.innerHTML = `
        <div class="relative">
          <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg" style="animation: marker-pulse 2s ease-out infinite;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45"></div>
        </div>
      `;

      marker.current = new mapboxgl.Marker({ element: markerEl })
        .setLngLat([lng, lat])
        .addTo(map.current);

    } catch (err) {
      console.error('Failed to initialize map:', err);
      setMapError('No se pudo inicializar el mapa');
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [token, lat, lng, mapStyle]);

  useEffect(() => {
    const cleanup = initializeMap();
    return () => { cleanup?.(); };
  }, [initializeMap]);

  const handleRecenter = () => {
    if (map.current && lat && lng) {
      map.current.flyTo({ center: [lng, lat], zoom: 14, pitch: 45 });
    }
  };

  const cycleMapStyle = () => {
    const order: PropertyMapStyle[] = ['satellite', 'streets', 'dark', '3d'];
    const idx = order.indexOf(mapStyle);
    const next = order[(idx + 1) % order.length];
    setMapStyle(next);
    if (map.current) {
      map.current.setStyle(STYLE_URLS[next]);
    }
  };

  const openInGoogleMaps = () => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  if (!lat || !lng) {
    return (
      <div className={cn('aspect-video', className)}>
        <MapErrorState className="w-full h-full" variant="default" />
      </div>
    );
  }

  if (loading) {
    return <MapLoadingSkeleton className={cn('aspect-video', className)} />;
  }

  if (error || mapError) {
    return (
      <div className={cn('aspect-video', className)}>
        <MapErrorState error={error || mapError} onRetry={retry} className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className={cn('relative rounded-xl overflow-hidden', className)}>
      <div ref={mapContainer} className="w-full aspect-video" />
      
      <div className="absolute bottom-3 left-3 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="bg-black/60 backdrop-blur-xl border-white/10 text-white text-xs shadow-lg hover:bg-black/70"
          onClick={cycleMapStyle}
        >
          <Layers className="h-3 w-3 mr-1" />
          {STYLE_LABELS[mapStyle]}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="bg-black/60 backdrop-blur-xl border-white/10 text-white text-xs shadow-lg hover:bg-black/70"
          onClick={handleRecenter}
        >
          <Navigation className="h-3 w-3 mr-1" />
          Centrar
        </Button>
      </div>

      <Button
        size="sm"
        variant="secondary"
        className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xl border-white/10 text-white text-xs shadow-lg hover:bg-black/70"
        onClick={openInGoogleMaps}
      >
        <ExternalLink className="h-3 w-3 mr-1" />
        Google Maps
      </Button>
    </div>
  );
};

export default PropertyMap;
