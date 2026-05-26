/**
 * Huellelhue Lote B — Generador de lotes alineado a costa real.
 *
 * Perímetro: cabeza de tierra al NORTE de Playa Rada de Ranú,
 * entre la barra de arena (NW) y el promontorio (SE), con la costa
 * Pacífico al SW (bearing ~ -33° desde el este).
 *
 * Las bandas se generan en frame rotado para que queden PARALELAS a la costa.
 *
 * Run:  bun scripts/generateHuellelhueLots.ts
 */

import { writeFileSync } from 'node:fs';
import { autoSubdivide, localToGeo } from '../src/lib/subdivision/autoSubdivide';

// ────────────────────────────────────────────────────────────────────────────
// PERÍMETRO REAL LOTE B (WGS84 lng,lat) — cabeza de tierra norte de Rada Ranú
// Trazado siguiendo línea de costa visible en satélite
// ────────────────────────────────────────────────────────────────────────────
const PERIMETER_LNGLAT: [number, number][] = [
  // —— línea de costa SW (de NW a SE, frente al Pacífico) ——
  [-73.8128, -40.7150], // NW · inicio barra
  [-73.8108, -40.7158], // costa
  [-73.8088, -40.7170], // costa
  [-73.8062, -40.7185], // costa Rada Ranú N
  [-73.8038, -40.7202], // costa Rada Ranú centro
  [-73.8018, -40.7218], // costa Rada Ranú S
  [-73.7995, -40.7232], // promontorio SE
  // —— borde interior NE (de SE de vuelta a NW, ~700m tierra adentro) ——
  [-73.7965, -40.7202], // ridge SE
  [-73.7988, -40.7172], // ridge E
  [-73.8018, -40.7148], // ridge NE
  [-73.8055, -40.7128], // límite N
  [-73.8095, -40.7122], // límite NW interior
  [-73.8128, -40.7150], // cierre
];

// Centro
const CENTER_LNG = -73.8055;
const CENTER_LAT = -40.7185;

// Ángulo de la costa (bearing NW→SE) → rotamos para que costa quede paralela al eje X
// vector costa: (-73.7995 - (-73.8128), -40.7232 - (-40.7150)) = (+0.0133, -0.0082)
// en metros: (~1124, -912) → atan2 = -39° del este
const COAST_ANGLE_DEG = -39;
const COAST_ANGLE_RAD = (COAST_ANGLE_DEG * Math.PI) / 180;

function geoToLocal([lng, lat]: [number, number]): [number, number] {
  const mPerDegLng = 111320 * Math.cos((CENTER_LAT * Math.PI) / 180);
  const mPerDegLat = 110540;
  return [(lng - CENTER_LNG) * mPerDegLng, (lat - CENTER_LAT) * mPerDegLat];
}

function rotate([x, y]: [number, number], angle: number): [number, number] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [x * c - y * s, x * s + y * c];
}

// Frame rotado: costa paralela al eje X (Y negativo = mar, Y positivo = interior)
const perimeterRotated = PERIMETER_LNGLAT.map((p) =>
  rotate(geoToLocal(p), -COAST_ANGLE_RAD)
);

// Bounds en frame rotado
const bounds = (() => {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of perimeterRotated) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
})();

// ────────────────────────────────────────────────────────────────────────────
// BANDAS PARALELAS A LA COSTA (offset perpendicular = eje Y)
// Banda 1 (Ocean Front) = costa, Banda 2 (Forest Ocean), Banda 3 (Bosque Vivo)
// ────────────────────────────────────────────────────────────────────────────
function bandPolygon(southY: number, northY: number): [number, number][] {
  // Clamp perimeter por Y dentro de [southY, northY]
  return perimeterRotated.map(([x, y]) => [
    x,
    Math.max(southY, Math.min(northY, y)),
  ] as [number, number]);
}

const band1S = bounds.minY;
const band1N = bounds.minY + bounds.h * 0.28; // 28% costa
const band2N = bounds.minY + bounds.h * 0.58; // +30%
const band3N = bounds.minY + bounds.h * 0.85; // +27%
const macroN = bounds.maxY;                    // interior NE

const BANDS = [
  { name: 'ocean_front',  poly: bandPolygon(band1S, band1N), targetLots: 30, minLotArea: 9000,  minFrontage: 70 },
  { name: 'forest_ocean', poly: bandPolygon(band1N, band2N), targetLots: 50, minLotArea: 6000,  minFrontage: 55 },
  { name: 'bosque_vivo',  poly: bandPolygon(band2N, band3N), targetLots: 80, minLotArea: 5500,  minFrontage: 55 },
];

const CATEGORY_META: Record<string, any> = {
  ocean_front:  { line: 1, label: 'Ocean Front',  ocean_exposure: 'Directa · 100%',   privacy: 'Máxima',          conservation: '75% nativo intocado', architecture: 'Cabaña costera oculta · Japandi coastal' },
  forest_ocean: { line: 2, label: 'Forest Ocean', ocean_exposure: 'Vista filtrada',   privacy: 'Alta',            conservation: '70% nativo',          architecture: 'Refugio elevado · madera nativa' },
  bosque_vivo:  { line: 3, label: 'Bosque Vivo',  ocean_exposure: 'Indirecta · sonido', privacy: 'Total inmersión', conservation: '80% nativo',          architecture: 'Cabaña dosel · pasarela' },
};

