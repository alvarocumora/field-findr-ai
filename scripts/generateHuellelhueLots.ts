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
// BANDAS PARALELAS A LA COSTA — filosofía RESERVA: bandas residenciales finas,
// conservación dominante (≥75% superficie), lodge protagonista, senderos
// ────────────────────────────────────────────────────────────────────────────
const band1S = bounds.minY + bounds.h * 0.18; // saltar borde extremo
const band1N = bounds.minY + bounds.h * 0.32; // Ocean Front (franja costa)
const band2N = bounds.minY + bounds.h * 0.46; // Forest Ocean (elevado)
const band3N = bounds.minY + bounds.h * 0.58; // Bosque Vivo (dosel)
const lodgeN = bounds.minY + bounds.h * 0.72; // Lodge + equipamiento
const macroN = bounds.maxY - bounds.h * 0.05;  // Reserva núcleo (recorta borde)

// ────────────────────────────────────────────────────────────────────────────
// TRAZADO ORGÁNICO — caminos curvos siguiendo topografía + lotes en abanico
// perpendiculares a la vía (estilo masterplan resort de referencia)
// ────────────────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, any> = {
  ocean_front:  { line: 1, label: 'Ocean Front',  ocean_exposure: 'Directa · 100%',     privacy: 'Máxima',          conservation: '75% nativo intocado', architecture: 'Cabaña costera oculta · Japandi coastal' },
  forest_ocean: { line: 2, label: 'Forest Ocean', ocean_exposure: 'Vista filtrada',     privacy: 'Alta',            conservation: '70% nativo',          architecture: 'Refugio elevado · madera nativa' },
  bosque_vivo:  { line: 3, label: 'Bosque Vivo',  ocean_exposure: 'Indirecta · sonido', privacy: 'Total inmersión', conservation: '80% nativo',          architecture: 'Cabaña dosel · pasarela' },
};

// Definición de spines (caminos curvos). yFrac es la posición base (0=costa, 1=interior).
// amp y freq controlan la sinuosidad del trazado. lotDepth = fondo del lote desde la vía.
type Spine = {
  name: 'ocean_front' | 'forest_ocean' | 'bosque_vivo';
  yFrac: number;
  amp: number;     // amplitud de la curva (m)
  freq: number;    // ciclos a lo largo del predio
  phase: number;   // desfase
  lotFrontage: number; // frente del lote contra el camino (m)
  lotDepth: number;    // profundidad del lote (m)
  bothSides: boolean;  // lotes a ambos lados del camino
};

// === ETAPA 1: máximo 80 lotes residenciales ===
// El resto del predio (Lote B 420 ha + 1.200 ha colindantes de conservación) queda
// como MACROLOTES de reserva para una 2ª subdivisión posterior (DL 3.516 etapa 2).
const MAX_LOTS_ETAPA_1 = 80;

const SPINES: Spine[] = [
  { name: 'ocean_front',  yFrac: 0.22, amp: 55, freq: 2.4, phase: 0.0, lotFrontage: 100, lotDepth: 130, bothSides: false },
  { name: 'ocean_front',  yFrac: 0.36, amp: 65, freq: 2.0, phase: 0.4, lotFrontage: 95,  lotDepth: 120, bothSides: true  },
  { name: 'forest_ocean', yFrac: 0.50, amp: 75, freq: 1.8, phase: 0.9, lotFrontage: 95,  lotDepth: 115, bothSides: true  },
  { name: 'bosque_vivo',  yFrac: 0.64, amp: 90, freq: 1.4, phase: 1.5, lotFrontage: 110, lotDepth: 135, bothSides: true  },
];


type Feature = { type: 'Feature'; properties: Record<string, any>; geometry: any };

