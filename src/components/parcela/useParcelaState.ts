import { useState, useCallback } from 'react';

export type ParcelaObjectType = 
  | 'casa_50' | 'casa_80' | 'casa_120' | 'casa_moderna'
  | 'cabana' | 'tiny_house'
  | 'piscina' | 'piscina_redonda' | 'jacuzzi'
  | 'cerco' | 'cerco_piedra' | 'entrada'
  | 'huerto' | 'invernadero' | 'jardin_zen'
  | 'arbol_pino' | 'arbol_frutal' | 'arbol_palma' | 'arbusto' | 'cesped'
  | 'quincho' | 'pergola' | 'fogata' | 'deck'
  | 'estacionamiento' | 'camino' | 'sendero'
  | 'pozo_agua' | 'panel_solar' | 'bodega'
  | 'columpio' | 'trampolin' | 'cancha';

export interface PlacedObject {
  id: string;
  type: ParcelaObjectType;
  position: [number, number, number];
  rotation: number;
  scale: number;
}

export interface ParcelaState {
  objects: PlacedObject[];
  selectedId: string | null;
}

export type CatalogCategory = 'vivienda' | 'agua' | 'cercos' | 'vegetacion' | 'outdoor' | 'infraestructura' | 'recreacion';

export interface CatalogItem {
  label: string;
  icon: string;
  description: string;
  defaultScale: number;
  category: CatalogCategory;
}

export const CATEGORY_LABELS: Record<CatalogCategory, { label: string; icon: string }> = {
  vivienda: { label: 'Vivienda', icon: '🏠' },
  agua: { label: 'Agua', icon: '💧' },
  cercos: { label: 'Cercos y Accesos', icon: '🔲' },
  vegetacion: { label: 'Vegetación', icon: '🌿' },
  outdoor: { label: 'Exterior', icon: '☀️' },
  infraestructura: { label: 'Infraestructura', icon: '⚡' },
  recreacion: { label: 'Recreación', icon: '🎯' },
};

export const OBJECT_CATALOG: Record<ParcelaObjectType, CatalogItem> = {
  // Vivienda
  casa_50: { label: 'Casa 50m²', icon: '🏠', description: 'Casa pequeña compacta', defaultScale: 1, category: 'vivienda' },
  casa_80: { label: 'Casa 80m²', icon: '🏡', description: 'Casa mediana familiar', defaultScale: 1, category: 'vivienda' },
  casa_120: { label: 'Casa 120m²', icon: '🏘️', description: 'Casa grande premium', defaultScale: 1, category: 'vivienda' },
  casa_moderna: { label: 'Casa Moderna', icon: '🏗️', description: 'Casa estilo contemporáneo', defaultScale: 1, category: 'vivienda' },
  cabana: { label: 'Cabaña', icon: '🛖', description: 'Cabaña de madera rústica', defaultScale: 1, category: 'vivienda' },
  tiny_house: { label: 'Tiny House', icon: '🏚️', description: 'Micro-vivienda eficiente', defaultScale: 1, category: 'vivienda' },
  // Agua
  piscina: { label: 'Piscina', icon: '🏊', description: 'Piscina rectangular 6x3m', defaultScale: 1, category: 'agua' },
  piscina_redonda: { label: 'Piscina Redonda', icon: '🔵', description: 'Piscina circular 4m diámetro', defaultScale: 1, category: 'agua' },
  jacuzzi: { label: 'Jacuzzi', icon: '♨️', description: 'Jacuzzi exterior 2x2m', defaultScale: 1, category: 'agua' },
  pozo_agua: { label: 'Pozo de Agua', icon: '🪣', description: 'Pozo artesanal', defaultScale: 1, category: 'agua' },
  // Cercos
  cerco: { label: 'Cerco Madera', icon: '🔲', description: 'Cerco perimetral madera', defaultScale: 1, category: 'cercos' },
  cerco_piedra: { label: 'Muro Piedra', icon: '🧱', description: 'Muro bajo de piedra', defaultScale: 1, category: 'cercos' },
  entrada: { label: 'Portón', icon: '🚪', description: 'Portón de acceso vehicular', defaultScale: 1, category: 'cercos' },
  // Vegetación
  huerto: { label: 'Huerto', icon: '🥬', description: 'Zona de cultivo orgánico', defaultScale: 1, category: 'vegetacion' },
  invernadero: { label: 'Invernadero', icon: '🏡', description: 'Invernadero túnel', defaultScale: 1, category: 'vegetacion' },
  jardin_zen: { label: 'Jardín Zen', icon: '🪨', description: 'Jardín japonés con piedras', defaultScale: 1, category: 'vegetacion' },
  arbol_pino: { label: 'Pino', icon: '🌲', description: 'Pino alto', defaultScale: 1, category: 'vegetacion' },
  arbol_frutal: { label: 'Frutal', icon: '🌳', description: 'Árbol frutal con frutos', defaultScale: 1, category: 'vegetacion' },
  arbol_palma: { label: 'Palmera', icon: '🌴', description: 'Palmera tropical', defaultScale: 1, category: 'vegetacion' },
  arbusto: { label: 'Arbusto', icon: '🌿', description: 'Arbusto decorativo', defaultScale: 1, category: 'vegetacion' },
  cesped: { label: 'Césped', icon: '🟩', description: 'Zona de césped 5x5m', defaultScale: 1, category: 'vegetacion' },
  // Outdoor
  quincho: { label: 'Quincho', icon: '🏗️', description: 'Quincho con techo y parrilla', defaultScale: 1, category: 'outdoor' },
  pergola: { label: 'Pérgola', icon: '🏛️', description: 'Pérgola de madera con enredaderas', defaultScale: 1, category: 'outdoor' },
  fogata: { label: 'Fogata', icon: '🔥', description: 'Zona de fogata con asientos', defaultScale: 1, category: 'outdoor' },
  deck: { label: 'Deck', icon: '🪵', description: 'Deck de madera elevado', defaultScale: 1, category: 'outdoor' },
  // Infraestructura
  estacionamiento: { label: 'Estacionamiento', icon: '🚗', description: 'Estacionamiento 2 autos', defaultScale: 1, category: 'infraestructura' },
  camino: { label: 'Camino', icon: '🛤️', description: 'Camino vehicular de grava', defaultScale: 1, category: 'infraestructura' },
  sendero: { label: 'Sendero', icon: '🚶', description: 'Sendero peatonal', defaultScale: 1, category: 'infraestructura' },
  panel_solar: { label: 'Panel Solar', icon: '☀️', description: 'Panel solar fotovoltaico', defaultScale: 1, category: 'infraestructura' },
  bodega: { label: 'Bodega', icon: '📦', description: 'Bodega/galpón de almacenaje', defaultScale: 1, category: 'infraestructura' },
  // Recreación
  columpio: { label: 'Columpio', icon: '🎠', description: 'Set de columpios infantil', defaultScale: 1, category: 'recreacion' },
  trampolin: { label: 'Trampolín', icon: '🤸', description: 'Trampolín enterrado', defaultScale: 1, category: 'recreacion' },
  cancha: { label: 'Cancha', icon: '⚽', description: 'Cancha multiuso 10x5m', defaultScale: 1, category: 'recreacion' },
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
      // ignore
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
