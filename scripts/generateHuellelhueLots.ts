/**
 * Huellelhue Lote B — Generador de lotes usando motor interno autoSubdivide.
 * Perímetro trazado desde plano FUNDÓ HUEYELHUE (Osorno) sobre imagen satelital:
 *  - Norte: playa de la barra (sandspit, desembocadura)
 *  - Sur: Punta Cholihueco
 *  - Oeste: línea de costa Pacífico
 *  - Este: límite interior con Lote A (cordón boscoso)
 *
 * Run:  bun scripts/generateHuellelhueLots.ts
 */

import { writeFileSync } from 'node:fs';
import { autoSubdivide, localToGeo } from '../src/lib/subdivision/autoSubdivide';

// ────────────────────────────────────────────────────────────────────────────
// PERÍMETRO REAL LOTE B (WGS84 lng,lat) — trazado manual del plano satelital
// ────────────────────────────────────────────────────────────────────────────
const PERIMETER_LNGLAT: [number, number][] = [
  [-73.8175, -40.7158], // NW · inicio barra de arena (playa La Barra)
  [-73.8138, -40.7155], // N  · borde estuario
  [-73.8095, -40.7162], // NE alto · entra al bosque
  [-73.8048, -40.7178], // E superior · línea de loma
  [-73.8025, -40.7205], // E medio · ridge interior
  [-73.8020, -40.7242], // E inferior · vaguada
  [-73.8045, -40.7278], // SE · acerca a costa rocosa
  [-73.8092, -40.7298], // S · Punta Cholihueco
  [-73.8138, -40.7295], // SW · acantilados
  [-73.8172, -40.7268], // W inferior · costa
  [-73.8188, -40.7228], // W medio · línea costa
  [-73.8190, -40.7195], // W superior · bahía
  [-73.8182, -40.7172], // retorno barra
];

// Centro geográfico (centroide aproximado)
const CENTER_LNG = -73.8108;
const CENTER_LAT = -40.7227;

// Conversión geo → metros locales (proyección equirectangular local)
function geoToLocal(
  lngLat: [number, number],
  centerLng: number,
  centerLat: number
): [number, number] {
  const mPerDegLng = 111320 * Math.cos((centerLat * Math.PI) / 180);
  const mPerDegLat = 110540;
  return [
    (lngLat[0] - centerLng) * mPerDegLng,
    (lngLat[1] - centerLat) * mPerDegLat,
  ];
}

const perimeterLocal = PERIMETER_LNGLAT.map((p) =>
  geoToLocal(p, CENTER_LNG, CENTER_LAT)
);

// ────────────────────────────────────────────────────────────────────────────
// 3 SUB-ZONAS por banda este-oeste (línea 1 ocean front, 2 forest ocean, 3 bosque vivo)
// Generamos cada banda recortándola al perímetro
// ────────────────────────────────────────────────────────────────────────────

function bandPolygon(westX: number, eastX: number): [number, number][] {
  // intersección sencilla: tomamos perímetro y lo clampeamos por X
  const result: [number, number][] = [];
  for (const [x, y] of perimeterLocal) {
    result.push([Math.max(westX, Math.min(eastX, x)), y]);
  }
  return result;
}

const bounds = (() => {
  let minX = Infinity, maxX = -Infinity;
  for (const [x] of perimeterLocal) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
  }
  return { minX, maxX };
})();

const width = bounds.maxX - bounds.minX;
const band1West = bounds.minX;
const band1East = bounds.minX + width * 0.22;          // 22% costa
const band2East = bounds.minX + width * 0.55;          // 33% intermedio
const band3East = bounds.maxX;                          // 45% interior

const BANDS = [
  {
    name: 'ocean_front',
    polygon: bandPolygon(band1West, band1East),
    targetLots: 32,
    minLotArea: 10000, // 1 ha
    minFrontage: 80,
  },
  {
    name: 'forest_ocean',
    polygon: bandPolygon(band1East, band2East),
    targetLots: 56,
    minLotArea: 5000,
    minFrontage: 60,
  },
  {
    name: 'bosque_vivo',
    polygon: bandPolygon(band2East, band3East),
    targetLots: 90,
    minLotArea: 5000,
    minFrontage: 60,
  },
];

const CATEGORY_META: Record<string, any> = {
  ocean_front: {
    line: 1,
    label: 'Ocean Front',
    ocean_exposure: 'Directa · 100%',
    privacy: 'Máxima',
    conservation: '75% nativo intocado',
    architecture: 'Cabaña costera oculta · Japandi coastal',
  },
  forest_ocean: {
    line: 2,
    label: 'Forest Ocean',
    ocean_exposure: 'Vista filtrada',
    privacy: 'Alta',
    conservation: '70% nativo',
    architecture: 'Refugio elevado · madera nativa',
  },
  bosque_vivo: {
    line: 3,
    label: 'Bosque Vivo',
    ocean_exposure: 'Indirecta · sonido',
    privacy: 'Total inmersión',
    conservation: '80% nativo',
    architecture: 'Cabaña dosel · pasarela',
  },
};

// ────────────────────────────────────────────────────────────────────────────
// EJECUTAR MOTOR INTERNO POR BANDA
// ────────────────────────────────────────────────────────────────────────────

type Feature = {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: { type: 'Polygon'; coordinates: [number, number][][] };
};

const allFeatures: Feature[] = [];

