import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Listing, formatPrice } from '@/hooks/useListings';
import { Button } from '@/components/ui/button';
import { Maximize2 } from 'lucide-react';
import MapErrorState from './MapErrorState';
import MapLoadingSkeleton from './MapLoadingSkeleton';
import { cn } from '@/lib/utils';

interface MiniMapProps {
  listings: Listing[];
  className?: string;
}

const MiniMap = ({ listings, className = '' }: MiniMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const { token, loading, error, retry } = useMapboxToken();
  const navigate = useNavigate();

  const initializeMap = useCallback(() => {
    if (!mapContainer.current || !token) return;

    // Clean up existing map
    if (map.current) {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.current.remove();
      map.current = null;
    }

    try {
      mapboxgl.accessToken = token;

      // Calculate center from listings
      const validListings = listings.filter(l => l.lat && l.lng);
      let center: [number, number] = [-70.6693, -33.4489]; // Default: Santiago
      
      if (validListings.length > 0) {
        const sumLat = validListings.reduce((acc, l) => acc + (l.lat || 0), 0);
        const sumLng = validListings.reduce((acc, l) => acc + (l.lng || 0), 0);
        center = [sumLng / validListings.length, sumLat / validListings.length];
      }

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center,
        zoom: 4,
        interactive: true,
        attributionControl: false,
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        setMapError(null);
        
        // Add markers after map loads
        validListings.forEach(listing => {
          if (!listing.lat || !listing.lng || !map.current) return;

          const el = document.createElement('div');
          el.className = 'mini-map-marker';
          el.style.cssText = `
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: hsl(142.1 76.2% 36.3%);
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          `;
          
          el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.5)';
            el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
          });
          
          el.addEventListener('mouseleave', () => {
            el.style.transform = 'scale(1)';
            el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
          });
          
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            navigate(`/propiedad/${listing.id}`);
          });

          const popup = new mapboxgl.Popup({ 
            offset: 15, 
            closeButton: false,
            className: 'mini-map-popup'
          }).setHTML(`
            <div style="padding: 8px; min-width: 160px; background: white; border-radius: 8px;">
              <p style="font-weight: 600; font-size: 12px; margin-bottom: 4px; color: #1e293b; line-height: 1.3;">
                ${listing.title.substring(0, 35)}${listing.title.length > 35 ? '...' : ''}
              </p>
              <p style="font-weight: 700; color: #10b981; font-size: 14px; margin: 0;">
                ${formatPrice(listing.price, listing.currency)}
              </p>
            </div>
          `);

          const marker = new mapboxgl.Marker(el)
            .setLngLat([listing.lng, listing.lat])
            .setPopup(popup)
            .addTo(map.current!);

          markersRef.current.push(marker);
        });

        // Fit bounds if multiple listings
        if (validListings.length > 1) {
          const bounds = new mapboxgl.LngLatBounds();
          validListings.forEach(l => {
            if (l.lat && l.lng) bounds.extend([l.lng, l.lat]);
          });
          map.current?.fitBounds(bounds, { padding: 40, maxZoom: 8 });
        }
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Error al cargar el mapa');
      });

    } catch (err) {
      console.error('Failed to initialize MiniMap:', err);
      setMapError('No se pudo inicializar el mapa');
    }

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [token, listings, navigate]);

  useEffect(() => {
    const cleanup = initializeMap();
    return () => {
      cleanup?.();
    };
  }, [initializeMap]);

  // Loading state
  if (loading) {
    return <MapLoadingSkeleton className={className} />;
  }

  // Error state
  if (error || mapError) {
    return (
      <MapErrorState 
        error={error || mapError}
        onRetry={retry}
        className={className}
        variant="compact"
      />
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Expand button */}
      <Button
        size="sm"
        variant="secondary"
        className="absolute bottom-3 right-3 z-10 glass border border-white/10 shadow-lg"
        onClick={() => navigate('/explorar')}
      >
        <Maximize2 className="h-4 w-4 mr-1" />
        Ver mapa
      </Button>

      {/* Gradient overlay for polish */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/30 via-transparent to-transparent" />
    </div>
  );
};

export default MiniMap;
