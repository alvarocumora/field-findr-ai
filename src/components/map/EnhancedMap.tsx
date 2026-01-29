import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  ZoomIn, 
  ZoomOut, 
  Locate, 
  Navigation, 
  Compass, 
  Mountain,
  PenTool,
  Trash2,
  Maximize2,
  Layers,
  Sun,
  Moon,
  Satellite,
  Map as MapIcon,
  RotateCcw,
  Eye,
  EyeOff,
  Ruler,
  Target
} from 'lucide-react';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Listing, formatPrice, formatArea, getListingTypeLabel } from '@/hooks/useListings';
import { useNavigate } from 'react-router-dom';
import EnhancedMapControls from './EnhancedMapControls';

interface EnhancedMapProps {
  listings: Listing[];
  hoveredListing?: Listing | null;
  onListingHover?: (listing: Listing | null) => void;
  onListingClick?: (listing: Listing) => void;
  onPolygonDrawn?: (polygon: number[][], area: number) => void;
  className?: string;
  showDrawTools?: boolean;
}

const statusColors = {
  active: '#10b981',
  reserved: '#f59e0b',
  sold: '#ef4444',
};

const statusLabels = {
  active: 'Disponible',
  reserved: 'Reservado',
  sold: 'Vendido',
};

const EnhancedMap = ({
  listings,
  hoveredListing,
  onListingHover,
  onListingClick,
  onPolygonDrawn,
  className = '',
  showDrawTools = true,
}: EnhancedMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnArea, setDrawnArea] = useState<number | null>(null);
  const [mapMode, setMapMode] = useState<'streets' | 'satellite' | '3d'>('3d');
  const [showClusters, setShowClusters] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [controlsExpanded, setControlsExpanded] = useState(false);
  const { token: mapboxToken, loading: tokenLoading, error: tokenError } = useMapboxToken();
  const navigate = useNavigate();

  // Calculate center from listings
  const getCenter = useCallback((): [number, number] => {
    if (listings.length === 0) return [-70.6693, -33.4489];
    const validListings = listings.filter((l) => l.lat && l.lng);
    if (validListings.length === 0) return [-70.6693, -33.4489];
    const sumLat = validListings.reduce((acc, l) => acc + (l.lat || 0), 0);
    const sumLng = validListings.reduce((acc, l) => acc + (l.lng || 0), 0);
    return [sumLng / validListings.length, sumLat / validListings.length];
  }, [listings]);

  // Create enhanced popup HTML
  const createPopupHTML = (listing: Listing) => `
    <div class="enhanced-map-popup" style="font-family: system-ui, -apple-system, sans-serif; min-width: 260px;">
      <div style="position: relative; height: 120px; border-radius: 12px 12px 0 0; overflow: hidden;">
        <img 
          src="${listing.images[0] || '/placeholder.svg'}" 
          alt="${listing.title}"
          style="width: 100%; height: 100%; object-fit: cover;"
        />
        <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);"></div>
        <div style="position: absolute; bottom: 8px; left: 8px; right: 8px;">
          <span style="
            font-size: 10px; 
            padding: 3px 8px; 
            border-radius: 20px; 
            background: ${statusColors[listing.status as keyof typeof statusColors] || statusColors.active};
            color: white;
            font-weight: 500;
          ">
            ${statusLabels[listing.status as keyof typeof statusLabels] || 'Disponible'}
          </span>
        </div>
      </div>
      <div style="padding: 12px;">
        <h4 style="font-weight: 600; font-size: 14px; margin-bottom: 6px; color: #1e293b; line-height: 1.3;">
          ${listing.title}
        </h4>
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
          <span style="
            font-size: 10px; 
            padding: 2px 8px; 
            border-radius: 12px; 
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
            color: #0284c7;
            font-weight: 500;
          ">
            ${getListingTypeLabel(listing.type)}
          </span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 12px;">📍</span>
            <span style="font-size: 12px; color: #64748b;">${listing.location}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 12px;">📐</span>
            <span style="font-size: 12px; color: #64748b;">${formatArea(listing.area_m2, listing.area_ha)}</span>
          </div>
        </div>
        <div style="
          padding: 8px;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border-radius: 8px;
          text-align: center;
        ">
          <span style="font-weight: 700; color: #16a34a; font-size: 16px;">
            ${formatPrice(listing.price, listing.currency)}
          </span>
        </div>
      </div>
    </div>
  `;

  // Create enhanced marker element
  const createMarkerElement = (listing: Listing, isHovered: boolean = false) => {
    const el = document.createElement('div');
    el.className = 'enhanced-map-marker';
    el.setAttribute('data-listing-id', listing.id);

    const size = isHovered ? 52 : 44;
    const color = statusColors[listing.status as keyof typeof statusColors] || statusColors.active;

    el.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      transform: ${isHovered ? 'scale(1.15) translateY(-10px)' : 'scale(1)'};
      z-index: ${isHovered ? 1000 : 1};
      filter: ${isHovered ? 'drop-shadow(0 12px 24px rgba(0,0,0,0.4))' : 'drop-shadow(0 6px 12px rgba(0,0,0,0.25))'};
    `;

    // Premium 3D pin design
    el.innerHTML = `
      <div style="position: relative; width: ${size}px; height: ${size + 16}px;">
        <div style="
          position: relative;
          width: ${size}px;
          height: ${size}px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          background: linear-gradient(145deg, ${color}, ${adjustColor(color, -20)});
          border: 3px solid rgba(255,255,255,0.9);
          box-shadow: 
            inset 0 3px 6px rgba(255,255,255,0.4),
            inset 0 -3px 6px rgba(0,0,0,0.1),
            0 4px 12px rgba(0,0,0,0.2);
          overflow: hidden;
        ">
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 50%;
            background: linear-gradient(to bottom, rgba(255,255,255,0.3), transparent);
            border-radius: inherit;
          "></div>
          <div style="
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            transform: rotate(45deg);
          ">
            <span style="font-size: 16px;">${getTypeEmoji(listing.type)}</span>
          </div>
        </div>
        <!-- Pin shadow -->
        <div style="
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: ${size * 0.5}px;
          height: 6px;
          background: radial-gradient(ellipse, rgba(0,0,0,0.25), transparent);
          border-radius: 50%;
        "></div>
        <!-- Price tag -->
        ${listing.price ? `
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: white;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 9px;
            font-weight: 600;
            color: ${color};
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
            white-space: nowrap;
            transform: rotate(45deg);
          ">
            ${formatCompactPrice(listing.price)}
          </div>
        ` : ''}
      </div>
    `;

    return el;
  };

  // Get emoji for property type
  const getTypeEmoji = (type: string): string => {
    const emojis: Record<string, string> = {
      parcela_rural: '🌳',
      sitio_industrial: '🏭',
      campo_agricola: '🌾',
      terreno_urbano: '🏗️',
      terreno_costero: '🏖️',
      terreno_montana: '⛰️',
      inversion: '💎',
    };
    return emojis[type] || '📍';
  };

  // Format compact price
  const formatCompactPrice = (price: number): string => {
    if (price >= 1000000000) return `${(price / 1000000000).toFixed(1)}B`;
    if (price >= 1000000) return `${(price / 1000000).toFixed(0)}M`;
    if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
    return price.toString();
  };

  // Adjust color brightness
  function adjustColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)}`;
  }

  // Calculate polygon area in m²
  const calculatePolygonArea = (coordinates: number[][]): number => {
    if (coordinates.length < 3) return 0;
    
    let area = 0;
    const n = coordinates.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      // Convert to approximate meters (rough estimate at latitude -33)
      const x1 = coordinates[i][0] * 111320 * Math.cos(coordinates[i][1] * Math.PI / 180);
      const y1 = coordinates[i][1] * 110540;
      const x2 = coordinates[j][0] * 111320 * Math.cos(coordinates[j][1] * Math.PI / 180);
      const y2 = coordinates[j][1] * 110540;
      
      area += x1 * y2 - x2 * y1;
    }
    
    return Math.abs(area / 2);
  };

  // Get map style URL
  const getMapStyle = useCallback(() => {
    switch (mapMode) {
      case 'satellite':
        return 'mapbox://styles/mapbox/satellite-streets-v12';
      case '3d':
        return 'mapbox://styles/mapbox/outdoors-v12';
      default:
        return 'mapbox://styles/mapbox/light-v11';
    }
  }, [mapMode]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || tokenLoading || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: getMapStyle(),
      center: getCenter(),
      zoom: 6,
      pitch: mapMode === '3d' ? 50 : 0,
      bearing: mapMode === '3d' ? -17 : 0,
      antialias: true,
    });

    popupRef.current = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: 30,
      maxWidth: '300px',
      className: 'enhanced-map-popup-container',
    });

    // Initialize draw control
    if (showDrawTools) {
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {},
        defaultMode: 'simple_select',
        styles: [
          {
            id: 'gl-draw-polygon-fill',
            type: 'fill',
            filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            paint: {
              'fill-color': '#10b981',
              'fill-opacity': 0.2,
            },
          },
          {
            id: 'gl-draw-polygon-stroke',
            type: 'line',
            filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            paint: {
              'line-color': '#10b981',
              'line-width': 3,
              'line-dasharray': [2, 2],
            },
          },
          {
            id: 'gl-draw-point',
            type: 'circle',
            filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
            paint: {
              'circle-radius': 6,
              'circle-color': '#10b981',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff',
            },
          },
        ],
      });
      map.current.addControl(draw.current);
    }

    map.current.on('load', () => {
      // Add 3D terrain
      if (mapMode === '3d' && map.current) {
        map.current.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
        map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        // Add atmosphere
        map.current.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0, 75],
            'sky-atmosphere-sun-intensity': 15,
          },
        });
      }

      // Add clustering source
      if (showClusters && listings.length > 0) {
        const validListings = listings.filter(l => l.lat && l.lng);
        
        map.current?.addSource('listings-cluster', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: validListings.map(l => ({
              type: 'Feature' as const,
              properties: { id: l.id, price: l.price, status: l.status, type: l.type },
              geometry: { type: 'Point' as const, coordinates: [l.lng!, l.lat!] },
            })),
          },
          cluster: true,
          clusterMaxZoom: 12,
          clusterRadius: 60,
        });

        // Cluster circles
        map.current?.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'listings-cluster',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#10b981',
              5,
              '#f59e0b',
              10,
              '#ef4444',
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              20,
              5,
              30,
              10,
              40,
            ],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
          },
        });

        // Cluster count
        map.current?.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'listings-cluster',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 14,
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        // Click on cluster to zoom
        map.current?.on('click', 'clusters', (e) => {
          if (!e.features?.length) return;
          
          const clusterId = e.features[0].properties?.cluster_id;
          const source = map.current?.getSource('listings-cluster') as mapboxgl.GeoJSONSource;
          
          source?.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err || !e.features?.length) return;
            const geometry = e.features[0].geometry as GeoJSON.Point;
            map.current?.easeTo({
              center: geometry.coordinates as [number, number],
              zoom: zoom || 10,
            });
          });
        });

        // Change cursor on cluster hover
        map.current?.on('mouseenter', 'clusters', () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current?.on('mouseleave', 'clusters', () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });
      }

      setIsLoading(false);
    });

    // Drawing events
    if (showDrawTools) {
      map.current.on('draw.create', (e: { features: GeoJSON.Feature[] }) => {
        const polygon = e.features[0];
        if (polygon.geometry.type === 'Polygon') {
          const coords = (polygon.geometry as GeoJSON.Polygon).coordinates[0];
          const area = calculatePolygonArea(coords as number[][]);
          setDrawnArea(area);
          onPolygonDrawn?.(coords as number[][], area);
        }
      });

      map.current.on('draw.update', (e: { features: GeoJSON.Feature[] }) => {
        const polygon = e.features[0];
        if (polygon.geometry.type === 'Polygon') {
          const coords = (polygon.geometry as GeoJSON.Polygon).coordinates[0];
          const area = calculatePolygonArea(coords as number[][]);
          setDrawnArea(area);
          onPolygonDrawn?.(coords as number[][], area);
        }
      });

      map.current.on('draw.delete', () => {
        setDrawnArea(null);
        setIsDrawing(false);
      });
    }

    return () => {
      Object.values(markersRef.current).forEach((marker) => marker.remove());
      markersRef.current = {};
      popupRef.current?.remove();
      map.current?.remove();
    };
  }, [mapboxToken, tokenLoading, getCenter, getMapStyle, mapMode, showDrawTools]);

  // Update markers when listings change (only when not using clusters)
  useEffect(() => {
    if (!map.current || isLoading || showClusters) return;

    const currentListingIds = new Set(listings.map((l) => l.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentListingIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

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

      const marker = new mapboxgl.Marker(el)
        .setLngLat([listing.lng, listing.lat])
        .addTo(map.current!);

      markersRef.current[listing.id] = marker;
    });

    // Fit bounds
    if (listings.length > 0) {
      const validListings = listings.filter((l) => l.lat && l.lng);
      if (validListings.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        validListings.forEach((l) => bounds.extend([l.lng!, l.lat!]));
        map.current.fitBounds(bounds, { padding: 80, maxZoom: 10 });
      }
    }
  }, [listings, isLoading, hoveredListing, showClusters]);

  const attachMarkerEvents = (el: HTMLElement, listing: Listing) => {
    el.addEventListener('mouseenter', () => {
      onListingHover?.(listing);
      el.style.transform = 'scale(1.15) translateY(-10px)';
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
    if (!map.current || isLoading || showClusters) return;

    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement();
      const listing = listings.find((l) => l.id === id);
      if (!listing) return;

      const isHovered = hoveredListing?.id === id;

      el.style.transform = isHovered ? 'scale(1.15) translateY(-10px)' : 'scale(1)';
      el.style.zIndex = isHovered ? '1000' : '1';

      if (isHovered && listing.lat && listing.lng) {
        map.current?.flyTo({
          center: [listing.lng, listing.lat],
          zoom: Math.max(map.current.getZoom(), 10),
          duration: 800,
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
  }, [hoveredListing, listings, isLoading, showClusters]);

  // Control handlers
  const handleZoomIn = () => map.current?.zoomIn();
  const handleZoomOut = () => map.current?.zoomOut();

  const handleLocate = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.current?.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 12,
            pitch: mapMode === '3d' ? 50 : 0,
          });
        },
        () => console.warn('Geolocation denied')
      );
    }
  };

  const handleFitAll = () => {
    const validListings = listings.filter((l) => l.lat && l.lng);
    if (validListings.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validListings.forEach((l) => bounds.extend([l.lng!, l.lat!]));
      map.current?.fitBounds(bounds, { padding: 80, maxZoom: 10 });
    }
  };

  const handleResetView = () => {
    map.current?.easeTo({
      pitch: mapMode === '3d' ? 50 : 0,
      bearing: mapMode === '3d' ? -17 : 0,
      duration: 800,
    });
    handleFitAll();
  };

  const handleResetNorth = () => {
    map.current?.easeTo({ bearing: 0, duration: 500 });
  };

  const startDrawing = () => {
    if (draw.current) {
      draw.current.changeMode('draw_polygon');
      setIsDrawing(true);
    }
  };

  const clearDrawing = () => {
    if (draw.current) {
      draw.current.deleteAll();
      setDrawnArea(null);
      setIsDrawing(false);
    }
  };

  const changeMapMode = (mode: 'streets' | 'satellite' | '3d') => {
    setMapMode(mode);
    if (map.current) {
      map.current.setStyle(
        mode === 'satellite'
          ? 'mapbox://styles/mapbox/satellite-streets-v12'
          : mode === '3d'
          ? 'mapbox://styles/mapbox/outdoors-v12'
          : 'mapbox://styles/mapbox/light-v11'
      );

      map.current.once('style.load', () => {
        if (mode === '3d') {
          map.current?.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14,
          });
          map.current?.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
          map.current?.easeTo({ pitch: 50, bearing: -17, duration: 800 });
        } else {
          map.current?.setTerrain(null);
          map.current?.easeTo({ pitch: 0, bearing: 0, duration: 500 });
        }
      });
    }
  };

  const toggleClusters = () => {
    setShowClusters(!showClusters);
    // Would need to reinitialize map for this to take effect fully
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
    <TooltipProvider>
      <div className={`relative overflow-hidden ${className}`}>
        {(isLoading || tokenLoading) && (
          <div className="absolute inset-0 z-10">
            <Skeleton className="w-full h-full" />
          </div>
        )}

        <div ref={mapContainer} className="w-full h-full" />

        {/* Mode Badge */}
        <Badge
          className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-background/95 backdrop-blur-sm border border-white/10 px-4 py-1.5"
        >
          {mapMode === '3d' && <Mountain className="h-3.5 w-3.5 mr-1.5" />}
          {mapMode === 'satellite' && <Satellite className="h-3.5 w-3.5 mr-1.5" />}
          {mapMode === 'streets' && <MapIcon className="h-3.5 w-3.5 mr-1.5" />}
          <span className="text-xs font-medium">
            {mapMode === '3d' ? 'Vista 3D Inmersiva' : mapMode === 'satellite' ? 'Vista Satelital' : 'Vista Calles'}
          </span>
        </Badge>

        {/* Main Controls - Left Side */}
        <div className="absolute top-16 left-4 flex flex-col gap-2 z-10">
          {/* Zoom Controls */}
          <div className="flex flex-col gap-1 bg-background/95 backdrop-blur-sm rounded-lg border border-white/10 p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={handleZoomIn} className="h-8 w-8">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Acercar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={handleZoomOut} className="h-8 w-8">
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Alejar</TooltipContent>
            </Tooltip>
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-col gap-1 bg-background/95 backdrop-blur-sm rounded-lg border border-white/10 p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={handleLocate} className="h-8 w-8">
                  <Target className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Mi ubicación</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={handleFitAll} className="h-8 w-8">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Ver todas</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={handleResetNorth} className="h-8 w-8">
                  <Compass className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Orientar al norte</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={handleResetView} className="h-8 w-8">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Restablecer vista</TooltipContent>
            </Tooltip>
          </div>

          {/* Map Style Controls */}
          <div className="flex flex-col gap-1 bg-background/95 backdrop-blur-sm rounded-lg border border-white/10 p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant={mapMode === 'streets' ? 'secondary' : 'ghost'} 
                  onClick={() => changeMapMode('streets')} 
                  className="h-8 w-8"
                >
                  <MapIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Vista Calles</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant={mapMode === 'satellite' ? 'secondary' : 'ghost'} 
                  onClick={() => changeMapMode('satellite')} 
                  className="h-8 w-8"
                >
                  <Satellite className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Vista Satelital</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant={mapMode === '3d' ? 'secondary' : 'ghost'} 
                  onClick={() => changeMapMode('3d')} 
                  className="h-8 w-8"
                >
                  <Mountain className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Vista 3D</TooltipContent>
            </Tooltip>
          </div>

          {/* Drawing Tools */}
          {showDrawTools && (
            <div className="flex flex-col gap-1 bg-background/95 backdrop-blur-sm rounded-lg border border-white/10 p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant={isDrawing ? 'default' : 'ghost'} 
                    onClick={startDrawing} 
                    className="h-8 w-8"
                  >
                    <PenTool className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Dibujar área</TooltipContent>
              </Tooltip>
              {drawnArea !== null && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={clearDrawing} 
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Borrar área</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <Card className="absolute bottom-4 left-4 p-3 bg-background/95 backdrop-blur-sm z-10 border border-white/10">
          <div className="flex gap-4 text-xs">
            {Object.entries(statusLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: statusColors[key as keyof typeof statusColors] }} 
                />
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Results count & Drawn area */}
        <Card className="absolute top-4 right-4 px-4 py-2 bg-background/95 backdrop-blur-sm z-10 border border-white/10">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {listings.filter((l) => l.lat && l.lng).length} propiedades
            </p>
            {drawnArea !== null && (
              <p className="text-xs text-primary flex items-center gap-1">
                <Ruler className="h-3 w-3" />
                {drawnArea >= 10000 
                  ? `${(drawnArea / 10000).toFixed(2)} ha` 
                  : `${drawnArea.toFixed(0)} m²`
                }
              </p>
            )}
          </div>
        </Card>

        {/* 3D Mode indicator */}
        {mapMode === '3d' && (
          <Card className="absolute bottom-4 right-4 p-2 bg-background/95 backdrop-blur-sm z-10 border border-white/10 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mountain className="h-3 w-3 text-primary" />
              <span>Terreno 3D • Arrastre para rotar</span>
            </div>
          </Card>
        )}

        {/* Drawing mode indicator */}
        {isDrawing && (
          <Card className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-primary text-primary-foreground z-20 animate-pulse">
            <div className="flex items-center gap-2 text-sm">
              <PenTool className="h-4 w-4" />
              <span>Dibujando área • Haz clic para agregar puntos</span>
            </div>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default EnhancedMap;
