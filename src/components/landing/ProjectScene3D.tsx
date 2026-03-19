import { useRef, useEffect, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';

interface ProjectScene3DProps {
  latitude?: number | null;
  longitude?: number | null;
}

const ProjectScene3D = ({ latitude, longitude }: ProjectScene3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const { token, loading } = useMapboxToken();

  const center = useMemo<[number, number]>(
    () => [longitude ?? -70.6693, latitude ?? -33.4489],
    [latitude, longitude]
  );

  // IntersectionObserver for lazy init
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Init Mapbox mini-map
  useEffect(() => {
    if (!isVisible || !containerRef.current || !token || loading) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center,
      zoom: 13,
      pitch: 55,
      bearing: -20,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
    });

    map.on('load', () => {
      // Add terrain for 3D relief
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      setMapReady(true);
    });

    // Slow auto-rotation
    let bearing = -20;
    let frame: number;
    const rotate = () => {
      if (map && !map._removed) {
        bearing += 0.05;
        map.jumpTo({ bearing });
        frame = requestAnimationFrame(rotate);
      }
    };
    map.on('load', () => { frame = requestAnimationFrame(rotate); });

    mapRef.current = map;

    return () => {
      cancelAnimationFrame(frame);
      map.remove();
      mapRef.current = null;
    };
  }, [isVisible, token, loading, center]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      {(!isVisible || !mapReady) && (
        <div className="absolute inset-0 bg-background grid-topo flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default ProjectScene3D;
