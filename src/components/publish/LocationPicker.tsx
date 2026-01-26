import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Loader2 } from 'lucide-react';

interface GeocodedAddress {
  address: string;
  city?: string;
  region?: string;
  country?: string;
}

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onLocationSelect: (lat: number, lng: number, address?: GeocodedAddress) => void;
}

const LocationPicker = ({ lat, lng, onLocationSelect }: LocationPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const { token: mapboxToken, loading: tokenLoading, error: tokenError } = useMapboxToken();

  // Reverse geocoding function
  const reverseGeocode = useCallback(async (latitude: number, longitude: number): Promise<GeocodedAddress | undefined> => {
    if (!mapboxToken) return undefined;
    
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&language=es&types=address,place,region,country`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const context = feature.context || [];
        
        // Extract address components from context
        const getContextValue = (type: string) => {
          const item = context.find((c: { id: string }) => c.id.startsWith(type));
          return item?.text;
        };
        
        return {
          address: feature.place_name || feature.text,
          city: getContextValue('place') || getContextValue('locality'),
          region: getContextValue('region'),
          country: getContextValue('country'),
        };
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    } finally {
      setIsGeocoding(false);
    }
    return undefined;
  }, [mapboxToken]);

  // Handle location selection with geocoding
  const handleLocationChange = useCallback(async (latitude: number, longitude: number) => {
    const address = await reverseGeocode(latitude, longitude);
    onLocationSelect(latitude, longitude, address);
  }, [reverseGeocode, onLocationSelect]);

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
        handleLocationChange(lngLat.lat, lngLat.lng);
      }
    });

    // Handle map click to place/move marker
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      marker.current?.setLngLat([lng, lat]).addTo(map.current!);
      handleLocationChange(lat, lng);
    });

    map.current.on('load', () => {
      setIsLoading(false);
    });

    return () => {
      marker.current?.remove();
      map.current?.remove();
    };
  }, [mapboxToken, tokenLoading, handleLocationChange]);

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
      
      {/* Geocoding indicator */}
      {isGeocoding && (
        <div className="absolute top-4 right-16 z-10 glass px-3 py-1.5 rounded-full flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Obteniendo dirección...
        </div>
      )}
      
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
