import { useState, useCallback, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewport {
  center: [number, number];
  zoom: number;
  bounds: MapBounds | null;
}

interface UseMapViewportOptions {
  debounceMs?: number;
  onViewportChange?: (viewport: MapViewport) => void;
}

export const useMapViewport = (
  map: React.RefObject<mapboxgl.Map | null>,
  options: UseMapViewportOptions = {}
) => {
  const { debounceMs = 300, onViewportChange } = options;
  
  const [viewport, setViewport] = useState<MapViewport>({
    center: [-70.6693, -33.4489], // Santiago default
    zoom: 10,
    bounds: null,
  });
  
  const [isMoving, setIsMoving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateViewport = useCallback(() => {
    if (!map.current) return;

    const center = map.current.getCenter();
    const zoom = map.current.getZoom();
    const bounds = map.current.getBounds();

    const newViewport: MapViewport = {
      center: [center.lng, center.lat],
      zoom,
      bounds: bounds ? {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      } : null,
    };

    setViewport(newViewport);
    onViewportChange?.(newViewport);
  }, [map, onViewportChange]);

  const handleMoveStart = useCallback(() => {
    setIsMoving(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleMoveEnd = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsMoving(false);
      updateViewport();
    }, debounceMs);
  }, [debounceMs, updateViewport]);

  // Attach listeners
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance) return;

    mapInstance.on('movestart', handleMoveStart);
    mapInstance.on('moveend', handleMoveEnd);
    mapInstance.on('zoomstart', handleMoveStart);
    mapInstance.on('zoomend', handleMoveEnd);

    // Initial viewport
    if (mapInstance.isStyleLoaded()) {
      updateViewport();
    } else {
      mapInstance.once('load', updateViewport);
    }

    return () => {
      mapInstance.off('movestart', handleMoveStart);
      mapInstance.off('moveend', handleMoveEnd);
      mapInstance.off('zoomstart', handleMoveStart);
      mapInstance.off('zoomend', handleMoveEnd);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [map, handleMoveStart, handleMoveEnd, updateViewport]);

  // Fly to location
  const flyTo = useCallback((
    center: [number, number],
    zoom?: number,
    options?: { duration?: number; essential?: boolean }
  ) => {
    if (!map.current) return;

    map.current.flyTo({
      center,
      zoom: zoom ?? map.current.getZoom(),
      duration: options?.duration ?? 1500,
      essential: options?.essential ?? true,
    });
  }, [map]);

  // Fit bounds
  const fitBounds = useCallback((
    bounds: [[number, number], [number, number]],
    options?: { padding?: number; duration?: number }
  ) => {
    if (!map.current) return;

    map.current.fitBounds(bounds, {
      padding: options?.padding ?? 50,
      duration: options?.duration ?? 1500,
    });
  }, [map]);

  return {
    viewport,
    isMoving,
    flyTo,
    fitBounds,
    updateViewport,
  };
};

export default useMapViewport;
