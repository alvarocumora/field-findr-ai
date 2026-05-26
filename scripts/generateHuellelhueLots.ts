/**
 * Huellelhue Lote B — Generador de lotes alineado al KMZ real (LOTE_B.kmz).
 *
 * Perímetro: 80 vértices extraídos de LOTE_B.kmz (WGS84).
 * Superficie real: ~420 ha.
 * Eje principal del predio (PCA): +16.1° desde el este → rotamos -16.1°
 * para que la costa quede paralela al eje X y las bandas perpendiculares.
 *
 * Run:  bun scripts/generateHuellelhueLots.ts
 */

import { writeFileSync } from 'node:fs';
import { localToGeo } from '../src/lib/subdivision/autoSubdivide';

// ────────────────────────────────────────────────────────────────────────────
// PERÍMETRO REAL LOTE B (extraído de LOTE_B.kmz) — 80 vértices WGS84 lng,lat
// ────────────────────────────────────────────────────────────────────────────
const PERIMETER_LNGLAT: [number, number][] = [
  [-73.80230143377744, -40.70669115985267],
  [-73.80165214430748, -40.70692722614966],
  [-73.80077735017468, -40.70758282360492],
  [-73.79991056487496, -40.70912053734718],
  [-73.79933350829586, -40.71096047591571],
  [-73.7991875128806, -40.71232954954984],
  [-73.79968794463002, -40.71477328788006],
  [-73.80016917603784, -40.71596043651066],
  [-73.80071025211247, -40.71751976870151],
  [-73.80228390878509, -40.72001304431407],
  [-73.80257476848533, -40.72112309601897],
  [-73.80270431218015, -40.72133064496944],
  [-73.80488634524296, -40.72194201703542],
  [-73.80527000098446, -40.7221319754716],
  [-73.8057257088712, -40.7224187972984],
  [-73.8069599949127, -40.72237123383568],
  [-73.8078624893068, -40.72203320500672],
  [-73.80906810373727, -40.72236530577222],
  [-73.80994972632264, -40.72262611865839],
  [-73.81152973289973, -40.72256859741115],
  [-73.81305291672753, -40.7223568083621],
  [-73.813837971825, -40.72218179087646],
  [-73.81487481049709, -40.72192446435347],
  [-73.81561117469441, -40.7222397916237],
  [-73.81745564780846, -40.72222750360904],
  [-73.81998224661864, -40.72200159113727],
  [-73.82115153645634, -40.72171052822421],
  [-73.82276471986454, -40.7217912503893],
  [-73.82348693355415, -40.72207574898402],
  [-73.82428612632036, -40.72215868684125],
  [-73.82570085619935, -40.72189216650258],
  [-73.82697438034565, -40.72148844770954],
  [-73.82750583049675, -40.72121298049919],
  [-73.8282031513679, -40.7211730909659],
  [-73.82904541540236, -40.72138811875332],
  [-73.8298301822118, -40.72196191719103],
  [-73.82848269930082, -40.72283785821639],
  [-73.8274014148495, -40.72355631717444],
  [-73.82691021578867, -40.72417987324874],
  [-73.8263469553635, -40.7251501055262],
  [-73.82679754422442, -40.7258677463396],
  [-73.82593209575627, -40.72626858165208],
  [-73.82579940866886, -40.72660380873655],
  [-73.82551898397122, -40.72755225957325],
  [-73.82574549255551, -40.72846330657176],
  [-73.82585329433296, -40.72865973949039],
  [-73.81244211993544, -40.73168304700658],
  [-73.81176611734877, -40.73055746113312],
  [-73.81117152856305, -40.72976925176837],
  [-73.81037436634486, -40.72887929201181],
  [-73.80974713244991, -40.72801488503625],
  [-73.80945580296637, -40.72695123676434],
  [-73.80936776437763, -40.72667805592505],
  [-73.8086387043701, -40.72659390691841],
  [-73.80308521818704, -40.72793802915761],
  [-73.80166265921132, -40.72671076597632],
  [-73.79974757434897, -40.72612067293578],
  [-73.7987746440776, -40.72503820702731],
  [-73.79736318468308, -40.72501097574016],
  [-73.79694143363064, -40.72539937200322],
  [-73.79598373298256, -40.7258523562034],
  [-73.79462261061161, -40.72752207544753],
  [-73.79340720588985, -40.72724179971375],
  [-73.79207893540196, -40.72733928159764],
  [-73.79179833855862, -40.72641149991462],
  [-73.79119124043524, -40.72556159980808],
  [-73.79038420794662, -40.72524393837843],
  [-73.78984761127374, -40.72454276451379],
  [-73.78909726910045, -40.72378116046198],
  [-73.78769371224647, -40.72356035627687],
  [-73.78686791520167, -40.72247548305945],
  [-73.78568322884827, -40.72118925316136],
  [-73.78344320990135, -40.72105574876726],
  [-73.78353620696393, -40.71018062044125],
  [-73.78987804677442, -40.71019085552191],
  [-73.79435801096834, -40.70929977221016],
  [-73.7953869957574, -40.70923904707819],
  [-73.79767705347997, -40.70752475741548],
  [-73.79898759319052, -40.70701950123114],
  [-73.80073016102541, -40.70666945608362],
];

