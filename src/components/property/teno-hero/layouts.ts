/**
 * Procedural layouts for Teno hero overlay.
 * Coordinates are local meters relative to polygon centroid (matches polygonUtils).
 */
import type { PolygonBounds } from '@/lib/polygonUtils';

export type LayoutType = 'packing' | 'conjunto';

export interface LayoutBuilding {
  id: string;
  type: string;
  /** Local meters [x, y] polygon (CCW) */
  coords: [number, number][];
  color: string;
  height: number;
  label?: string;
}

export interface LayoutResult {
  buildings: LayoutBuilding[];
  legend: { color: string; label: string }[];
}

const rect = (
  cx: number,
  cy: number,
  w: number,
  h: number,
  rotDeg = 0,
): [number, number][] => {
  const r = (rotDeg * Math.PI) / 180;
  const cos = Math.cos(r), sin = Math.sin(r);
  const corners: [number, number][] = [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [w / 2, h / 2],
    [-w / 2, h / 2],
  ];
  return corners.map(([x, y]) => [cx + x * cos - y * sin, cy + x * sin + y * cos]);
};

/**
 * Packing industrial: galpones en grilla 3×3 + andén + cámaras de frío + maniobras + oficinas
 */
export function buildPackingLayout(bounds: PolygonBounds): LayoutResult {
  const buildings: LayoutBuilding[] = [];
  const inset = Math.min(bounds.spanX, bounds.spanY) * 0.08;
  const usableX = bounds.spanX - inset * 2;
  const usableY = bounds.spanY - inset * 2;
  const minX = bounds.minX + inset;
  const minY = bounds.minY + inset;

  // Diagonal angle of the polygon (Teno polygon is rotated ~30° from axis)
  // We'll align buildings with that rotation for visual realism
  const rot = -25;

  // Galpones: grilla 3×3 ocupando 70% del ancho útil y 60% del alto
  const cols = 3, rows = 3;
  const gridW = usableX * 0.55;
  const gridH = usableY * 0.5;
  const galponW = gridW / cols * 0.78;
  const galponH = gridH / rows * 0.6;
  const stepX = gridW / cols;
  const stepY = gridH / rows;
  const gridStartX = minX + usableX * 0.18;
  const gridStartY = minY + usableY * 0.25;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const cx = gridStartX + j * stepX + stepX / 2;
      const cy = gridStartY + i * stepY + stepY / 2;
      buildings.push({
        id: `galpon-${i}-${j}`,
        type: 'galpon',
        coords: rect(cx, cy, galponW, galponH, rot),
        color: '#475569',
        height: 9,
        label: `Galpón ${i * cols + j + 1}`,
      });
    }
  }

  // Andén perimetral (largo a la izquierda)
  buildings.push({
    id: 'anden-1',
    type: 'anden',
    coords: rect(
      minX + usableX * 0.05,
      minY + usableY * 0.5,
      usableX * 0.06,
      usableY * 0.55,
      rot,
    ),
    color: '#0ea5e9',
    height: 4,
    label: 'Andén de carga',
  });

  // 2 Cámaras de frío (derecha)
  buildings.push({
    id: 'camara-1',
    type: 'camara',
    coords: rect(minX + usableX * 0.85, minY + usableY * 0.32, usableX * 0.12, usableY * 0.18, rot),
    color: '#22d3ee',
    height: 11,
    label: 'Cámara de frío',
  });
  buildings.push({
    id: 'camara-2',
    type: 'camara',
    coords: rect(minX + usableX * 0.85, minY + usableY * 0.62, usableX * 0.12, usableY * 0.18, rot),
    color: '#22d3ee',
    height: 11,
    label: 'Cámara de frío',
  });

  // Oficinas (esquina inferior)
  buildings.push({
    id: 'oficinas',
    type: 'oficina',
    coords: rect(minX + usableX * 0.2, minY + usableY * 0.88, usableX * 0.18, usableY * 0.08, rot),
    color: '#f59e0b',
    height: 6,
    label: 'Oficinas',
  });

  return {
    buildings,
    legend: [
      { color: '#475569', label: 'Galpones' },
      { color: '#22d3ee', label: 'Cámaras de frío' },
      { color: '#0ea5e9', label: 'Andén' },
      { color: '#f59e0b', label: 'Oficinas' },
    ],
  };
}

/**
 * Conjunto habitacional: ~24 casas en grilla + calles + plazas
 */
export function buildConjuntoLayout(bounds: PolygonBounds): LayoutResult {
  const buildings: LayoutBuilding[] = [];
  const inset = Math.min(bounds.spanX, bounds.spanY) * 0.1;
  const usableX = bounds.spanX - inset * 2;
  const usableY = bounds.spanY - inset * 2;
  const minX = bounds.minX + inset;
  const minY = bounds.minY + inset;
  const rot = -25;

  // Casas: 2 filas × 8 columnas a cada lado de calle central
  const cols = 8;
  const casaW = usableX * 0.075;
  const casaH = usableY * 0.12;
  const stepX = usableX * 0.085;

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = minX + usableX * 0.1 + col * stepX + stepX / 2;
      const cy = minY + usableY * (row === 0 ? 0.25 : 0.7);
      buildings.push({
        id: `casa-${row}-${col}`,
        type: 'casa',
        coords: rect(cx, cy, casaW, casaH, rot),
        color: '#f97316',
        height: 5,
        label: `Casa ${row * cols + col + 1}`,
      });
    }
  }

  // Calle central
  buildings.push({
    id: 'calle-central',
    type: 'calle',
    coords: rect(minX + usableX * 0.5, minY + usableY * 0.5, usableX * 0.85, usableY * 0.06, rot),
    color: '#1e293b',
    height: 0.3,
    label: 'Vía principal',
  });

  // 2 plazas / áreas verdes
  buildings.push({
    id: 'plaza-1',
    type: 'plaza',
    coords: rect(minX + usableX * 0.2, minY + usableY * 0.92, usableX * 0.18, usableY * 0.08, rot),
    color: '#16a34a',
    height: 0.5,
    label: 'Plaza',
  });
  buildings.push({
    id: 'plaza-2',
    type: 'plaza',
    coords: rect(minX + usableX * 0.8, minY + usableY * 0.08, usableX * 0.16, usableY * 0.08, rot),
    color: '#16a34a',
    height: 0.5,
    label: 'Área verde',
  });

  // Equipamiento (sede social)
  buildings.push({
    id: 'sede',
    type: 'equipamiento',
    coords: rect(minX + usableX * 0.5, minY + usableY * 0.92, usableX * 0.14, usableY * 0.1, rot),
    color: '#a855f7',
    height: 7,
    label: 'Sede comunitaria',
  });

  return {
    buildings,
    legend: [
      { color: '#f97316', label: 'Viviendas' },
      { color: '#16a34a', label: 'Áreas verdes' },
      { color: '#a855f7', label: 'Equipamiento' },
      { color: '#1e293b', label: 'Vialidad' },
    ],
  };
}

export function buildLayout(type: LayoutType, bounds: PolygonBounds): LayoutResult {
  return type === 'packing' ? buildPackingLayout(bounds) : buildConjuntoLayout(bounds);
}
