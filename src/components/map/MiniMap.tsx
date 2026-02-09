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
import { useTheme } from '@/components/theme/ThemeProvider';

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
  const { resolvedTheme } = useTheme();

  const mapStyle = resolvedTheme === 'dark'
    ? 'mapbox://styles/mapbox/dark-v11'
    : 'mapbox://styles/mapbox/light-v11';

  const initializeMap = useCallback(() => {
    if (!mapContainer.current || !token) return;

    if (map.current) {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.current.remove();
      map.current = null;
    }

    try {
      mapboxgl.accessToken = token;

      const validListings = listings.filter(l => l.lat && l.lng);
      let center: [number, number] = [-70.6693, -33.4489];

      if (validListings.length > 0) {
        const sumLat = validListings.reduce((acc, l) => acc + (l.lat || 0), 0);
        const sumLng = validListings.reduce((acc, l) => acc + (l.lng || 0), 0);
        center = [sumLng / validListings.length, sumLat / validListings.length];
      }

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center,
        zoom: 4,
        interactive: true,
        attributionControl: false,
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        setMapError(null);

        validListings.forEach(listing => {
          if (!listing.lat || !listing.lng || !map.current) return;

          const el = document.createElement('div');
          el.className = 'mini-map-marker';
          el.style.cssText = `
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: hsl(var(--primary));
            border: 3px solid hsl(var(--background));
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          `;

          el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.4)';
            el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.4)';
          });

          el.addEventListener('mouseleave', () => {
            el.style.transform = 'scale(1)';
            el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
          });

          el.addEventListener('click', (e) => {
            e.stopPropagation();
            navigate(`/propiedad/${listing.id}`);
          });

          const popup = new mapboxgl.Popup({
            offset: 15,
            closeButton: false,
            className: 'mini-map-popup',
          }).setHTML(`
            <div style="padding: 10px; min-width: 170px; background: hsl(var(--popover)); color: hsl(var(--popover-foreground)); border-radius: 10px; border: 1px solid hsl(var(--border));">
              <p style="font-weight: 600; font-size: 12px; margin-bottom: 4px; line-height: 1.3;">
                ${listing.title.substring(0, 40)}${listing.title.length > 40 ? '...' : ''}
              </p>
              <p style="font-weight: 700; color: hsl(var(--primary)); font-size: 14px; margin: 0;">
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

        if (validListings.length > 1) {
          const bounds = new mapboxgl.LngLatBounds();
          validListings.forEach(l => {
            if (l.lat && l.lng) bounds.extend([l.lng, l.lat]);
          });
          map.current?.fitBounds(bounds, { padding: 40, maxZoom: 8 });
        }
      });

      map.current.on('error', () => {
        setMapError('Error al cargar el mapa');
      });
    } catch {
      setMapError('No se pudo inicializar el mapa');
    }

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [token, listings, navigate, mapStyle]);

  useEffect(() => {
    const cleanup = initializeMap();
    return () => { cleanup?.(); };
  }, [initializeMap]);

  if (loading) return <MapLoadingSkeleton className={className} />;

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

      <Button
        size="sm"
        variant="secondary"
        className="absolute bottom-3 right-3 z-10 glass border border-border/50 shadow-lg"
        onClick={() => navigate('/explorar')}
      >
        <Maximize2 className="h-4 w-4 mr-1" />
        Ver mapa
      </Button>

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/30 via-transparent to-transparent" />
    </div>
  );
};

export default MiniMap;
