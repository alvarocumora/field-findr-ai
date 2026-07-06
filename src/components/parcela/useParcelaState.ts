import { useState, useCallback, useRef } from 'react';

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
  | 'columpio' | 'trampolin' | 'cancha'
  | 'galpon_packing' | 'anden_carga' | 'camara_frio' | 'oficinas_industrial'
  | 'estacionamiento_camiones' | 'area_maniobras' | 'bascula' | 'porteria' | 'cerco_industrial'
  | 'glb_custom';

export interface PlacedObject {
  id: string;
  type: ParcelaObjectType;
  position: [number, number, number];
  rotation: number;
  scale: number;
  modelUrl?: string;
  modelName?: string;
}

export interface ParcelaState {
  objects: PlacedObject[];
  selectedId: string | null;
}

export type CatalogCategory = 'vivienda' | 'agua' | 'cercos' | 'vegetacion' | 'outdoor' | 'infraestructura' | 'recreacion' | 'industrial';

export interface CatalogItem {
  label: string;
  icon: string;
  description: string;
  defaultScale: number;
  category: CatalogCategory;
  /** Approximate bounding radius in meters for collision detection */
  boundingRadius?: number;
}

export const CATEGORY_LABELS: Record<CatalogCategory, { label: string; icon: string }> = {
  vivienda: { label: 'Vivienda', icon: '🏠' },
  agua: { label: 'Agua', icon: '💧' },
  cercos: { label: 'Cercos y Accesos', icon: '🔲' },
  vegetacion: { label: 'Vegetación', icon: '🌿' },
  outdoor: { label: 'Exterior', icon: '☀️' },
  infraestructura: { label: 'Infraestructura', icon: '⚡' },
  recreacion: { label: 'Recreación', icon: '🎯' },
  industrial: { label: 'Industrial / Packing', icon: '🏭' },
};

