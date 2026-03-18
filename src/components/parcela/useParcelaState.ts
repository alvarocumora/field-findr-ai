import { useState, useCallback } from 'react';

export type ParcelaObjectType = 
  | 'casa_50' | 'casa_80' | 'casa_120'
  | 'piscina' | 'cerco' | 'entrada'
  | 'huerto' | 'arbol_pino' | 'arbol_frutal'
  | 'quincho' | 'estacionamiento';

export interface PlacedObject {
  id: string;
  type: ParcelaObjectType;
  position: [number, number, number];
  rotation: number; // Y-axis rotation in radians
  scale: number;
}

export interface ParcelaState {
  objects: PlacedObject[];
  selectedId: string | null;
}

export const OBJECT_CATALOG: Record<ParcelaObjectType, { label: string; icon: string; description: string; defaultScale: number }> = {
  casa_50: { label: 'Casa 50m²', icon: '🏠', description: 'Casa pequeña', defaultScale: 1 },
  casa_80: { label: 'Casa 80m²', icon: '🏡', description: 'Casa mediana', defaultScale: 1 },
  casa_120: { label: 'Casa 120m²', icon: '🏘️', description: 'Casa grande', defaultScale: 1 },
  piscina: { label: 'Piscina', icon: '🏊', description: 'Piscina rectangular', defaultScale: 1 },
  cerco: { label: 'Cerco', icon: '🔲', description: 'Cerco perimetral', defaultScale: 1 },
  entrada: { label: 'Entrada', icon: '🚪', description: 'Portón de acceso', defaultScale: 1 },
  huerto: { label: 'Huerto', icon: '🌿', description: 'Zona de cultivo', defaultScale: 1 },
  arbol_pino: { label: 'Pino', icon: '🌲', description: 'Árbol conífera', defaultScale: 1 },
  arbol_frutal: { label: 'Frutal', icon: '🌳', description: 'Árbol frutal', defaultScale: 1 },
  quincho: { label: 'Quincho', icon: '🏗️', description: 'Terraza/quincho', defaultScale: 1 },
  estacionamiento: { label: 'Estacionamiento', icon: '🚗', description: 'Zona de estacionamiento', defaultScale: 1 },
};

export const useParcelaState = () => {
  const [state, setState] = useState<ParcelaState>({
    objects: [],
    selectedId: null,
  });

  const addObject = useCallback((type: ParcelaObjectType, position?: [number, number, number]) => {
    const newObj: PlacedObject = {
      id: `${type}_${Date.now()}`,
      type,
      position: position || [0, 0.01, 0],
      rotation: 0,
      scale: OBJECT_CATALOG[type].defaultScale,
    };
    setState(prev => ({ ...prev, objects: [...prev.objects, newObj], selectedId: newObj.id }));
  }, []);

  const selectObject = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedId: id }));
  }, []);

  const updateObject = useCallback((id: string, updates: Partial<PlacedObject>) => {
    setState(prev => ({
      ...prev,
      objects: prev.objects.map(o => o.id === id ? { ...o, ...updates } : o),
    }));
  }, []);

  const removeObject = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      objects: prev.objects.filter(o => o.id !== id),
      selectedId: prev.selectedId === id ? null : prev.selectedId,
    }));
  }, []);

  const rotateSelected = useCallback((delta: number) => {
    setState(prev => {
      if (!prev.selectedId) return prev;
      return {
        ...prev,
        objects: prev.objects.map(o =>
          o.id === prev.selectedId ? { ...o, rotation: o.rotation + delta } : o
        ),
      };
    });
  }, []);

  const scaleSelected = useCallback((delta: number) => {
    setState(prev => {
      if (!prev.selectedId) return prev;
      return {
        ...prev,
        objects: prev.objects.map(o =>
          o.id === prev.selectedId
            ? { ...o, scale: Math.max(0.3, Math.min(3, o.scale + delta)) }
            : o
        ),
      };
    });
  }, []);

  const resetAll = useCallback(() => {
    setState({ objects: [], selectedId: null });
  }, []);

  const toJSON = useCallback(() => {
    return JSON.stringify(state.objects);
  }, [state.objects]);

  const loadFromJSON = useCallback((json: string) => {
    try {
      const objects = JSON.parse(json) as PlacedObject[];
      setState({ objects, selectedId: null });
    } catch {
      // ignore invalid json
    }
  }, []);

  return {
    ...state,
    addObject,
    selectObject,
    updateObject,
    removeObject,
    rotateSelected,
    scaleSelected,
    resetAll,
    toJSON,
    loadFromJSON,
  };
};
