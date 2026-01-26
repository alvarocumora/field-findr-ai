import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Layers, ZoomIn, ZoomOut, Locate } from 'lucide-react';

interface MapProps {
  accessToken: string;
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string;
    coordinates: [number, number];
    title: string;
    status?: 'available' | 'reserved' | 'sold';
    price?: number;
  }>;
  onMarkerClick?: (id: string) => void;
  className?: string;
  showControls?: boolean;
}

const Map: React.FC<MapProps> = ({
  accessToken,
  center = [-70.6693, -33.4489],
  zoom = 10,
  markers = [],
  onMarkerClick,
  className = '',
  showControls = true,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');

  useEffect(() => {
    if (!mapContainer.current || !accessToken) return;

    mapboxgl.accessToken = accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle === 'streets' 
        ? 'mapbox://styles/mapbox/light-v11' 
        : 'mapbox://styles/mapbox/satellite-streets-v12',
      center,
      zoom,
      pitch: 45,
      bearing: -17.6,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(255, 255, 255)',
        'high-color': 'rgb(200, 200, 225)',
        'horizon-blend': 0.2,
      });
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, [accessToken, mapStyle]);

  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    markers.forEach((marker) => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.cssText = `
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: transform 0.2s;
        background: ${marker.status === 'available' ? '#22c55e' : marker.status === 'reserved' ? '#f59e0b' : '#ef4444'};
      `;
      el.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="${marker.status === 'available' ? '#22c55e' : marker.status === 'reserved' ? '#f59e0b' : '#ef4444'}"/></svg>`;
      
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div style="padding: 8px; min-width: 150px;">
            <h4 style="font-weight: 600; margin-bottom: 4px;">${marker.title}</h4>
            <p style="font-size: 12px; color: #666; margin-bottom: 4px;">
              ${marker.status === 'available' ? '🟢 Disponible' : marker.status === 'reserved' ? '🟡 Reservado' : '🔴 Vendido'}
            </p>
            ${marker.price ? `<p style="font-weight: 600; color: #22c55e;">$${marker.price.toLocaleString('es-CL')}</p>` : ''}
          </div>
        `);

      const mapboxMarker = new mapboxgl.Marker(el)
        .setLngLat(marker.coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onMarkerClick?.(marker.id);
      });

      markersRef.current.push(mapboxMarker);
    });
  }, [markers, onMarkerClick]);

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
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <div ref={mapContainer} className="w-full h-full min-h-[400px]" />
      
      {showControls && (
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <Button size="icon" variant="secondary" onClick={handleZoomIn} className="shadow-lg">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={handleZoomOut} className="shadow-lg">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={handleLocate} className="shadow-lg">
            <Locate className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" onClick={toggleMapStyle} className="shadow-lg">
            <Layers className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Card className="absolute bottom-4 left-4 p-3 bg-background/95 backdrop-blur-sm">
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Reservado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Vendido</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Map;
