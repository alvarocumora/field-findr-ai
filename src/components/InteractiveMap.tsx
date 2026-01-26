import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ZoomIn, ZoomOut, Layers, Locate } from 'lucide-react';

interface LotPolygon {
  id: string;
  coordinates: number[][][];
  title: string;
  status: 'available' | 'reserved' | 'sold';
  price?: number;
  area?: string;
}

interface InteractiveMapProps {
  lots?: LotPolygon[];
  onLotClick?: (id: string) => void;
  className?: string;
  center?: [number, number];
  zoom?: number;
}

// Demo lots with polygon coordinates (Santiago area)
const demoLots: LotPolygon[] = [
  {
    id: 'lot-1',
    coordinates: [[
      [-70.6750, -33.4400],
      [-70.6700, -33.4400],
      [-70.6700, -33.4450],
      [-70.6750, -33.4450],
      [-70.6750, -33.4400],
    ]],
    title: 'Lote A-1 - Parcela Norte',
    status: 'available',
    price: 85000000,
    area: '5.000 m²'
  },
  {
    id: 'lot-2',
    coordinates: [[
      [-70.6700, -33.4400],
      [-70.6650, -33.4400],
      [-70.6650, -33.4450],
      [-70.6700, -33.4450],
      [-70.6700, -33.4400],
    ]],
    title: 'Lote A-2 - Parcela Central',
    status: 'reserved',
    price: 92000000,
    area: '5.200 m²'
  },
  {
    id: 'lot-3',
    coordinates: [[
      [-70.6650, -33.4400],
      [-70.6600, -33.4400],
      [-70.6600, -33.4450],
      [-70.6650, -33.4450],
      [-70.6650, -33.4400],
    ]],
    title: 'Lote A-3 - Parcela Este',
    status: 'sold',
    price: 78000000,
    area: '4.800 m²'
  },
  {
    id: 'lot-4',
    coordinates: [[
      [-70.6750, -33.4450],
      [-70.6700, -33.4450],
      [-70.6700, -33.4500],
      [-70.6750, -33.4500],
      [-70.6750, -33.4450],
    ]],
    title: 'Lote B-1 - Parcela Sur',
    status: 'available',
    price: 95000000,
    area: '5.500 m²'
  },
  {
    id: 'lot-5',
    coordinates: [[
      [-70.6700, -33.4450],
      [-70.6650, -33.4450],
      [-70.6650, -33.4500],
      [-70.6700, -33.4500],
      [-70.6700, -33.4450],
    ]],
    title: 'Lote B-2 - Parcela Premium',
    status: 'available',
    price: 120000000,
    area: '6.000 m²'
  },
  {
    id: 'lot-6',
    coordinates: [[
      [-70.6650, -33.4450],
      [-70.6600, -33.4450],
      [-70.6600, -33.4500],
      [-70.6650, -33.4500],
      [-70.6650, -33.4450],
    ]],
    title: 'Lote B-3 - Parcela Vista',
    status: 'reserved',
    price: 110000000,
    area: '5.800 m²'
  },
];

const statusColors = {
  available: '#10b981', // emerald-500
  reserved: '#f59e0b', // amber-500
  sold: '#ef4444', // red-500
};