function rotatedLocalToGeo(poly: [number, number][]): [number, number][] {
  const unrotated = poly.map((p) => rotate(p, COAST_ANGLE_RAD));
  return localToGeo(unrotated, CENTER_LNG, CENTER_LAT);
}
function rotatedLocalToGeoSingle(pt: [number, number]): [number, number] {
  const u = rotate(pt, COAST_ANGLE_RAD);
  return localToGeo([u], CENTER_LNG, CENTER_LAT)[0];
}

const allFeatures: Feature[] = [];
const roadFeatures: Feature[] = [];

// Sample spine curve in rotated local frame
function sampleSpine(s: Spine, samples: number): { p: [number, number]; t: [number, number]; n: [number, number] }[] {
  const baseY = bounds.minY + bounds.h * s.yFrac;
  const xStart = bounds.minX + 60;
  const xEnd = bounds.maxX - 60;
  const out: { p: [number, number]; t: [number, number]; n: [number, number] }[] = [];
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const x = xStart + (xEnd - xStart) * u;
    const y = baseY + Math.sin(u * Math.PI * 2 * s.freq + s.phase) * s.amp
              + Math.sin(u * Math.PI * 4 * s.freq + s.phase * 1.7) * s.amp * 0.25;
    // tangent via finite diff
    const du = 0.001;
    const x2 = xStart + (xEnd - xStart) * (u + du);
    const y2 = baseY + Math.sin((u + du) * Math.PI * 2 * s.freq + s.phase) * s.amp
              + Math.sin((u + du) * Math.PI * 4 * s.freq + s.phase * 1.7) * s.amp * 0.25;
    const tx = x2 - x, ty = y2 - y;
    const tl = Math.hypot(tx, ty) || 1;
    const t: [number, number] = [tx / tl, ty / tl];
    const n: [number, number] = [-t[1], t[0]]; // normal apuntando "norte" (hacia interior)
    out.push({ p: [x, y], t, n });
  }
  return out;
}

function quadInside(quad: [number, number][]): boolean {
  const cx = quad.reduce((s, p) => s + p[0], 0) / 4;
  const cy = quad.reduce((s, p) => s + p[1], 0) / 4;
  if (!pip([cx, cy], perimeterRotated)) return false;
  return quad.every((c) => pip(c, perimeterRotated));
}

// Bounding-box overlap entre dos quads (simple, rápido)
function quadsOverlap(a: [number, number][], b: [number, number][]): boolean {
  const minA = [Math.min(...a.map(p => p[0])), Math.min(...a.map(p => p[1]))];
  const maxA = [Math.max(...a.map(p => p[0])), Math.max(...a.map(p => p[1]))];
  const minB = [Math.min(...b.map(p => p[0])), Math.min(...b.map(p => p[1]))];
  const maxB = [Math.max(...b.map(p => p[0])), Math.max(...b.map(p => p[1]))];
  const padding = -5; // tolerancia leve para permitir vecindad
  return !(maxA[0] < minB[0] + padding || minA[0] > maxB[0] - padding ||
           maxA[1] < minB[1] + padding || minA[1] > maxB[1] - padding);
}

const placedQuads: [number, number][][] = [];
const ROAD_HALF_WIDTH = 6; // calle 12 m

