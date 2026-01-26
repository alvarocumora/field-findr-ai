import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin } from 'lucide-react';

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
}

const LocationPicker = ({ lat, lng, onLocationSelect }: LocationPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token: mapboxToken, loading: tokenLoading, error: tokenError } = useMapboxToken();

  useEffect(() => {
    if (!mapContainer.current || tokenLoading || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const initialCenter: [number, number] = lng && lat ? [lng, lat] : [-70.6693, -33.4489];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: initialCenter,
      zoom: lat && lng ? 12 : 5,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Create draggable marker
    marker.current = new mapboxgl.Marker({ 
      color: '#10b981',
      draggable: true 
    });

    if (lat && lng) {
      marker.current.setLngLat([lng, lat]).addTo(map.current);
    }

    // Handle marker drag
    marker.current.on('dragend', () => {
      const lngLat = marker.current?.getLngLat();
      if (lngLat) {
        onLocationSelect(lngLat.lat, lngLat.lng);
      }
    });

    // Handle map click to place/move marker
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      marker.current?.setLngLat([lng, lat]).addTo(map.current!);
      onLocationSelect(lat, lng);
    });

    map.current.on('load', () => {
      setIsLoading(false);
    });

    return () => {
      marker.current?.remove();
      map.current?.remove();
    };
  }, [mapboxToken, tokenLoading]);

  // Update marker position when props change
  useEffect(() => {
    if (map.current && marker.current && lat && lng) {
      marker.current.setLngLat([lng, lat]);
      if (!marker.current.getElement().parentElement) {
        marker.current.addTo(map.current);
      }
    }
  }, [lat, lng]);

  if (tokenError) {
    return (
      <div className="aspect-[16/9] rounded-lg glass border border-white/10 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <p>Error al cargar mapa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/9] rounded-lg overflow-hidden border border-white/10">
      {(isLoading || tokenLoading) && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
      
      {!lat && !lng && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="glass px-4 py-2 rounded-full text-sm text-muted-foreground">
            Haz clic para seleccionar ubicación
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