for (const band of BANDS) {
  const result = autoSubdivide(band.polygon, {
    minLotArea: band.minLotArea,
    roadPercentage: 8,
    greenPercentage: 5,
    minFrontage: band.minFrontage,
    roadWidth: 8,
    targetLots: band.targetLots,
  });
  const meta = CATEGORY_META[band.name];
  result.lots.forEach((lot, idx) => {
    const geo = localToGeo(lot.polygon, CENTER_LNG, CENTER_LAT);
    // cerrar anillo
    if (
      geo[0][0] !== geo[geo.length - 1][0] ||
      geo[0][1] !== geo[geo.length - 1][1]
    ) {
      geo.push(geo[0]);
    }
    allFeatures.push({
      type: 'Feature',
      properties: {
        id: `L${meta.line}-${String(idx + 1).padStart(2, '0')}`,
        line: meta.line,
        name: `${meta.label} ${String(idx + 1).padStart(2, '0')}`,
        category: band.name,
        area_ha: Math.round((lot.area / 10000) * 100) / 100,
        ocean_exposure: meta.ocean_exposure,
        privacy: meta.privacy,
        conservation: meta.conservation,
        architecture: meta.architecture,
      },
      geometry: { type: 'Polygon', coordinates: [geo] },
    });
  });
  console.log(`✓ ${band.name}: ${result.lots.length} lotes (target ${band.targetLots})`);
}

// ────────────────────────────────────────────────────────────────────────────
// MACROLOTES (5 zonas operativas en el sector interior NE)
// ────────────────────────────────────────────────────────────────────────────
const MACROS = [
  { id: 'M-ECO', name: 'Eco Lodge', category: 'eco_lodge', area: 12 },
  { id: 'M-WEL', name: 'Wellness Center', category: 'wellness', area: 8 },
  { id: 'M-GLA', name: 'Glamping Forest', category: 'glamping', area: 18 },
  { id: 'M-GAS', name: 'Gastronomy', category: 'gastronomy', area: 6 },
  { id: 'M-RES', name: 'Research Station', category: 'research', area: 10 },
];

const macroBaseEast = bounds.maxX - width * 0.18;
let macroY = -800;
MACROS.forEach((m, i) => {
  const side = Math.sqrt(m.area * 10000); // m
  const x1 = macroBaseEast - side;
  const x2 = macroBaseEast;
  const y1 = macroY;
  const y2 = macroY + side;
  macroY = y2 + 40;
  const local: [number, number][] = [
    [x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1],
  ];
  const geo = localToGeo(local, CENTER_LNG, CENTER_LAT);
  allFeatures.push({
    type: 'Feature',
    properties: {
      id: m.id,
      line: 'macro',
      name: m.name,
      category: m.category,
      area_ha: m.area,
      ocean_exposure: 'N/A',
      privacy: 'Operativo',
      conservation: '60% nativo',
      architecture: 'Equipamiento programático · bajo impacto',
    },
    geometry: { type: 'Polygon', coordinates: [geo] },
  });
});

// ────────────────────────────────────────────────────────────────────────────
// RESERVA NÚCLEO — interior alto E/SE (250 ha intocadas)
// Sector E del perímetro
// ────────────────────────────────────────────────────────────────────────────
const reserveLocal: [number, number][] = [];
for (const [x, y] of perimeterLocal) {
  if (x > bounds.minX + width * 0.55) reserveLocal.push([x, y]);
}
// agregar cierre por banda interior
reserveLocal.push([bounds.minX + width * 0.55, reserveLocal[reserveLocal.length - 1][1]]);
reserveLocal.push([bounds.minX + width * 0.55, reserveLocal[0][1]]);

const reserveGeo = localToGeo(reserveLocal, CENTER_LNG, CENTER_LAT);
reserveGeo.push(reserveGeo[0]);

allFeatures.push({
  type: 'Feature',
  properties: {
    id: 'CORE',
    line: 'conservation',
    name: 'Reserva Núcleo',
    category: 'conservation_core',
    area_ha: 250,
    ocean_exposure: 'N/A',
    privacy: 'Intocada',
    conservation: '100% nativo · sin construcción',
    architecture: 'Sin intervención',
  },
  geometry: { type: 'Polygon', coordinates: [reserveGeo] },
});

// ────────────────────────────────────────────────────────────────────────────
// PERÍMETRO LOTE B
// ────────────────────────────────────────────────────────────────────────────
const perimeterClosed = [...PERIMETER_LNGLAT, PERIMETER_LNGLAT[0]];

const data = {
  center: [CENTER_LNG, CENTER_LAT],
  perimeter: {
    type: 'Feature',
    properties: { name: 'Lote B · Fundo Hueyelhue', area_ha: 520 },
    geometry: { type: 'Polygon', coordinates: [perimeterClosed] },
  },
  lots: allFeatures,
};

const out = `// AUTO-GENERADO por scripts/generateHuellelhueLots.ts
// Motor: src/lib/subdivision/autoSubdivide.ts
// Perímetro: trazado manual sobre plano FUNDÓ HUEYELHUE (Osorno) + satélite
// Coordenadas: WGS84 lng,lat · alineadas a línea de costa real

export const HUELLELHUE_DATA = ${JSON.stringify(data, null, 2)} as const;
`;

writeFileSync('src/pages/huellelhue/data/lots.ts', out);
console.log(`\n✓ ${allFeatures.length} features → src/pages/huellelhue/data/lots.ts`);