for (const spine of SPINES) {
  // Densidad de samples = longitud aprox / frente lote (resolución)
  const samples = Math.ceil((bounds.maxX - bounds.minX) / (spine.lotFrontage * 0.6));
  const pts = sampleSpine(spine, samples);

  // Guardar geometría del camino (centro de la vía)
  const roadGeo = pts.map(({ p }) => rotatedLocalToGeoSingle(p));
  roadFeatures.push({
    type: 'Feature',
    properties: {
      id: `R-${spine.name}`, line: 'road', name: `Camino ${spine.name}`,
      category: 'road',
      width_m: ROAD_HALF_WIDTH * 2,
    },
    geometry: { type: 'LineString', coordinates: roadGeo },
  });

  // Recorrer la curva acumulando arc-length y colocar lote cada lotFrontage + gap
  const gap = 8;          // separación lateral entre lotes (m)
  const step = spine.lotFrontage + gap;
  let accum = 0, nextTrigger = step / 2, lotIdx = 0;
  const meta = CATEGORY_META[spine.name];

  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].p[0] - pts[i - 1].p[0], pts[i].p[1] - pts[i - 1].p[1]);
    accum += seg;
    while (accum >= nextTrigger) {
      const { p, t, n } = pts[i];
      const halfFront = spine.lotFrontage / 2;
      // dos lados posibles: +n (interior) y -n (costa)
      const sides: number[] = spine.bothSides ? [+1, -1] : [-1]; // sólo costa para ocean_front
      for (const sideSign of sides) {
        const offsetIn = ROAD_HALF_WIDTH; // desde el centro de la vía
        const offsetOut = ROAD_HALF_WIDTH + spine.lotDepth;
        // 4 esquinas del cuadrilátero (tangente da el frente, normal el fondo)
        const c1: [number, number] = [p[0] - t[0] * halfFront + n[0] * offsetIn * sideSign,  p[1] - t[1] * halfFront + n[1] * offsetIn * sideSign];
        const c2: [number, number] = [p[0] + t[0] * halfFront + n[0] * offsetIn * sideSign,  p[1] + t[1] * halfFront + n[1] * offsetIn * sideSign];
        const c3: [number, number] = [p[0] + t[0] * halfFront + n[0] * offsetOut * sideSign, p[1] + t[1] * halfFront + n[1] * offsetOut * sideSign];
        const c4: [number, number] = [p[0] - t[0] * halfFront + n[0] * offsetOut * sideSign, p[1] - t[1] * halfFront + n[1] * offsetOut * sideSign];
        const quad: [number, number][] = [c1, c2, c3, c4];
        if (!quadInside(quad)) continue;
        if (placedQuads.some((q) => quadsOverlap(q, quad))) continue;
        placedQuads.push(quad);
        lotIdx += 1;
        const polyClosed: [number, number][] = [...quad, c1];
        // Área aprox (Shoelace local)
        let area = 0;
        for (let k = 0, j = quad.length - 1; k < quad.length; j = k++) {
          area += (quad[j][0] + quad[k][0]) * (quad[j][1] - quad[k][1]);
        }
        area = Math.abs(area) / 2;
        const geo = rotatedLocalToGeo(polyClosed);
        allFeatures.push({
          type: 'Feature',
          properties: {
            id: `L${meta.line}-${String(lotIdx).padStart(3, '0')}`,
            line: meta.line,
            name: `${meta.label} ${String(lotIdx).padStart(3, '0')}`,
            category: spine.name,
            area_ha: Math.round((area / 10000) * 100) / 100,
            ocean_exposure: meta.ocean_exposure,
            privacy: meta.privacy,
            conservation: meta.conservation,
            architecture: meta.architecture,
          },
          geometry: { type: 'Polygon', coordinates: [geo] },
        });
      }
      nextTrigger += step;
    }
  }
  console.log(`✓ ${spine.name}: ${lotIdx} lotes (spine ${samples} samples)`);
}

// Empujar los caminos a la colección final
allFeatures.push(...roadFeatures);


// ────────────────────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────
// LODGE + EQUIPAMIENTO — banda lodgeN, lodge protagonista cerca de costa
// ────────────────────────────────────────────────────────────────────────────
const MACROS = [
  { id: 'M-ECO', name: 'Huellelhue Lodge',     category: 'eco_lodge',  area: 10, narrative: 'Lodge principal · 28 suites · spa · biblioteca · restaurante' },
  { id: 'M-WEL', name: 'Wellness & Sauna Mar', category: 'wellness',   area: 5,  narrative: 'Sauna sobre mar · piscina caldeada · ritual mapuche' },
  { id: 'M-GLA', name: 'Glamping Selva',       category: 'glamping',   area: 8,  narrative: '12 domos elevados · plataformas de madera nativa' },
  { id: 'M-RES', name: 'Centro Investigación', category: 'research',   area: 3,  narrative: 'Estación científica · monitoreo biodiversidad · alianza universitaria' },
];

