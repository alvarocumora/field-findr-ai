import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Locate, Navigation, Compass, Mountain } from 'lucide-react';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Listing, formatPrice, formatArea, getListingTypeLabel } from '@/hooks/useListings';
import { useNavigate } from 'react-router-dom';
import MapLayerControls, { MapLayerState, MapControlState } from './MapLayerControls';

interface Map3DViewerProps {
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

const Map3DViewer = ({
  listings,
  hoveredListing,
  onListingHover,
  onListingClick,
  className = '',
}: Map3DViewerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token: mapboxToken, loading: tokenLoading, error: tokenError } = useMapboxToken();
  const navigate = useNavigate();

  // Layer states
  const [layers, setLayers] = useState<MapLayerState>({
    terrain3D: true,
    satellite: false,
    buildings3D: true,
    contours: false,
    water: true,
    vegetation: false,
    roads: true,
    riskZones: false,
  });

  // Control states
  const [controls, setControls] = useState<MapControlState>({
    pitch: 45,
    bearing: -17,
    sunPosition: 12,
  });

  // Calculate center from listings
  const getCenter = useCallback((): [number, number] => {
    if (listings.length === 0) return [-70.6693, -33.4489]; // Santiago default

    const validListings = listings.filter((l) => l.lat && l.lng);
    if (validListings.length === 0) return [-70.6693, -33.4489];

    const sumLat = validListings.reduce((acc, l) => acc + (l.lat || 0), 0);
    const sumLng = validListings.reduce((acc, l) => acc + (l.lng || 0), 0);

    return [sumLng / validListings.length, sumLat / validListings.length];
  }, [listings]);

  // Create popup HTML with enhanced styling
  const createPopupHTML = (listing: Listing) => `
    <div class="p-3 min-w-[240px]" style="font-family: system-ui, -apple-system, sans-serif;">
      <div class="mb-2 rounded-lg overflow-hidden relative" style="height: 110px;">
        <img 
          src="${listing.images[0] || '/placeholder.svg'}" 
          alt="${listing.title}"
          style="width: 100%; height: 100%; object-fit: cover;"
        />
        <div style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7); padding: 2px 8px; border-radius: 12px;">
          <span style="font-size: 10px; color: white; font-weight: 500;">3D</span>
        </div>
      </div>
      <h4 style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #1e293b; line-height: 1.3;">
        ${listing.title}
      </h4>
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
        <span style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; background: linear-gradient(135deg, #10b981, #0ea5e9); color: white;">
          ${getListingTypeLabel(listing.type)}
        </span>
      </div>
      <p style="font-size: 12px; color: #64748b; margin-bottom: 4px;">
        📍 ${listing.location}
      </p>
      <p style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
        📐 ${formatArea(listing.area_m2, listing.area_ha)}
      </p>
      <p style="font-weight: 700; background: linear-gradient(135deg, #10b981, #0ea5e9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 16px;">
        ${formatPrice(listing.price, listing.currency)}
      </p>
    </div>
  `;