// Centro real (centroide medio del KMZ)
const CENTER_LNG = -73.80755360651344;
const CENTER_LAT = -40.721487003381824;

// Eje principal del predio calculado por PCA sobre los 80 vértices.
// Long axis dominante a +16.1° del este → rotamos -16.1° para alinearla al eje X.
// La "costa" (Rada de Ranú al SW) queda en el lado Y-min del frame rotado.
const COAST_ANGLE_DEG = 16.1;
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

// Frame rotado: long axis del predio paralela al eje X
const perimeterRotated = PERIMETER_LNGLAT.map((p) =>
  rotate(geoToLocal(p), -COAST_ANGLE_RAD)
);

const bounds = (() => {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of perimeterRotated) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
})();

console.log(`Bounds rotados: w=${bounds.w.toFixed(0)}m h=${bounds.h.toFixed(0)}m`);

// Point-in-polygon
function pip(pt: [number, number], poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (((yi > pt[1]) !== (yj > pt[1])) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ────────────────────────────────────────────────────────────────────────────
// BANDAS PARALELAS A LA COSTA — Y crece desde la costa (Y-min) al interior (Y-max)
// ────────────────────────────────────────────────────────────────────────────
const band1S = bounds.minY;
const band1N = bounds.minY + bounds.h * 0.30; // Ocean Front
const band2N = bounds.minY + bounds.h * 0.58; // Forest Ocean
const band3N = bounds.minY + bounds.h * 0.82; // Bosque Vivo
const macroN = bounds.maxY;                    // Macrolotes + Reserva al interior

const BANDS = [
  { name: 'ocean_front',  sY: band1S, nY: band1N },
  { name: 'forest_ocean', sY: band1N, nY: band2N },
  { name: 'bosque_vivo',  sY: band2N, nY: band3N },
];

const BAND_DIMS: Record<string, { w: number; d: number }> = {
  ocean_front:  { w: 130, d: 160 }, // ~2.1 ha — premium frente mar
  forest_ocean: { w: 110, d: 140 }, // ~1.5 ha
  bosque_vivo:  { w: 100, d: 120 }, // ~1.2 ha
};

const CATEGORY_META: Record<string, any> = {
  ocean_front:  { line: 1, label: 'Ocean Front',  ocean_exposure: 'Directa · 100%',     privacy: 'Máxima',          conservation: '75% nativo intocado', architecture: 'Cabaña costera oculta · Japandi coastal' },
  forest_ocean: { line: 2, label: 'Forest Ocean', ocean_exposure: 'Vista filtrada',     privacy: 'Alta',            conservation: '70% nativo',          architecture: 'Refugio elevado · madera nativa' },
  bosque_vivo:  { line: 3, label: 'Bosque Vivo',  ocean_exposure: 'Indirecta · sonido', privacy: 'Total inmersión', conservation: '80% nativo',          architecture: 'Cabaña dosel · pasarela' },
};

type Feature = { type: 'Feature'; properties: Record<string, any>; geometry: { type: 'Polygon'; coordinates: [number, number][][] } };

function rotatedLocalToGeo(poly: [number, number][]): [number, number][] {
  const unrotated = poly.map((p) => rotate(p, COAST_ANGLE_RAD));
  return localToGeo(unrotated, CENTER_LNG, CENTER_LAT);
}

const allFeatures: Feature[] = [];

function gridSubdivide(
  southY: number,
  northY: number,
  lotW: number,
  lotD: number,
): { polygon: [number, number][]; area: number }[] {
  const lots: { polygon: [number, number][]; area: number }[] = [];
  const roadGap = 8;
  const midY = (southY + northY) / 2;
  for (let x = bounds.minX; x + lotW <= bounds.maxX; x += lotW) {
    for (const side of [-1, 1]) {
      let y0 = side === -1 ? midY - roadGap / 2 - lotD : midY + roadGap / 2;
      while (
        (side === -1 && y0 >= southY) ||
        (side === 1 && y0 + lotD <= northY)
      ) {
        const rect: [number, number][] = [
          [x, y0], [x + lotW, y0], [x + lotW, y0 + lotD], [x, y0 + lotD], [x, y0],
        ];
        const cx = x + lotW / 2, cy = y0 + lotD / 2;
        // Verificar centroide Y 3 esquinas dentro del polígono real
        const corners: [number, number][] = [[x + 2, y0 + 2], [x + lotW - 2, y0 + 2], [x + 2, y0 + lotD - 2], [x + lotW - 2, y0 + lotD - 2]];
        const insideCorners = corners.filter((c) => pip(c, perimeterRotated)).length;
        if (pip([cx, cy], perimeterRotated) && insideCorners >= 3) {
          lots.push({ polygon: rect, area: lotW * lotD });
        }
        y0 += side * lotD;
      }
    }
  }
  return lots;
}

for (const band of BANDS) {
  const dims = BAND_DIMS[band.name];
  const lots = gridSubdivide(band.sY, band.nY, dims.w, dims.d);
  const meta = CATEGORY_META[band.name];
  lots.forEach((lot, idx) => {
    const geo = rotatedLocalToGeo(lot.polygon);
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
  console.log(`✓ ${band.name}: ${lots.length} lotes`);
}

// ────────────────────────────────────────────────────────────────────────────
// MACROLOTES — banda interior, alineada al eje principal
// ────────────────────────────────────────────────────────────────────────────
const MACROS = [
  { id: 'M-ECO', name: 'Eco Lodge',        category: 'eco_lodge',  area: 8 },
  { id: 'M-WEL', name: 'Wellness Center',  category: 'wellness',   area: 6 },
  { id: 'M-GLA', name: 'Glamping Forest',  category: 'glamping',   area: 10 },
  { id: 'M-GAS', name: 'Gastronomy',       category: 'gastronomy', area: 4 },
];

const macroYBase = band3N + 15;
const macroXSpan = bounds.w / MACROS.length;
MACROS.forEach((m, i) => {
  const sideY = Math.sqrt(m.area * 10000) * 0.9;
  const sideX = (m.area * 10000) / sideY;
  const x1 = bounds.minX + i * macroXSpan + (macroXSpan - sideX) / 2;
  const x2 = x1 + sideX;
  const y1 = macroYBase;
  const y2 = Math.min(y1 + sideY, macroN - 5);
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
  if (!pip([cx, cy], perimeterRotated)) {
    console.log(`  ⚠ macro ${m.id} fuera del perímetro — omitido`);
    return;
  }
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
// RESERVA NÚCLEO — sector interior (banda más al norte/interior)
// ────────────────────────────────────────────────────────────────────────────
const coreYS = macroN - 60;
const coreLocalRot: [number, number][] = [
  [bounds.minX, coreYS],
  [bounds.maxX, coreYS],
  [bounds.maxX, macroN],
  [bounds.minX, macroN],
  [bounds.minX, coreYS],
];
allFeatures.push({
  type: 'Feature',
  properties: {
    id: 'CORE', line: 'conservation', name: 'Reserva Núcleo',
    category: 'conservation_core', area_ha: 80,
    ocean_exposure: 'N/A', privacy: 'Intocada',
    conservation: '100% nativo · sin construcción', architecture: 'Sin intervención',
  },
  geometry: { type: 'Polygon', coordinates: [rotatedLocalToGeo(coreLocalRot)] },
});

// ────────────────────────────────────────────────────────────────────────────
// PERÍMETRO LOTE B (cerrado)
// ────────────────────────────────────────────────────────────────────────────
const perimeterClosed = [...PERIMETER_LNGLAT, PERIMETER_LNGLAT[0]];

const data = {
  center: [CENTER_LNG, CENTER_LAT],
  perimeter: {
    type: 'Feature',
    properties: { name: 'Lote B · Fundo Hueyelhue', area_ha: 420 },
    geometry: { type: 'Polygon', coordinates: [perimeterClosed] },
  },
  lots: allFeatures,
};

const out = `// AUTO-GENERADO por scripts/generateHuellelhueLots.ts
// Fuente perímetro: LOTE_B.kmz (80 vértices WGS84)
// Eje principal PCA: +${COAST_ANGLE_DEG}° desde el este
// Superficie real Lote B: ~420 ha
// Coordenadas: WGS84 lng,lat

export const HUELLELHUE_DATA = ${JSON.stringify(data, null, 2)} as const;
`;

writeFileSync('src/pages/huellelhue/data/lots.ts', out);
console.log(`\n✓ ${allFeatures.length} features → src/pages/huellelhue/data/lots.ts`);