function findMacroSlot(sideX: number, sideY: number, startXFrac: number): { x1: number; y1: number } | null {
  const yMin = band3N + 20;
  const yMax = lodgeN - 5;
  const xStart = bounds.minX + bounds.w * startXFrac;
  for (let xOff = 0; xOff < bounds.w * 0.6; xOff += 15) {
    for (const xSign of [1, -1]) {
      const x1 = xStart + xSign * xOff - sideX / 2;
      for (let y1 = yMin; y1 + sideY <= yMax; y1 += 20) {
        const corners: [number, number][] = [
          [x1, y1], [x1 + sideX, y1], [x1 + sideX, y1 + sideY], [x1, y1 + sideY],
          [x1 + sideX / 2, y1 + sideY / 2],
        ];
        if (corners.every((c) => pip(c, perimeterRotated))) return { x1, y1 };
      }
    }
  }
  return null;
}

MACROS.forEach((m, i) => {
  const sideY = Math.sqrt(m.area * 10000) * 0.85;
  const sideX = (m.area * 10000) / sideY;
  const slot = findMacroSlot(sideX, sideY, (i + 0.5) / MACROS.length);
  if (!slot) {
    console.log(`  ⚠ macro ${m.id} sin slot interior — omitido`);
    return;
  }
  const { x1, y1 } = slot;
  const x2 = x1 + sideX, y2 = y1 + sideY;
  const localRot: [number, number][] = [[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]];
  const geo = rotatedLocalToGeo(localRot);
  allFeatures.push({
    type: 'Feature',
    properties: {
      id: m.id, line: 'macro', name: m.name, category: m.category, area_ha: m.area,
      ocean_exposure: m.category === 'wellness' ? 'Directa · sauna mar' : 'Vista interior',
      privacy: 'Operativo · acceso huéspedes',
      conservation: '70% nativo · construcción bajo dosel',
      architecture: m.narrative,
    },
    geometry: { type: 'Polygon', coordinates: [geo] },
  });
  console.log(`✓ macro ${m.id}: colocado`);
});

// ────────────────────────────────────────────────────────────────────────────
// SENDEROS (LineStrings) — red de trekking conectando lodge, costa, miradores
// ────────────────────────────────────────────────────────────────────────────
type TrailDef = { id: string; name: string; difficulty: string; length_km: number; pts: [number, number][] };

const trailDefs: TrailDef[] = [
  {
    id: 'S-COSTA', name: 'Sendero Costero del Pacífico', difficulty: 'Fácil', length_km: 3.2,
    // Línea ondulante a lo largo de la franja Ocean Front
    pts: Array.from({ length: 14 }, (_, i) => {
      const t = i / 13;
      const x = bounds.minX + 80 + t * (bounds.w - 160);
      const y = band1S + 30 + Math.sin(t * Math.PI * 3) * 25;
      return [x, y] as [number, number];
    }),
  },
  {
    id: 'S-INT', name: 'Sendero Reserva Núcleo', difficulty: 'Moderado', length_km: 4.2,
    pts: Array.from({ length: 20 }, (_, i) => {
      const t = i / 19;
      const angle = t * Math.PI * 2;
      const cx = bounds.minX + bounds.w * 0.5;
      const cy = lodgeN + (macroN - lodgeN) * 0.45;
      const rx = bounds.w * 0.22;
      const ry = Math.min((macroN - lodgeN) * 0.28, bounds.h * 0.08);
      return [cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry] as [number, number];
    }),
  },
  {
    id: 'S-LODGE', name: 'Conexión Lodge → Playa', difficulty: 'Fácil', length_km: 1.4,
    // Diagonal desde el centro de lodgeN bajando a costa
    pts: Array.from({ length: 10 }, (_, i) => {
      const t = i / 9;
      const x = bounds.minX + bounds.w * (0.42 + t * 0.06);
      const y = lodgeN - t * (lodgeN - band1S - 20);
      return [x, y] as [number, number];
    }),
  },
  {
    id: 'S-MIR', name: 'Sendero Miradores', difficulty: 'Moderado', length_km: 2.6,
    pts: Array.from({ length: 12 }, (_, i) => {
      const t = i / 11;
      const x = bounds.minX + bounds.w * (0.65 + Math.sin(t * Math.PI) * 0.15);
      const y = band3N + t * (lodgeN - band3N);
      return [x, y] as [number, number];
    }),
  },
];