export const OBJECT_CATALOG: Record<ParcelaObjectType, CatalogItem> = {
  casa_50: { label: 'Casa 50m²', icon: '🏠', description: 'Casa pequeña compacta', defaultScale: 1, category: 'vivienda', boundingRadius: 2.5 },
  casa_80: { label: 'Casa 80m²', icon: '🏡', description: 'Casa mediana familiar', defaultScale: 1, category: 'vivienda', boundingRadius: 3.5 },
  casa_120: { label: 'Casa 120m²', icon: '🏘️', description: 'Casa grande premium', defaultScale: 1, category: 'vivienda', boundingRadius: 4.5 },
  casa_moderna: { label: 'Casa Moderna', icon: '🏗️', description: 'Casa estilo contemporáneo', defaultScale: 1, category: 'vivienda', boundingRadius: 4 },
  cabana: { label: 'Cabaña', icon: '🛖', description: 'Cabaña de madera rústica', defaultScale: 1, category: 'vivienda', boundingRadius: 3 },
  tiny_house: { label: 'Tiny House', icon: '🏚️', description: 'Micro-vivienda eficiente', defaultScale: 1, category: 'vivienda', boundingRadius: 2 },
  piscina: { label: 'Piscina', icon: '🏊', description: 'Piscina rectangular 6x3m', defaultScale: 1, category: 'agua', boundingRadius: 3 },
  piscina_redonda: { label: 'Piscina Redonda', icon: '🔵', description: 'Piscina circular 4m diámetro', defaultScale: 1, category: 'agua', boundingRadius: 2.5 },
  jacuzzi: { label: 'Jacuzzi', icon: '♨️', description: 'Jacuzzi exterior 2x2m', defaultScale: 1, category: 'agua', boundingRadius: 1.5 },
  pozo_agua: { label: 'Pozo de Agua', icon: '🪣', description: 'Pozo artesanal', defaultScale: 1, category: 'agua', boundingRadius: 1 },
  cerco: { label: 'Cerco Madera', icon: '🔲', description: 'Cerco perimetral madera', defaultScale: 1, category: 'cercos', boundingRadius: 3 },
  cerco_piedra: { label: 'Muro Piedra', icon: '🧱', description: 'Muro bajo de piedra', defaultScale: 1, category: 'cercos', boundingRadius: 3 },
  entrada: { label: 'Portón', icon: '🚪', description: 'Portón de acceso vehicular', defaultScale: 1, category: 'cercos', boundingRadius: 1.5 },
  huerto: { label: 'Huerto', icon: '🥬', description: 'Zona de cultivo orgánico', defaultScale: 1, category: 'vegetacion', boundingRadius: 2 },
  invernadero: { label: 'Invernadero', icon: '🏡', description: 'Invernadero túnel', defaultScale: 1, category: 'vegetacion', boundingRadius: 3 },
  jardin_zen: { label: 'Jardín Zen', icon: '🪨', description: 'Jardín japonés con piedras', defaultScale: 1, category: 'vegetacion', boundingRadius: 2.5 },
  arbol_pino: { label: 'Pino', icon: '🌲', description: 'Pino alto', defaultScale: 1, category: 'vegetacion', boundingRadius: 1 },
  arbol_frutal: { label: 'Frutal', icon: '🌳', description: 'Árbol frutal con frutos', defaultScale: 1, category: 'vegetacion', boundingRadius: 1.2 },
  arbol_palma: { label: 'Palmera', icon: '🌴', description: 'Palmera tropical', defaultScale: 1, category: 'vegetacion', boundingRadius: 1 },
  arbusto: { label: 'Arbusto', icon: '🌿', description: 'Arbusto decorativo', defaultScale: 1, category: 'vegetacion', boundingRadius: 0.6 },
  cesped: { label: 'Césped', icon: '🟩', description: 'Zona de césped 5x5m', defaultScale: 1, category: 'vegetacion', boundingRadius: 3 },
  quincho: { label: 'Quincho', icon: '🏗️', description: 'Quincho con techo y parrilla', defaultScale: 1, category: 'outdoor', boundingRadius: 3 },
  pergola: { label: 'Pérgola', icon: '🏛️', description: 'Pérgola de madera con enredaderas', defaultScale: 1, category: 'outdoor', boundingRadius: 2 },
  fogata: { label: 'Fogata', icon: '🔥', description: 'Zona de fogata con asientos', defaultScale: 1, category: 'outdoor', boundingRadius: 2 },
  deck: { label: 'Deck', icon: '🪵', description: 'Deck de madera elevado', defaultScale: 1, category: 'outdoor', boundingRadius: 2.5 },
  estacionamiento: { label: 'Estacionamiento', icon: '🚗', description: 'Estacionamiento 2 autos', defaultScale: 1, category: 'infraestructura', boundingRadius: 3 },
  camino: { label: 'Camino', icon: '🛤️', description: 'Camino vehicular de grava', defaultScale: 1, category: 'infraestructura', boundingRadius: 2 },
  sendero: { label: 'Sendero', icon: '🚶', description: 'Sendero peatonal', defaultScale: 1, category: 'infraestructura', boundingRadius: 1 },
  panel_solar: { label: 'Panel Solar', icon: '☀️', description: 'Panel solar fotovoltaico', defaultScale: 1, category: 'infraestructura', boundingRadius: 1.5 },
  bodega: { label: 'Bodega', icon: '📦', description: 'Bodega/galpón de almacenaje', defaultScale: 1, category: 'infraestructura', boundingRadius: 2.5 },
  columpio: { label: 'Columpio', icon: '🎠', description: 'Set de columpios infantil', defaultScale: 1, category: 'recreacion', boundingRadius: 2 },
  trampolin: { label: 'Trampolín', icon: '🤸', description: 'Trampolín enterrado', defaultScale: 1, category: 'recreacion', boundingRadius: 2 },
  cancha: { label: 'Cancha', icon: '⚽', description: 'Cancha multiuso 10x5m', defaultScale: 1, category: 'recreacion', boundingRadius: 6 },
  galpon_packing: { label: 'Galpón Packing', icon: '🏭', description: 'Galpón industrial 40x20x8m', defaultScale: 1, category: 'industrial', boundingRadius: 22 },
  anden_carga: { label: 'Andén Carga', icon: '🚛', description: 'Plataforma de carga elevada', defaultScale: 1, category: 'industrial', boundingRadius: 8 },
  camara_frio: { label: 'Cámara Frío', icon: '❄️', description: 'Cámara refrigerada 15x10x6m', defaultScale: 1, category: 'industrial', boundingRadius: 9 },
  oficinas_industrial: { label: 'Oficinas', icon: '🏢', description: 'Módulo administrativo 2 pisos', defaultScale: 1, category: 'industrial', boundingRadius: 7 },
  estacionamiento_camiones: { label: 'Estac. Camiones', icon: '🅿️', description: 'Pavimento para semirremolques', defaultScale: 1, category: 'industrial', boundingRadius: 12 },
  area_maniobras: { label: 'Área Maniobras', icon: '🔄', description: 'Radio de giro semirremolque', defaultScale: 1, category: 'industrial', boundingRadius: 10 },
  bascula: { label: 'Báscula', icon: '⚖️', description: 'Balanza camionera 18m', defaultScale: 1, category: 'industrial', boundingRadius: 10 },
  porteria: { label: 'Portería', icon: '🛂', description: 'Control de acceso con barrera', defaultScale: 1, category: 'industrial', boundingRadius: 3 },
  cerco_industrial: { label: 'Cerco Industrial', icon: '🚧', description: 'Malla acmafor 2.5m', defaultScale: 1, category: 'industrial', boundingRadius: 5 },
  glb_custom: { label: 'Modelo GLB', icon: '📦', description: 'Modelo 3D importado', defaultScale: 1, category: 'vivienda', boundingRadius: 2 },
};

