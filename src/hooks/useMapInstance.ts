import { useEffect, useRef, useState, useCallback, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { MapMode } from '@/components/map/MapModeSelector';

export interface MapBoundsData {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface UseMapInstanceOptions {
  showDrawTools?: boolean;
  onBoundsChange?: (bounds: MapBoundsData) => void;
  onPolygonDrawn?: (polygon: number[][], area: number) => void;
}

const calculatePolygonArea = (coordinates: number[][]): number => {
  if (coordinates.length < 3) return 0;
  let area = 0;
  const n = coordinates.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const x1 = coordinates[i][0] * 111320 * Math.cos(coordinates[i][1] * Math.PI / 180);
    const y1 = coordinates[i][1] * 110540;
    const x2 = coordinates[j][0] * 111320 * Math.cos(coordinates[j][1] * Math.PI / 180);
    const y2 = coordinates[j][1] * 110540;
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
};

const MAP_STYLES: Record<MapMode, string> = {
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  streets: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  '3d': 'mapbox://styles/mapbox/outdoors-v12',
};

export function useMapInstance(
  containerRef: MutableRefObject<HTMLDivElement | null>,
  options: UseMapInstanceOptions = {}
) {
  const { showDrawTools = true, onBoundsChange, onPolygonDrawn } = options;

  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const layerTooltipRef = useRef<mapboxgl.Popup | null>(null);
  const styleLoadedRef = useRef(false);

  const showDrawToolsRef = useRef(showDrawTools);
  useEffect(() => { showDrawToolsRef.current = showDrawTools; });

  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnArea, setDrawnArea] = useState<number | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>('satellite');
  const mapModeRef = useRef<MapMode>('satellite');
  useEffect(() => { mapModeRef.current = mapMode; }, [mapMode]);

  const { token: mapboxToken, loading: tokenLoading, error: tokenError } = useMapboxToken();

  // ── Initialization ──
  useEffect(() => {
    if (!containerRef.current || tokenLoading || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const currentMode = mapModeRef.current;
    const styleUrl = MAP_STYLES[currentMode];

    map.current = new mapboxgl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [-70.6693, -33.4489],
      zoom: 6,
      pitch: currentMode === '3d' ? 50 : 0,
      bearing: currentMode === '3d' ? -17 : 0,
      antialias: true,
    });

    popupRef.current = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      anchor: 'bottom',
      offset: 15,
      maxWidth: '230px',
      className: 'enhanced-map-popup-container satellite-popup',
    });

    layerTooltipRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 15,
      maxWidth: '320px',
      className: 'layer-tooltip-popup',
    });

    if (showDrawToolsRef.current) {
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {},
        defaultMode: 'simple_select',
        styles: [
          {
            id: 'gl-draw-polygon-fill',
            type: 'fill',
            filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            paint: { 'fill-color': '#10b981', 'fill-opacity': 0.2 },
          },
          {
            id: 'gl-draw-polygon-stroke',
            type: 'line',
            filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            paint: { 'line-color': '#10b981', 'line-width': 3, 'line-dasharray': [2, 2] },
          },
          {
            id: 'gl-draw-point',
            type: 'circle',
            filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
            paint: { 'circle-radius': 6, 'circle-color': '#10b981', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
          },
        ],
      });
      map.current.addControl(draw.current);
    }

    map.current.on('load', () => {
      styleLoadedRef.current = true;

      if (currentMode === '3d' && map.current) {
        map.current.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
        map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
        map.current.addLayer({
          id: 'sky',
          type: 'sky',
          paint: { 'sky-type': 'atmosphere', 'sky-atmosphere-sun': [0, 75], 'sky-atmosphere-sun-intensity': 15 },
        });
      }

      setTimeout(() => { map.current?.resize(); }, 100);
      setIsLoading(false);
    });

    let boundsDebounce: ReturnType<typeof setTimeout>;
    map.current.on('moveend', () => {
      clearTimeout(boundsDebounce);
      boundsDebounce = setTimeout(() => {
        if (!map.current) return;
        const b = map.current.getBounds();
        if (b) {
          onBoundsChange?.({
            north: b.getNorth(),
            south: b.getSouth(),
            east: b.getEast(),
            west: b.getWest(),
          });
        }
      }, 200);
    });

    if (showDrawToolsRef.current) {
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
      styleLoadedRef.current = false;
      popupRef.current?.remove();
      layerTooltipRef.current?.remove();
      if (draw.current && map.current) {
        try { map.current.removeControl(draw.current); } catch { /* noop */ }
      }
      map.current?.remove();
      map.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxToken, tokenLoading]);

  // ── Style change ──
  const changeMapMode = useCallback((mode: MapMode) => {
    setMapMode(mode);
    if (!map.current) return;

    map.current.setStyle(MAP_STYLES[mode]);

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
  }, []);

  // ── Control handlers ──
  const handleZoomIn = useCallback(() => map.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => map.current?.zoomOut(), []);

  const handleLocate = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.current?.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 12,
            pitch: mapModeRef.current === '3d' ? 50 : 0,
          });
        },
        () => console.warn('Geolocation denied')
      );
    }
  }, []);

  const handleFitAll = useCallback((listings: { lat: number | null; lng: number | null }[]) => {
    const valid = listings.filter(l => l.lat && l.lng);
    if (valid.length > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      valid.forEach(l => bounds.extend([l.lng!, l.lat!]));
      map.current.fitBounds(bounds, {
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
        maxZoom: valid.length === 1 ? 13 : 11,
        duration: 800,
      });
    }
  }, []);

  const handleResetNorth = useCallback(() => {
    map.current?.easeTo({ bearing: 0, duration: 500 });
  }, []);

  const handleResetView = useCallback((listings: { lat: number | null; lng: number | null }[]) => {
    map.current?.easeTo({
      pitch: mapModeRef.current === '3d' ? 50 : 0,
      bearing: mapModeRef.current === '3d' ? -17 : 0,
      duration: 800,
    });
    handleFitAll(listings);
  }, [handleFitAll]);

  const startDrawing = useCallback(() => {
    if (draw.current) {
      draw.current.changeMode('draw_polygon');
      setIsDrawing(true);
    }
  }, []);

  const clearDrawing = useCallback(() => {
    if (draw.current) {
      draw.current.deleteAll();
      setDrawnArea(null);
      setIsDrawing(false);
    }
  }, []);

  return {
    map,
    draw,
    popupRef,
    layerTooltipRef,
    styleLoadedRef,
    isLoading,
    isDrawing,
    drawnArea,
    mapMode,
    tokenLoading,
    tokenError,
    changeMapMode,
    handleZoomIn,
    handleZoomOut,
    handleLocate,
    handleFitAll,
    handleResetNorth,
    handleResetView,
    startDrawing,
    clearDrawing,
  };
}
