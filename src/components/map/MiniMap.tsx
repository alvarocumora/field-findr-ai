import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Listing, formatPrice } from '@/hooks/useListings';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Maximize2 } from 'lucide-react';

interface MiniMapProps {
  listings: Listing[];
  className?: string;
}

const MiniMap = ({ listings, className = '' }: MiniMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token: mapboxToken, loading: tokenLoading } = useMapboxToken();
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapContainer.current || tokenLoading || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    // Calculate center from listings
    const validListings = listings.filter(l => l.lat && l.lng);
    let center: [number, number] = [-70.6693, -33.4489];
    
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
      setIsLoading(false);
      
      // Add markers
      validListings.forEach(listing => {
        if (!listing.lat || !listing.lng) return;

        const el = document.createElement('div');
        el.className = 'mini-map-marker';
        el.style.cssText = `
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: hsl(142.1 76.2% 36.3%);
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s ease;
        `;
        
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.5)';
        });
        
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
        });
        
        el.addEventListener('click', () => {
          navigate(`/propiedad/${listing.id}`);
        });

        const marker = new mapboxgl.Marker(el)
          .setLngLat([listing.lng, listing.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 15, closeButton: false })
              .setHTML(`
                <div style="padding: 8px; min-width: 150px;">
                  <p style="font-weight: 600; font-size: 12px; margin-bottom: 4px; color: #1e293b;">
                    ${listing.title.substring(0, 30)}${listing.title.length > 30 ? '...' : ''}
                  </p>
                  <p style="font-weight: 700; color: #10b981; font-size: 14px;">
                    ${formatPrice(listing.price, listing.currency)}
                  </p>
                </div>
              `)
          )
          .addTo(map.current!);

        markersRef.current.push(marker);
      });

      // Fit bounds
      if (validListings.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        validListings.forEach(l => {
          if (l.lat && l.lng) bounds.extend([l.lng, l.lat]);
        });
        map.current?.fitBounds(bounds, { padding: 30, maxZoom: 8 });
      }
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.current?.remove();
    };
  }, [mapboxToken, tokenLoading, listings, navigate]);

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {(isLoading || tokenLoading) && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Expand button */}
      <Button
        size="sm"
        variant="secondary"
        className="absolute bottom-3 right-3 z-10 glass border border-white/10"
        onClick={() => navigate('/explorar')}
      >
        <Maximize2 className="h-4 w-4 mr-1" />
        Ver mapa
      </Button>

      {/* Gradient overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/20 to-transparent" />
    </div>
  );
};

export default MiniMap;