// ────────────────────────────────────────────────────────────────────────────
// EJECUTAR MOTOR Y ROTAR DE VUELTA
// ────────────────────────────────────────────────────────────────────────────
type Feature = { type: 'Feature'; properties: Record<string, any>; geometry: { type: 'Polygon'; coordinates: [number, number][][] } };

function rotatedLocalToGeo(poly: [number, number][]): [number, number][] {
  // 1. rotar de vuelta al frame norte-este
  const unrotated = poly.map((p) => rotate(p, COAST_ANGLE_RAD));
  // 2. metros → geo
  return localToGeo(unrotated, CENTER_LNG, CENTER_LAT);
}

const allFeatures: Feature[] = [];

for (const band of BANDS) {
  const result = autoSubdivide(band.poly, {
    minLotArea: band.minLotArea,
    roadPercentage: 7,
    greenPercentage: 4,
    minFrontage: band.minFrontage,
    roadWidth: 7,
    targetLots: band.targetLots,
  });
  const meta = CATEGORY_META[band.name];
  result.lots.forEach((lot, idx) => {
    const geo = rotatedLocalToGeo(lot.polygon);
    if (geo[0][0] !== geo[geo.length - 1][0] || geo[0][1] !== geo[geo.length - 1][1]) geo.push(geo[0]);
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
  console.log(`✓ ${band.name}: ${result.lots.length} lotes`);
}

// ────────────────────────────────────────────────────────────────────────────
// MACROLOTES — banda interior NE (paralela a costa)
// ────────────────────────────────────────────────────────────────────────────
const MACROS = [
  { id: 'M-ECO', name: 'Eco Lodge',        category: 'eco_lodge',  area: 12 },
  { id: 'M-WEL', name: 'Wellness Center',  category: 'wellness',   area: 8 },
  { id: 'M-GLA', name: 'Glamping Forest',  category: 'glamping',   area: 18 },
  { id: 'M-GAS', name: 'Gastronomy',       category: 'gastronomy', area: 6 },
  { id: 'M-RES', name: 'Research Station', category: 'research',   area: 10 },
];

const macroYBase = band3N + 20;
const macroXSpan = bounds.w / MACROS.length;
MACROS.forEach((m, i) => {
  const sideY = Math.sqrt(m.area * 10000) * 0.9; // achatado
  const sideX = (m.area * 10000) / sideY;
  const x1 = bounds.minX + i * macroXSpan + (macroXSpan - sideX) / 2;
  const x2 = x1 + sideX;
  const y1 = macroYBase;
  const y2 = Math.min(y1 + sideY, macroN - 5);
  const localRot: [number, number][] = [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]];
  const geo = rotatedLocalToGeo(localRot);
  allFeatures.push({
    type: 'Feature',
    properties: {
      id: m.id, line: 'macro', name: m.name, category: m.category, area_ha: m.area,
      ocean_exposure: 'N/A', privacy: 'Operativo', conservation: '60% nativo',
      architecture: 'Equipamiento programático · bajo impacto',
    },
    geometry: { type: 'Polygon', coordinates: [geo] },
  });
});

// ────────────────────────────────────────────────────────────────────────────
// RESERVA NÚCLEO (interior alto NE, fuera del lote pero referencial)
// ────────────────────────────────────────────────────────────────────────────
// Solo si quedó superficie interior libre, no la generamos a la fuerza.
// Para mantener compatibilidad con el front, agregamos polígono pequeño en NE.
const coreLocalRot: [number, number][] = [
  [bounds.minX, macroN - 30],
  [bounds.maxX, macroN - 30],
  [bounds.maxX, macroN],
  [bounds.minX, macroN],
  [bounds.minX, macroN - 30],
];
allFeatures.push({
  type: 'Feature',
  properties: {
    id: 'CORE', line: 'conservation', name: 'Reserva Núcleo',
    category: 'conservation_core', area_ha: 250,
    ocean_exposure: 'N/A', privacy: 'Intocada',
    conservation: '100% nativo · sin construcción', architecture: 'Sin intervención',
  },
  geometry: { type: 'Polygon', coordinates: [rotatedLocalToGeo(coreLocalRot).concat([rotatedLocalToGeo(coreLocalRot)[0]])] },
});

// ────────────────────────────────────────────────────────────────────────────
// PERÍMETRO LOTE B
// ────────────────────────────────────────────────────────────────────────────
const perimeterClosed = [...PERIMETER_LNGLAT];
if (perimeterClosed[0][0] !== perimeterClosed.at(-1)![0] || perimeterClosed[0][1] !== perimeterClosed.at(-1)![1]) {
  perimeterClosed.push(perimeterClosed[0]);
}

const data = {
  center: [CENTER_LNG, CENTER_LAT],
  perimeter: {
    type: 'Feature',
    properties: { name: 'Lote B · Fundo Hueyelhue', area_ha: 455 },
    geometry: { type: 'Polygon', coordinates: [perimeterClosed] },
  },
  lots: allFeatures,
};

const out = `// AUTO-GENERADO por scripts/generateHuellelhueLots.ts
// Motor: src/lib/subdivision/autoSubdivide.ts
// Perímetro: cabeza de tierra norte de Playa Rada de Ranú, costa Pacífico al SW
// Bandas paralelas a la costa (rotación ${COAST_ANGLE_DEG}° vs eje E-W)
// Coordenadas: WGS84 lng,lat

export const HUELLELHUE_DATA = ${JSON.stringify(data, null, 2)} as const;
`;

writeFileSync('src/pages/huellelhue/data/lots.ts', out);
console.log(`\n✓ ${allFeatures.length} features → src/pages/huellelhue/data/lots.ts`);
