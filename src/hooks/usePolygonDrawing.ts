import { useRef, useState, useCallback, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  validatePolygonShape, 
  calculateCentroid, 
  simplifyPolygon,
  formatPolygonArea 
} from '@/lib/kmz/polygonValidator';

export type DrawingMode = 'draw' | 'edit' | 'delete' | null;

interface Lot {
  id: string;
  lot_number: string;
  area: number;
  polygon?: [number, number][] | null;
}

interface UsePolygonDrawingProps {
  map: mapboxgl.Map | null;
  lots: Lot[];
  onPolygonSaved?: (lotId: string, polygon: [number, number][]) => void;
  onLotsUpdated?: () => void;
}

interface DrawnPolygon {
  id: string;
  coordinates: [number, number][];
  area: number;
}

export const usePolygonDrawing = ({
  map,
  lots,
  onPolygonSaved,
  onLotsUpdated,
}: UsePolygonDrawingProps) => {
  const draw = useRef<MapboxDraw | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentMode, setCurrentMode] = useState<DrawingMode>(null);
  const [currentPolygon, setCurrentPolygon] = useState<DrawnPolygon | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize MapboxDraw
  const initializeDraw = useCallback(() => {
    if (!map || draw.current) return;

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      defaultMode: 'simple_select',
      styles: [
        // Polygon fill - active
        {
          id: 'gl-draw-polygon-fill-active',
          type: 'fill',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
          paint: {
            'fill-color': '#10b981',
            'fill-opacity': 0.3,
          },
        },
        // Polygon fill - inactive
        {
          id: 'gl-draw-polygon-fill-inactive',
          type: 'fill',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.2,
          },
        },
        // Polygon outline - active
        {
          id: 'gl-draw-polygon-stroke-active',
          type: 'line',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
          paint: {
            'line-color': '#10b981',
            'line-width': 3,
          },
        },
        // Polygon outline - inactive
        {
          id: 'gl-draw-polygon-stroke-inactive',
          type: 'line',
          filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
          paint: {
            'line-color': '#3b82f6',
            'line-width': 2,
          },
        },
        // Vertices
        {
          id: 'gl-draw-polygon-vertex',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
          paint: {
            'circle-radius': 6,
            'circle-color': '#ffffff',
            'circle-stroke-color': '#10b981',
            'circle-stroke-width': 2,
          },
        },
        // Midpoints
        {
          id: 'gl-draw-polygon-midpoint',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'midpoint'], ['==', '$type', 'Point']],
          paint: {
            'circle-radius': 4,
            'circle-color': '#3b82f6',
          },
        },
        // Line (while drawing)
        {
          id: 'gl-draw-line',
          type: 'line',
          filter: ['all', ['==', '$type', 'LineString']],
          paint: {
            'line-color': '#10b981',
            'line-width': 2,
            'line-dasharray': [2, 2],
          },
        },
        // Points
        {
          id: 'gl-draw-point',
          type: 'circle',
          filter: ['all', ['==', '$type', 'Point'], ['!=', 'meta', 'midpoint'], ['!=', 'meta', 'vertex']],
          paint: {
            'circle-radius': 5,
            'circle-color': '#10b981',
          },
        },
      ],
    });

    map.addControl(draw.current, 'top-left');

    // Listen for draw events
    map.on('draw.create', handleDrawCreate);
    map.on('draw.update', handleDrawUpdate);
    map.on('draw.delete', handleDrawDelete);
    map.on('draw.selectionchange', handleSelectionChange);

    console.log('MapboxDraw initialized');
  }, [map]);

  // Handle polygon creation
  const handleDrawCreate = useCallback((e: any) => {
    const feature = e.features[0];
    if (!feature || feature.geometry.type !== 'Polygon') return;

    const coordinates = feature.geometry.coordinates[0] as [number, number][];
    const validation = validatePolygonShape(coordinates);

    if (!validation.isValid) {
      toast.error(validation.errors.join('. '));
      draw.current?.delete(feature.id);
      return;
    }

    if (validation.warnings.length > 0) {
      toast.warning(validation.warnings.join('. '));
    }

    setCurrentPolygon({
      id: feature.id,
      coordinates: validation.normalized || coordinates,
      area: validation.area,
    });

    toast.success(`Polígono creado: ${formatPolygonArea(validation.area)}`);
  }, []);

  // Handle polygon update
  const handleDrawUpdate = useCallback((e: any) => {
    const feature = e.features[0];
    if (!feature || feature.geometry.type !== 'Polygon') return;

    const coordinates = feature.geometry.coordinates[0] as [number, number][];
    const validation = validatePolygonShape(coordinates);

    setCurrentPolygon({
      id: feature.id,
      coordinates: validation.normalized || coordinates,
      area: validation.area,
    });
  }, []);

  // Handle polygon deletion
  const handleDrawDelete = useCallback(() => {
    setCurrentPolygon(null);
    setSelectedLotId(null);
  }, []);

  // Handle selection change
  const handleSelectionChange = useCallback((e: any) => {
    if (e.features.length > 0) {
      const feature = e.features[0];
      if (feature.geometry.type === 'Polygon') {
        const coordinates = feature.geometry.coordinates[0] as [number, number][];
        const validation = validatePolygonShape(coordinates);
        setCurrentPolygon({
          id: feature.id,
          coordinates,
          area: validation.area,
        });
      }
    }
  }, []);

  // Start drawing mode
  const startDrawing = useCallback(() => {
    if (!draw.current || !map) return;

    initializeDraw();
    
    setIsDrawingMode(true);
    setCurrentMode('draw');
    draw.current.changeMode('draw_polygon');
    
    toast.info('Haz clic en el mapa para dibujar los vértices del lote. Doble clic para cerrar.');
  }, [map, initializeDraw]);

  // Start edit mode
  const startEditing = useCallback(() => {
    if (!draw.current) return;
    
    setCurrentMode('edit');
    draw.current.changeMode('simple_select');
    
    toast.info('Selecciona un polígono para editarlo');
  }, []);

  // Start delete mode
  const startDeleting = useCallback(() => {
    if (!draw.current) return;
    
    setCurrentMode('delete');
    draw.current.changeMode('simple_select');
    
    toast.info('Selecciona un polígono para eliminarlo');
  }, []);

  // Cancel drawing
  const cancelDrawing = useCallback(() => {
    if (!draw.current) return;

    draw.current.deleteAll();
    draw.current.changeMode('simple_select');
    
    setCurrentPolygon(null);
    setSelectedLotId(null);
    setCurrentMode(null);
  }, []);

  // Exit drawing mode completely
  const exitDrawingMode = useCallback(() => {
    if (draw.current && map) {
      try {
        draw.current.deleteAll();
        map.removeControl(draw.current);
      } catch (e) {
        console.warn('Error removing draw control:', e);
      }
      draw.current = null;
    }

    setIsDrawingMode(false);
    setCurrentMode(null);
    setCurrentPolygon(null);
    setSelectedLotId(null);
  }, [map]);

  // Save polygon to lot
  const savePolygonToLot = useCallback(async (lotId: string) => {
    if (!currentPolygon || !lotId) {
      toast.error('Selecciona un lote para asignar el polígono');
      return;
    }

    setIsSaving(true);
    try {
      const simplified = simplifyPolygon(currentPolygon.coordinates);
      const centroid = calculateCentroid(simplified);
      const validation = validatePolygonShape(simplified);

      const { error } = await supabase
        .from('lots')
        .update({
          polygon: simplified,
          latitude: centroid[1],
          longitude: centroid[0],
          area: validation.area,
        })
        .eq('id', lotId);

      if (error) throw error;

      toast.success(`Polígono guardado en Lote ${lots.find(l => l.id === lotId)?.lot_number}`);
      
      // Clear current drawing
      draw.current?.delete(currentPolygon.id);
      setCurrentPolygon(null);
      setSelectedLotId(null);

      onPolygonSaved?.(lotId, simplified);
      onLotsUpdated?.();

    } catch (error) {
      console.error('Error saving polygon:', error);
      toast.error('Error al guardar el polígono');
    } finally {
      setIsSaving(false);
    }
  }, [currentPolygon, lots, onPolygonSaved, onLotsUpdated]);

  // Delete polygon from lot
  const deletePolygonFromLot = useCallback(async (lotId: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('lots')
        .update({
          polygon: null,
          latitude: null,
          longitude: null,
        })
        .eq('id', lotId);

      if (error) throw error;

      toast.success('Polígono eliminado del lote');
      onLotsUpdated?.();

    } catch (error) {
      console.error('Error deleting polygon:', error);
      toast.error('Error al eliminar el polígono');
    } finally {
      setIsSaving(false);
    }
  }, [onLotsUpdated]);

  // Load existing polygon for editing
  const loadPolygonForEditing = useCallback((lot: Lot) => {
    if (!draw.current || !lot.polygon || lot.polygon.length < 3) return;

    // Add the polygon to draw
    const feature: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: 'Feature',
      id: `lot-${lot.id}`,
      properties: {
        lotId: lot.id,
        lotNumber: lot.lot_number,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [lot.polygon],
      },
    };

    draw.current.add(feature);
    draw.current.changeMode('direct_select', { featureId: `lot-${lot.id}` });
    
    setSelectedLotId(lot.id);
    setCurrentMode('edit');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (draw.current && map) {
        try {
          map.off('draw.create', handleDrawCreate);
          map.off('draw.update', handleDrawUpdate);
          map.off('draw.delete', handleDrawDelete);
          map.off('draw.selectionchange', handleSelectionChange);
          map.removeControl(draw.current);
        } catch (e) {
          console.warn('Cleanup error:', e);
        }
      }
    };
  }, [map, handleDrawCreate, handleDrawUpdate, handleDrawDelete, handleSelectionChange]);

  return {
    isDrawingMode,
    currentMode,
    currentPolygon,
    selectedLotId,
    isSaving,
    setSelectedLotId,
    initializeDraw,
    startDrawing,
    startEditing,
    startDeleting,
    cancelDrawing,
    exitDrawingMode,
    savePolygonToLot,
    deletePolygonFromLot,
    loadPolygonForEditing,
  };
};