// Miradores (POIs) en cabos prominentes
const POIS = [
  { id: 'MIR-1', name: 'Mirador Punta Cholihueco', xFrac: 0.18, yOffset: 40 },
  { id: 'MIR-2', name: 'Mirador Estuario',         xFrac: 0.78, yOffset: 60 },
  { id: 'MIR-3', name: 'Mirador Bosque Alto',      xFrac: 0.52, yOffset: lodgeN - band1S + 80 },
];

trailDefs.forEach((t) => {
  // Filtrar puntos dentro del perímetro y conectar los segmentos válidos
  const valid = t.pts.filter((p) => pip(p, perimeterRotated));
  if (valid.length < 3) return;
  const geo = valid.map((p) => rotatedLocalToGeoSingle(p));
  allFeatures.push({
    type: 'Feature',
    properties: {
      id: t.id, line: 'trail', name: t.name, category: 'trail',
      difficulty: t.difficulty, length_km: t.length_km,
      ocean_exposure: '-', privacy: 'Comunitario',
      conservation: 'Trazado de bajo impacto · superficie permeable',
      architecture: 'Pasarela de madera nativa flotante',
    },
    geometry: { type: 'LineString', coordinates: geo },
  });
  console.log(`✓ sendero ${t.id}: ${valid.length} pts · ${t.length_km} km`);
});

POIS.forEach((p) => {
  const pt: [number, number] = [bounds.minX + bounds.w * p.xFrac, band1S + p.yOffset];
  if (!pip(pt, perimeterRotated)) return;
  allFeatures.push({
    type: 'Feature',
    properties: {
      id: p.id, line: 'poi', name: p.name, category: 'viewpoint',
      ocean_exposure: 'Panorámica 180°', privacy: 'Comunitario',
      conservation: 'Plataforma elevada · sin remoción de vegetación',
      architecture: 'Mirador de madera y acero corten',
    },
    geometry: { type: 'Point', coordinates: rotatedLocalToGeoSingle(pt) },
  });
});


// ────────────────────────────────────────────────────────────────────────────
// RESERVA NÚCLEO — toda la franja interior (≥75% predio sin construcción)
// ────────────────────────────────────────────────────────────────────────────
const coreYS = lodgeN + 5;
const corePoly: [number, number][] = [];
const sampleStep = bounds.w / 80;
for (let x = bounds.minX; x <= bounds.maxX; x += sampleStep) {
  if (pip([x, coreYS], perimeterRotated)) corePoly.push([x, coreYS]);
}
const interiorTop = perimeterRotated.filter((p) => p[1] > coreYS).sort((a, b) => b[0] - a[0]);
corePoly.push(...interiorTop);
if (corePoly.length >= 4) {
  corePoly.push(corePoly[0]);
  allFeatures.push({
    type: 'Feature',
    properties: {
      id: 'CORE', line: 'conservation', name: 'Reserva Núcleo Huellelhue',
      category: 'conservation_core', area_ha: 320,
      ocean_exposure: 'N/A', privacy: 'Intocada',
      conservation: '100% nativo · sin construcción · servidumbre ecológica perpetua',
      architecture: 'Sin intervención · solo senderos permeables',
    },
    geometry: { type: 'Polygon', coordinates: [rotatedLocalToGeo(corePoly)] },
  });
  console.log(`✓ reserva núcleo: ${corePoly.length} vértices`);
}

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
