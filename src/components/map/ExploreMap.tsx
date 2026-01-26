import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ZoomIn, ZoomOut, Layers, Locate, Navigation } from 'lucide-react';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Listing, formatPrice, formatArea, getListingTypeLabel } from '@/hooks/useListings';
import { useNavigate } from 'react-router-dom';

interface ExploreMapProps {
  listings: Listing[];
  hoveredListing?: Listing | null;
  onListingHover?: (listing: Listing | null) => void;
  onListingClick?: (listing: Listing) => void;
  className?: string;
}

const statusColors = {
  active: '#10b981',
  reserved: '#f59e0b', 
  sold: '#ef4444',
};

const ExploreMap = ({ 
  listings,
  hoveredListing,
  onListingHover,
  onListingClick,
  className = ''
}: ExploreMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const { token: mapboxToken, loading: tokenLoading, error: tokenError } = useMapboxToken();
  const navigate = useNavigate();

  // Calculate center from listings
  const getCenter = useCallback((): [number, number] => {
    if (listings.length === 0) return [-70.6693, -33.4489]; // Santiago default
    
    const validListings = listings.filter(l => l.lat && l.lng);
    if (validListings.length === 0) return [-70.6693, -33.4489];
    
    const sumLat = validListings.reduce((acc, l) => acc + (l.lat || 0), 0);
    const sumLng = validListings.reduce((acc, l) => acc + (l.lng || 0), 0);
    
    return [sumLng / validListings.length, sumLat / validListings.length];
  }, [listings]);

  // Create popup HTML
  const createPopupHTML = (listing: Listing) => `
    <div class="p-3 min-w-[220px]" style="font-family: system-ui, -apple-system, sans-serif;">
      <div class="mb-2 rounded-lg overflow-hidden" style="height: 100px;">
        <img 
          src="${listing.images[0] || '/placeholder.svg'}" 
          alt="${listing.title}"
          style="width: 100%; height: 100%; object-fit: cover;"
        />
      </div>
      <h4 style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #1e293b; line-height: 1.3;">
        ${listing.title}
      </h4>
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
        <span style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; background: #f1f5f9; color: #64748b;">
          ${getListingTypeLabel(listing.type)}
        </span>
      </div>
      <p style="font-size: 12px; color: #64748b; margin-bottom: 4px;">
        📍 ${listing.location}
      </p>
      <p style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
        📐 ${formatArea(listing.area_m2, listing.area_ha)}
      </p>
      <p style="font-weight: 700; color: #10b981; font-size: 16px;">
        ${formatPrice(listing.price, listing.currency)}
      </p>
    </div>
  `;

  // Create custom marker element
  const createMarkerElement = (listing: Listing, isHovered: boolean = false) => {
    const el = document.createElement('div');
    el.className = 'explore-map-marker';
    el.setAttribute('data-listing-id', listing.id);
    
    const size = isHovered ? 44 : 36;
    const color = statusColors[listing.status as keyof typeof statusColors] || statusColors.active;
    
    el.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${color};
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
      transform: ${isHovered ? 'scale(1.2)' : 'scale(1)'};
      z-index: ${isHovered ? 1000 : 1};
    `;
    
    el.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3" fill="${color}"/>
      </svg>
    `;
    
    return el;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || tokenLoading || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle === 'satellite' 
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/light-v11',
      center: getCenter(),
      zoom: 5,
      pitch: 0,
    });

    popupRef.current = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: 25,
      maxWidth: '280px',
    });

    map.current.on('load', () => {
      setIsLoading(false);
    });

    return () => {
      // Clean up markers
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
      popupRef.current?.remove();
      map.current?.remove();
    };
  }, [mapboxToken, tokenLoading, getCenter]);

  // Update style when changed
  useEffect(() => {
    if (!map.current || isLoading) return;
    
    map.current.setStyle(
      mapStyle === 'satellite' 
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/light-v11'
    );
  }, [mapStyle, isLoading]);

  // Add/update markers when listings change
  useEffect(() => {
    if (!map.current || isLoading) return;

    // Remove old markers that are no longer in listings
    const currentListingIds = new Set(listings.map(l => l.id));
    Object.keys(markersRef.current).forEach(id => {
      if (!currentListingIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add/update markers for each listing
    listings.forEach(listing => {
      if (!listing.lat || !listing.lng) return;

      const isHovered = hoveredListing?.id === listing.id;
      
      // If marker exists, update it
      if (markersRef.current[listing.id]) {
        const existingEl = markersRef.current[listing.id].getElement();
        const newEl = createMarkerElement(listing, isHovered);
        existingEl.replaceWith(newEl);
        
        // Re-attach event listeners
        newEl.addEventListener('mouseenter', () => {
          onListingHover?.(listing);
          popupRef.current
            ?.setLngLat([listing.lng!, listing.lat!])
            .setHTML(createPopupHTML(listing))
            .addTo(map.current!);
        });
        
        newEl.addEventListener('mouseleave', () => {
          onListingHover?.(null);
          popupRef.current?.remove();
        });
        
        newEl.addEventListener('click', () => {
          if (onListingClick) {
            onListingClick(listing);
          } else {
            navigate(`/propiedad/${listing.id}`);
          }
        });
        
        return;
      }

      // Create new marker
      const el = createMarkerElement(listing, isHovered);
      
      el.addEventListener('mouseenter', () => {
        onListingHover?.(listing);
        el.style.transform = 'scale(1.2)';
        el.style.zIndex = '1000';
        
        popupRef.current
          ?.setLngLat([listing.lng!, listing.lat!])
          .setHTML(createPopupHTML(listing))
          .addTo(map.current!);
      });
      
      el.addEventListener('mouseleave', () => {
        onListingHover?.(null);
        el.style.transform = 'scale(1)';
        el.style.zIndex = '1';
        popupRef.current?.remove();
      });
      
      el.addEventListener('click', () => {
        if (onListingClick) {
          onListingClick(listing);
        } else {
          navigate(`/propiedad/${listing.id}`);
        }
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([listing.lng, listing.lat])
        .addTo(map.current!);

      markersRef.current[listing.id] = marker;
    });

    // Fit bounds to show all markers
    if (listings.length > 0) {
      const validListings = listings.filter(l => l.lat && l.lng);
      if (validListings.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        validListings.forEach(l => {
          bounds.extend([l.lng!, l.lat!]);
        });
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
      }
    }
  }, [listings, isLoading, hoveredListing, onListingHover, onListingClick, navigate]);

  // Highlight hovered listing from grid
  useEffect(() => {
    if (!map.current || isLoading) return;

    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement();
      const listing = listings.find(l => l.id === id);
      if (!listing) return;
      
      const isHovered = hoveredListing?.id === id;
      
      el.style.transform = isHovered ? 'scale(1.2)' : 'scale(1)';
      el.style.zIndex = isHovered ? '1000' : '1';
      
      if (isHovered && listing.lat && listing.lng) {
        map.current?.flyTo({
          center: [listing.lng, listing.lat],
          zoom: Math.max(map.current.getZoom(), 8),
          duration: 500,
        });
        
        popupRef.current
          ?.setLngLat([listing.lng, listing.lat])
          .setHTML(createPopupHTML(listing))
          .addTo(map.current!);
      }
    });
    
    if (!hoveredListing) {
      popupRef.current?.remove();
    }
  }, [hoveredListing, listings, isLoading]);

  const handleZoomIn = () => map.current?.zoomIn();
  const handleZoomOut = () => map.current?.zoomOut();
  
  const handleLocate = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        map.current?.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 10,
        });
      });
    }
  };

  const handleFitAll = () => {
    const validListings = listings.filter(l => l.lat && l.lng);
    if (validListings.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validListings.forEach(l => {
        bounds.extend([l.lng!, l.lat!]);
      });
      map.current?.fitBounds(bounds, { padding: 50, maxZoom: 10 });
    }
  };

  const toggleMapStyle = () => {
    setMapStyle(prev => prev === 'streets' ? 'satellite' : 'streets');
  };

  if (tokenError) {
    return (
      <Card className={`relative overflow-hidden flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <p className="text-muted-foreground">Error al cargar el mapa</p>
          <p className="text-sm text-muted-foreground/70 mt-1">{tokenError}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {(isLoading || tokenLoading) && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Map Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        <Button 
          size="icon" 
          variant="secondary" 
          onClick={handleZoomIn} 
          className="h-9 w-9 shadow-md bg-background/95 backdrop-blur-sm border border-white/10"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="secondary" 
          onClick={handleZoomOut} 
          className="h-9 w-9 shadow-md bg-background/95 backdrop-blur-sm border border-white/10"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="secondary" 
          onClick={handleLocate} 
          className="h-9 w-9 shadow-md bg-background/95 backdrop-blur-sm border border-white/10"
        >
          <Locate className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="secondary" 
          onClick={toggleMapStyle} 
          className="h-9 w-9 shadow-md bg-background/95 backdrop-blur-sm border border-white/10"
        >
          <Layers className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="secondary" 
          onClick={handleFitAll} 
          className="h-9 w-9 shadow-md bg-background/95 backdrop-blur-sm border border-white/10"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <Card className="absolute bottom-4 left-4 p-3 bg-background/95 backdrop-blur-sm z-10 border border-white/10">
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors.active }} />
            <span className="text-muted-foreground">Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors.reserved }} />
            <span className="text-muted-foreground">Reservado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors.sold }} />
            <span className="text-muted-foreground">Vendido</span>
          </div>
        </div>
      </Card>

      {/* Results count */}
      <Card className="absolute top-4 right-4 px-4 py-2 bg-background/95 backdrop-blur-sm z-10 border border-white/10">
        <p className="text-sm font-medium text-foreground">
          {listings.filter(l => l.lat && l.lng).length} propiedades en mapa
        </p>
      </Card>
    </div>
  );
};

export default ExploreMap;