const GRID_SIZE = 0.5; // 50cm snap grid
const MAX_UNDO = 50;

function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function checkCollision(
  objects: PlacedObject[],
  newObj: PlacedObject,
  excludeId?: string
): boolean {
  for (const obj of objects) {
    if (obj.id === excludeId) continue;
    const r1 = (OBJECT_CATALOG[newObj.type].boundingRadius || 1.5) * newObj.scale;
    const r2 = (OBJECT_CATALOG[obj.type].boundingRadius || 1.5) * obj.scale;
    const dx = newObj.position[0] - obj.position[0];
    const dz = newObj.position[2] - obj.position[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < (r1 + r2) * 0.6) return true; // 60% overlap threshold
  }
  return false;
}

export type ViewMode = 'orbit' | 'top' | 'pedestrian';
export type TransformMode = 'translate' | 'rotate' | 'scale';

export const useParcelaState = () => {
  const [state, setState] = useState<ParcelaState>({
    objects: [],
    selectedId: null,
  });

  const [snapEnabled, setSnapEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('orbit');
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const [solarHour, setSolarHour] = useState(14); // 0-24
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number, number][]>([]);

  // Undo/Redo stacks
  const undoStack = useRef<PlacedObject[][]>([]);
  const redoStack = useRef<PlacedObject[][]>([]);

  const pushUndo = useCallback((objects: PlacedObject[]) => {
    undoStack.current.push(JSON.parse(JSON.stringify(objects)));
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();
    redoStack.current = [];
  }, []);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    setState(prev => {
      redoStack.current.push(JSON.parse(JSON.stringify(prev.objects)));
      const restored = undoStack.current.pop()!;
      return { objects: restored, selectedId: null };
    });
  }, []);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    setState(prev => {
      undoStack.current.push(JSON.parse(JSON.stringify(prev.objects)));
      const restored = redoStack.current.pop()!;
      return { objects: restored, selectedId: null };
    });
  }, []);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  const addObject = useCallback((type: ParcelaObjectType, position?: [number, number, number], extras?: { modelUrl?: string; modelName?: string }): string => {
    const pos: [number, number, number] = position
      ? (snapEnabled
          ? [snapToGrid(position[0], GRID_SIZE), position[1], snapToGrid(position[2], GRID_SIZE)]
          : position)
      : [0, 0.01, 0];

    const newObj: PlacedObject = {
      id: `${type}_${Date.now()}`,
      type,
      position: pos,
      rotation: 0,
      scale: OBJECT_CATALOG[type].defaultScale,
      ...extras,
    };

    setState(prev => {
      pushUndo(prev.objects);
      return { ...prev, objects: [...prev.objects, newObj], selectedId: newObj.id };
    });
    return newObj.id;
  }, [snapEnabled, pushUndo]);

  const selectObject = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedId: id }));
  }, []);

  const updateObject = useCallback((id: string, updates: Partial<PlacedObject>) => {
    setState(prev => {
      const obj = prev.objects.find(o => o.id === id);
      if (!obj) return prev;
      pushUndo(prev.objects);
      let merged = { ...obj, ...updates };
      // Collision-aware: a position change that overlaps another object is
      // rejected (rotation/scale from the same commit are still applied). This
      // covers the transform gizmo, which committed straight through
      // updateObject and previously ignored collisions entirely.
      if (updates.position && checkCollision(prev.objects, merged, id)) {
        merged = { ...merged, position: obj.position };
      }
      return {
        ...prev,
        objects: prev.objects.map(o => o.id === id ? merged : o),
      };
    });
  }, [pushUndo]);

  const moveObject = useCallback((id: string, newPosition: [number, number, number]) => {
    const pos: [number, number, number] = snapEnabled
      ? [snapToGrid(newPosition[0], GRID_SIZE), newPosition[1], snapToGrid(newPosition[2], GRID_SIZE)]
      : newPosition;

    setState(prev => {
      const obj = prev.objects.find(o => o.id === id);
      if (!obj) return prev;
      const movedObj = { ...obj, position: pos };
      const hasCollision = checkCollision(prev.objects, movedObj, id);
      if (hasCollision) return prev; // Block move if collision
      return {
        ...prev,
        objects: prev.objects.map(o => o.id === id ? movedObj : o),
      };
    });
  }, [snapEnabled]);

  const removeObject = useCallback((id: string) => {
    setState(prev => {
      pushUndo(prev.objects);
      return {
        ...prev,
        objects: prev.objects.filter(o => o.id !== id),
        selectedId: prev.selectedId === id ? null : prev.selectedId,
      };
    });
  }, [pushUndo]);

  const rotateSelected = useCallback((delta: number) => {
    setState(prev => {
      if (!prev.selectedId) return prev;
      pushUndo(prev.objects);
      return {
        ...prev,
        objects: prev.objects.map(o =>
          o.id === prev.selectedId ? { ...o, rotation: o.rotation + delta } : o
        ),
      };
    });
  }, [pushUndo]);

  const scaleSelected = useCallback((delta: number) => {
    setState(prev => {
      if (!prev.selectedId) return prev;
      pushUndo(prev.objects);
      return {
        ...prev,
        objects: prev.objects.map(o =>
          o.id === prev.selectedId
            ? { ...o, scale: Math.max(0.3, Math.min(3, o.scale + delta)) }
            : o
        ),
      };
    });
  }, [pushUndo]);

  const resetAll = useCallback(() => {
    setState(prev => {
      pushUndo(prev.objects);
      return { objects: [], selectedId: null };
    });
  }, [pushUndo]);

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

  const addMeasurePoint = useCallback((point: [number, number, number]) => {
    setMeasurePoints(prev => {
      if (prev.length >= 2) return [point]; // Reset after 2 points
      return [...prev, point];
    });
  }, []);

  const clearMeasure = useCallback(() => {
    setMeasurePoints([]);
  }, []);

  return {
    ...state,
    addObject,
    selectObject,
    updateObject,
    moveObject,
    removeObject,
    rotateSelected,
    scaleSelected,
    resetAll,
    toJSON,
    loadFromJSON,
    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,
    // Snap
    snapEnabled,
    setSnapEnabled,
    // View
    viewMode,
    setViewMode,
    // Transform mode
    transformMode,
    setTransformMode,
    // Solar
    solarHour,
    setSolarHour,
    // Measure
    measureMode,
    setMeasureMode,
    measurePoints,
    addMeasurePoint,
    clearMeasure,
  };
};
