import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Layers, Navigation, MapPin } from 'lucide-react';

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
  const { token, loading } = useMapboxToken();
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('satellite');

  useEffect(() => {
    if (!mapContainer.current || !token || !lat || !lng) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle === 'satellite' 
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/dark-v11',
      center: [lng, lat],
      zoom: 14,
      pitch: 45,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Custom marker
    const markerEl = document.createElement('div');
    markerEl.innerHTML = `
      <div class="relative">
        <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg animate-pulse">
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

    return () => {
      map.current?.remove();
    };
  }, [token, lat, lng]);

  // Update style when changed
  useEffect(() => {
    if (!map.current) return;
    
    const style = mapStyle === 'satellite' 
      ? 'mapbox://styles/mapbox/satellite-streets-v12'
      : 'mapbox://styles/mapbox/dark-v11';
    
    map.current.setStyle(style);
  }, [mapStyle]);

  const handleRecenter = () => {
    if (map.current && lat && lng) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        pitch: 45,
      });
    }
  };

  const openInGoogleMaps = () => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  if (!lat || !lng) {
    return (
      <div className={`aspect-video bg-muted/30 rounded-xl flex items-center justify-center ${className}`}>
        <div className="text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Ubicación no disponible
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Skeleton className={`aspect-video rounded-xl ${className}`} />;
  }

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <div ref={mapContainer} className="w-full aspect-video" />
      
      {/* Controls */}
      <div className="absolute bottom-3 left-3 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="glass border-white/10 text-xs"
          onClick={() => setMapStyle(s => s === 'satellite' ? 'streets' : 'satellite')}
        >
          <Layers className="h-3 w-3 mr-1" />
          {mapStyle === 'satellite' ? 'Mapa' : 'Satélite'}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="glass border-white/10 text-xs"
          onClick={handleRecenter}
        >
          <Navigation className="h-3 w-3 mr-1" />
          Centrar
        </Button>
      </div>

      <Button
        size="sm"
        variant="secondary"
        className="absolute bottom-3 right-3 glass border-white/10 text-xs"
        onClick={openInGoogleMaps}
      >
        Abrir en Google Maps
      </Button>
    </div>
  );
};

export default PropertyMap;