  // Create custom 3D marker element
  const createMarkerElement = (listing: Listing, isHovered: boolean = false) => {
    const el = document.createElement('div');
    el.className = 'map-3d-marker';
    el.setAttribute('data-listing-id', listing.id);

    const size = isHovered ? 48 : 40;
    const color = statusColors[listing.status as keyof typeof statusColors] || statusColors.active;

    el.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform: ${isHovered ? 'scale(1.2) translateY(-8px)' : 'scale(1)'};
      z-index: ${isHovered ? 1000 : 1};
      filter: ${isHovered ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'};
    `;

    // Create 3D pin effect
    el.innerHTML = `
      <div style="
        width: ${size}px;
        height: ${size + 12}px;
        position: relative;
      ">
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: linear-gradient(135deg, ${color}, ${color}cc);
          border: 3px solid white;
          box-shadow: inset 0 2px 4px rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style="transform: rotate(45deg);">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
        </div>
        <div style="
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: ${size * 0.6}px;
          height: 8px;
          background: radial-gradient(ellipse, rgba(0,0,0,0.3), transparent);
          border-radius: 50%;
        "></div>
      </div>
    `;

    return el;
  };

  // Get map style based on layers
  const getMapStyle = useCallback(() => {
    if (layers.satellite) {
      return 'mapbox://styles/mapbox/satellite-streets-v12';
    }
    return 'mapbox://styles/mapbox/light-v11';
  }, [layers.satellite]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || tokenLoading || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getMapStyle(),
      center: getCenter(),
      zoom: 6,
      pitch: controls.pitch,
      bearing: controls.bearing,
      antialias: true,
    });

    popupRef.current = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: 25,
      maxWidth: '300px',
    });

    map.current.on('load', () => {
      // Add 3D terrain if enabled
      if (layers.terrain3D && map.current) {
        map.current.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
        map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        // Add sky layer for atmosphere effect
        map.current.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': getSunPosition(controls.sunPosition),
            'sky-atmosphere-sun-intensity': 15,
          },
        });
      }

      // Add 3D buildings if enabled
      if (layers.buildings3D && map.current) {
        const currentLayers = map.current.getStyle().layers;
        const labelLayerId = currentLayers?.find(
          (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
        )?.id;

        map.current.addLayer(
          {
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 15,
            paint: {
              'fill-extrusion-color': '#aaa',
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['get', 'min_height'],
              'fill-extrusion-opacity': 0.6,
            },
          },
          labelLayerId
        );
      }

      setIsLoading(false);
    });

    // Add navigation control
    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    return () => {
      Object.values(markersRef.current).forEach((marker) => marker.remove());
      markersRef.current = {};
      popupRef.current?.remove();
      map.current?.remove();
    };
  }, [mapboxToken, tokenLoading, getCenter, getMapStyle]);

  // Helper function to calculate sun position for atmosphere
  const getSunPosition = (hour: number): [number, number] => {
    // Simulate sun position based on hour (simplified)
    const azimuth = ((hour - 6) / 12) * 180 - 90; // -90 to 90 degrees
    const altitude = Math.sin(((hour - 6) / 12) * Math.PI) * 60; // 0 to 60 degrees
    return [azimuth, Math.max(0, altitude)];
  };

  // Update map style when satellite layer changes
  useEffect(() => {
    if (!map.current || isLoading) return;
    map.current.setStyle(getMapStyle());
  }, [layers.satellite, getMapStyle, isLoading]);

  // Update terrain and controls
  useEffect(() => {
    if (!map.current || isLoading) return;

    // Update pitch and bearing
    map.current.easeTo({
      pitch: controls.pitch,
      bearing: controls.bearing,
      duration: 500,
    });

    // Update sun position for sky layer
    if (map.current.getLayer('sky')) {
      map.current.setPaintProperty('sky', 'sky-atmosphere-sun', getSunPosition(controls.sunPosition));
    }
  }, [controls, isLoading]);

  // Add/update markers when listings change
  useEffect(() => {
    if (!map.current || isLoading) return;

    // Remove old markers
    const currentListingIds = new Set(listings.map((l) => l.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentListingIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add/update markers
    listings.forEach((listing) => {
      if (!listing.lat || !listing.lng) return;

      const isHovered = hoveredListing?.id === listing.id;

      if (markersRef.current[listing.id]) {
        const existingEl = markersRef.current[listing.id].getElement();
        const newEl = createMarkerElement(listing, isHovered);
        existingEl.replaceWith(newEl);
        attachMarkerEvents(newEl, listing);
        return;
      }

      const el = createMarkerElement(listing, isHovered);
      attachMarkerEvents(el, listing);

      const marker = new mapboxgl.Marker(el).setLngLat([listing.lng, listing.lat]).addTo(map.current!);

      markersRef.current[listing.id] = marker;
    });

    // Fit bounds
    if (listings.length > 0) {
      const validListings = listings.filter((l) => l.lat && l.lng);
      if (validListings.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        validListings.forEach((l) => {
          bounds.extend([l.lng!, l.lat!]);
        });
        map.current.fitBounds(bounds, { padding: 80, maxZoom: 10 });
      }
    }
  }, [listings, isLoading, hoveredListing]);

  const attachMarkerEvents = (el: HTMLElement, listing: Listing) => {
    el.addEventListener('mouseenter', () => {
      onListingHover?.(listing);
      el.style.transform = 'scale(1.2) translateY(-8px)';
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
  };

  // Highlight hovered listing
  useEffect(() => {
    if (!map.current || isLoading) return;

    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement();
      const listing = listings.find((l) => l.id === id);
      if (!listing) return;

      const isHovered = hoveredListing?.id === id;

      el.style.transform = isHovered ? 'scale(1.2) translateY(-8px)' : 'scale(1)';
      el.style.zIndex = isHovered ? '1000' : '1';

      if (isHovered && listing.lat && listing.lng) {
        map.current?.flyTo({
          center: [listing.lng, listing.lat],
          zoom: Math.max(map.current.getZoom(), 10),
          duration: 800,
        });

        popupRef.current?.setLngLat([listing.lng, listing.lat]).setHTML(createPopupHTML(listing)).addTo(map.current!);
      }
    });

    if (!hoveredListing) {
      popupRef.current?.remove();
    }
  }, [hoveredListing, listings, isLoading]);

  // Control handlers
  const handleZoomIn = () => map.current?.zoomIn();
  const handleZoomOut = () => map.current?.zoomOut();

  const handleLocate = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        map.current?.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 12,
          pitch: 45,
        });
      });
    }
  };

  const handleFitAll = () => {
    const validListings = listings.filter((l) => l.lat && l.lng);
    if (validListings.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validListings.forEach((l) => {
        bounds.extend([l.lng!, l.lat!]);
      });
      map.current?.fitBounds(bounds, { padding: 80, maxZoom: 10 });
    }
  };

  const handleResetView = () => {
    setControls({ pitch: 45, bearing: -17, sunPosition: 12 });
    handleFitAll();
  };

  const handleLayerChange = (layer: keyof MapLayerState, value: boolean) => {
    setLayers((prev) => ({ ...prev, [layer]: value }));
  };

  const handleControlChange = (control: keyof MapControlState, value: number) => {
    setControls((prev) => ({ ...prev, [control]: value }));
  };

  const handleResetNorth = () => {
    map.current?.easeTo({ bearing: 0, duration: 500 });
    setControls((prev) => ({ ...prev, bearing: 0 }));
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

      {/* 3D Mode Badge */}
      <Badge
        variant="secondary"
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-primary/90 text-primary-foreground backdrop-blur-sm px-4 py-1"
      >
        <Mountain className="h-3 w-3 mr-1" />
        Modo 3D Inmersivo
      </Badge>

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
        <MapLayerControls
          layers={layers}
          controls={controls}
          onLayerChange={handleLayerChange}
          onControlChange={handleControlChange}
          onResetView={handleResetView}
        />
        <Button
          size="icon"
          variant="secondary"
          onClick={handleResetNorth}
          className="h-9 w-9 shadow-md bg-background/95 backdrop-blur-sm border border-white/10"
        >
          <Compass className="h-4 w-4" />
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
        <p className="text-sm font-medium text-foreground">{listings.filter((l) => l.lat && l.lng).length} propiedades en mapa</p>
      </Card>

      {/* Terrain info */}
      {layers.terrain3D && (
        <Card className="absolute bottom-4 right-4 p-2 bg-background/95 backdrop-blur-sm z-10 border border-white/10 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mountain className="h-3 w-3" />
            <span>Terreno 3D activo • Exageración 1.5x</span>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Map3DViewer;