const statusLabels = {
  available: 'Disponible',
  reserved: 'Reservado',
  sold: 'Vendido',
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const InteractiveMap = ({ 
  lots = demoLots,
  onLotClick,
  className = '',
  center = [-70.6675, -33.4450],
  zoom = 14
}: InteractiveMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('satellite');

  const addPolygonLayers = useCallback(() => {
    if (!map.current) return;

    // Create GeoJSON for each status
    const createGeoJSON = (status: 'available' | 'reserved' | 'sold') => ({
      type: 'FeatureCollection' as const,
      features: lots
        .filter(lot => lot.status === status)
        .map(lot => ({
          type: 'Feature' as const,
          id: lot.id,
          properties: {
            id: lot.id,
            title: lot.title,
            status: lot.status,
            price: lot.price,
            area: lot.area,
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: lot.coordinates,
          },
        })),
    });

    // Add sources and layers for each status
    (['available', 'reserved', 'sold'] as const).forEach(status => {
      const sourceId = `lots-${status}`;
      const fillLayerId = `lots-${status}-fill`;
      const lineLayerId = `lots-${status}-line`;

      // Remove existing layers and source if they exist
      if (map.current?.getLayer(fillLayerId)) {
        map.current.removeLayer(fillLayerId);
      }
      if (map.current?.getLayer(lineLayerId)) {
        map.current.removeLayer(lineLayerId);
      }
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }

      // Add source
      map.current?.addSource(sourceId, {
        type: 'geojson',
        data: createGeoJSON(status),
      });

      // Add fill layer
      map.current?.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': statusColors[status],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.7,
            0.5
          ],
        },
      });

      // Add outline layer
      map.current?.addLayer({
        id: lineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': statusColors[status],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            3,
            2
          ],
        },
      });

      // Add hover interactions
      let hoveredId: string | null = null;

      map.current?.on('mousemove', fillLayerId, (e) => {
        if (!map.current || !e.features?.length) return;
        
        map.current.getCanvas().style.cursor = 'pointer';
        
        const feature = e.features[0];
        const props = feature.properties;

        if (hoveredId !== null) {
          map.current.setFeatureState(
            { source: sourceId, id: hoveredId },
            { hover: false }
          );
        }
        
        hoveredId = feature.id as string;
        map.current.setFeatureState(
          { source: sourceId, id: hoveredId },
          { hover: true }
        );

        // Show popup
        const coordinates = e.lngLat;
        const price = props?.price ? `$${Number(props.price).toLocaleString('es-CL')}` : 'Consultar';
        
        popup.current
          ?.setLngLat(coordinates)
          .setHTML(`
            <div style="padding: 8px; font-family: system-ui;">
              <h4 style="font-weight: 600; margin-bottom: 4px; color: #1e293b;">${props?.title}</h4>
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: ${statusColors[status]};"></span>
                <span style="font-size: 12px; color: #64748b;">${statusLabels[status]}</span>
              </div>
              <p style="font-size: 13px; color: #475569; margin-bottom: 2px;">Área: ${props?.area || 'N/A'}</p>
              <p style="font-weight: 600; color: #10b981; font-size: 14px;">${price}</p>
            </div>
          `)
          .addTo(map.current!);
      });

      map.current?.on('mouseleave', fillLayerId, () => {
        if (!map.current) return;
        
        map.current.getCanvas().style.cursor = '';
        
        if (hoveredId !== null) {
          map.current.setFeatureState(
            { source: sourceId, id: hoveredId },
            { hover: false }
          );
        }
        hoveredId = null;
        popup.current?.remove();
      });

      // Click handler
      map.current?.on('click', fillLayerId, (e) => {
        if (!e.features?.length) return;
        const feature = e.features[0];
        onLotClick?.(feature.properties?.id);
      });
    });
  }, [lots, onLotClick]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle === 'satellite' 
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/light-v11',
      center,
      zoom,
      pitch: 30,
    });

    popup.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 10,
    });

    map.current.on('load', () => {
      setIsLoading(false);
      addPolygonLayers();
    });

    return () => {
      popup.current?.remove();
      map.current?.remove();
    };
  }, [center, zoom, addPolygonLayers]);

  // Update style when changed
  useEffect(() => {
    if (!map.current || isLoading) return;
    
    map.current.setStyle(
      mapStyle === 'satellite' 
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/light-v11'
    );

    map.current.once('style.load', () => {
      addPolygonLayers();
    });
  }, [mapStyle, addPolygonLayers, isLoading]);

  const handleZoomIn = () => map.current?.zoomIn();
  const handleZoomOut = () => map.current?.zoomOut();
  
  const handleLocate = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        map.current?.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 14,
        });
      });
    }
  };

  const toggleMapStyle = () => {
    setMapStyle(prev => prev === 'streets' ? 'satellite' : 'streets');
  };

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      
      <div ref={mapContainer} className="w-full h-full min-h-[400px]" />
      
      {/* Map Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        <Button size="icon" variant="secondary" onClick={handleZoomIn} className="h-9 w-9 shadow-md bg-background/95 backdrop-blur-sm">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" onClick={handleZoomOut} className="h-9 w-9 shadow-md bg-background/95 backdrop-blur-sm">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" onClick={handleLocate} className="h-9 w-9 shadow-md bg-background/95 backdrop-blur-sm">
          <Locate className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" onClick={toggleMapStyle} className="h-9 w-9 shadow-md bg-background/95 backdrop-blur-sm">
          <Layers className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend */}
      <Card className="absolute bottom-4 left-4 p-3 bg-background/95 backdrop-blur-sm z-10">
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: statusColors.available }} />
            <span className="text-muted-foreground">Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: statusColors.reserved }} />
            <span className="text-muted-foreground">Reservado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: statusColors.sold }} />
            <span className="text-muted-foreground">Vendido</span>
          </div>
        </div>
      </Card>

      {/* Status summary */}
      <Card className="absolute top-4 right-4 p-3 bg-background/95 backdrop-blur-sm z-10">
        <div className="text-xs space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Disponibles:</span>
            <span className="font-medium text-primary">{lots.filter(l => l.status === 'available').length}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Reservados:</span>
            <span className="font-medium text-amber-500">{lots.filter(l => l.status === 'reserved').length}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Vendidos:</span>
            <span className="font-medium text-red-500">{lots.filter(l => l.status === 'sold').length}</span>
          </div>
        </div>
      </Card>
    </Card>
  );
};

export default InteractiveMap;
