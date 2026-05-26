import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion } from 'framer-motion';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { HUELLELHUE_DATA } from '../data/lots';
import { Loader2, TreePine, Leaf, Tent, FlaskConical, Home, Sparkles, Compass } from 'lucide-react';

import beachBay from '@/assets/huellelhue/beach-bay.jpeg';
import estuaryClouds from '@/assets/huellelhue/estuary-clouds.jpeg';
import forestWindow from '@/assets/huellelhue/forest-window.jpeg';
import riverMouth from '@/assets/huellelhue/river-mouth.jpeg';
import sandspitAerial from '@/assets/huellelhue/sandspit-aerial.jpeg';
import turquoiseWater from '@/assets/huellelhue/turquoise-water.jpeg';

/* ───────────── DATA SUMMARY (Etapa 1, Lote B) ───────────── */
const SUMMARY = {
  surface: '420 ha',
  coast: '1,7 km',
  lots: '72',
  conservationHa: '287 ha',
  conservationPct: 63,
  commonsHa: '41 ha',
  commonsPct: 9,
  macroPct: 4,
  privatePct: 24,
  density: '0,17 lotes/ha',
};

const TYPOLOGIES = [
  { color: '#3b82c4', label: 'Primera línea', sub: '1 ha', count: '28 lotes' },
  { color: '#3a9d8f', label: 'Segunda línea', sub: '0,5 – 1 ha', count: '32 lotes' },
  { color: '#a8b04a', label: 'Tercera línea', sub: '0,5 – 1 ha', count: '12 lotes' },
];

const MACROZONES = [
  { icon: Home, color: '#b07ac4', label: 'Eco Lodge', area: '28 ha' },
  { icon: Sparkles, color: '#5cc4b9', label: 'Wellness Sanctuary', area: '18 ha' },
  { icon: Tent, color: '#c4a05c', label: 'Glamping Premium', area: '12 ha' },
  { icon: FlaskConical, color: '#a865c4', label: 'Research & Conservation', area: '16 ha' },
  { icon: Compass, color: '#c47a5c', label: 'Club House & Mirador', area: '8 ha' },
  { icon: Leaf, color: '#4a8a3d', label: 'Reserva Núcleo', area: '287 ha (63%)' },
];

const LEGEND = [
  { color: '#7CFF4A', label: 'Límite Lote B (420 ha)', dash: false, line: true },
  { color: '#3b82c4', label: 'Primera línea (1 ha) – 28 lotes', dash: false },
  { color: '#3a9d8f', label: 'Segunda línea (0,5–1 ha) – 32 lotes', dash: false },
  { color: '#a8b04a', label: 'Tercera línea (0,5–1 ha) – 12 lotes', dash: false },
  { color: '#4a8a3d', label: 'Reserva Núcleo (63%)', dash: false },
  { color: '#b07ac4', label: 'Macrolotes (5 zonas)', dash: false },
  { color: '#e8d28a', label: 'Áreas comunes / vías / senderos', dash: true },
];

const SECTORS = [
  { src: beachBay, label: 'Ocean Front Reserve' },
  { src: forestWindow, label: 'Forest Ocean Residences' },
  { src: estuaryClouds, label: 'Bosque Vivo' },
  { src: riverMouth, label: 'Eco Lodge' },
  { src: turquoiseWater, label: 'Wellness Sanctuary' },
  { src: sandspitAerial, label: 'Club House & Mirador' },
];

/* ───────────── DONUT ───────────── */
function Donut() {
  const segs = [
    { v: SUMMARY.conservationPct, c: '#4a8a3d', l: 'Conservación' },
    { v: SUMMARY.privatePct, c: '#3b82c4', l: 'Lotes privados' },
    { v: SUMMARY.commonsPct, c: '#a8b04a', l: 'Áreas comunes' },
    { v: SUMMARY.macroPct, c: '#b07ac4', l: 'Macrolotes' },
  ];
  const r = 42, c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 110 110" className="h-[120px] w-[120px] -rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
        {segs.map((s, i) => {
          const len = (s.v / 100) * c;
          const el = (
            <circle
              key={i}
              cx="55" cy="55" r={r}
              fill="none"
              stroke={s.c}
              strokeWidth="14"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-off}
            />
          );
          off += len;
          return el;
        })}
      </svg>
      <div className="space-y-1.5 text-[11px]">
        {segs.map((s) => (
          <div key={s.l} className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: s.c }} />
            <span className="text-[var(--hue-bone)] font-medium tabular-nums w-8">{s.v}%</span>
            <span className="text-[var(--hue-bone)]/55">{s.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── MACRO LABEL HELPER ───────────── */
const MACRO_COORDS: Record<string, [number, number]> = {
  eco_lodge: [-73.8055, -40.7095],
  wellness: [-73.7997, -40.7080],
  glamping: [-73.7995, -40.7155],
  research: [-73.7990, -40.7175],
};

export default function HueMasterplan() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [loading, setLoading] = useState(true);
  const { token, loading: tokenLoading } = useMapboxToken();

  useEffect(() => {
    if (!containerRef.current || tokenLoading || !token || mapRef.current) return;

    mapboxgl.accessToken = token;
    const [lng, lat] = HUELLELHUE_DATA.center as [number, number];

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [lng, lat],
      zoom: 13.6,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });
    mapRef.current = map;

    popupRef.current = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      offset: 12,
      className: 'hue-popup',
      maxWidth: '320px',
    });

    map.on('load', () => {
      const fc: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: HUELLELHUE_DATA.lots.map((l, idx) => ({
          ...l,
          id: idx,
        })) as unknown as GeoJSON.Feature[],
      };
      map.addSource('lots', { type: 'geojson', data: fc, generateId: false });

      // Conservation core soft tint
      map.addLayer({
        id: 'lots-conservation-fill',
        type: 'fill',
        source: 'lots',
        filter: ['==', ['get', 'category'], 'conservation_core'],
        paint: { 'fill-color': '#1a3a2a', 'fill-opacity': 0.28 },
      });

      // Residential fills (Patagonia palette)
      map.addLayer({
        id: 'lots-fill',
        type: 'fill',
        source: 'lots',
        filter: ['in', ['get', 'category'], ['literal', ['ocean_front', 'forest_ocean', 'bosque_vivo']]],
        paint: {
          'fill-color': [
            'match', ['get', 'category'],
            'ocean_front', '#3b82c4',
            'forest_ocean', '#3a9d8f',
            'bosque_vivo', '#a8b04a',
            '#444',
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false], 0.92,
            0.75,
          ],
        },
      });
      map.addLayer({
        id: 'lots-line',
        type: 'line',
        source: 'lots',
        filter: ['in', ['get', 'category'], ['literal', ['ocean_front', 'forest_ocean', 'bosque_vivo']]],
        paint: {
          'line-color': 'rgba(255,255,255,0.45)',
          'line-width': 0.6,
        },
      });

      // Macrolots — soft colored disks per type
      map.addLayer({
        id: 'lots-macro-fill',
        type: 'fill',
        source: 'lots',
        filter: ['==', ['get', 'line'], 'macro'],
        paint: {
          'fill-color': [
            'match', ['get', 'category'],
            'eco_lodge', '#b07ac4',
            'wellness',  '#5cc4b9',
            'glamping',  '#c4a05c',
            'research',  '#a865c4',
            '#c9a86b',
          ],
          'fill-opacity': 0.55,
        },
      });
      map.addLayer({
        id: 'lots-macro-line',
        type: 'line',
        source: 'lots',
        filter: ['==', ['get', 'line'], 'macro'],
        paint: {
          'line-color': 'rgba(255,255,255,0.7)',
          'line-width': 1.2,
          'line-dasharray': [2, 2],
        },
      });

      // Roads & trails
      map.addLayer({
        id: 'roads-casing',
        type: 'line',
        source: 'lots',
        filter: ['==', ['get', 'category'], 'road'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#1a1208', 'line-width': 6, 'line-opacity': 0.5 },
      });
      map.addLayer({
        id: 'roads-line',
        type: 'line',
        source: 'lots',
        filter: ['==', ['get', 'category'], 'road'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#f4e4c1', 'line-width': 2.5, 'line-opacity': 0.9 },
      });
      map.addLayer({
        id: 'trails-line',
        type: 'line',
        source: 'lots',
        filter: ['==', ['get', 'category'], 'trail'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#e8d28a',
          'line-width': 1.8,
          'line-opacity': 0.8,
          'line-dasharray': [1.5, 1.8],
        },
      });

      // Perímetro Lote B — verde intenso
      const perim = HUELLELHUE_DATA.perimeter as unknown as GeoJSON.Feature;
      map.addSource('perimeter', { type: 'geojson', data: perim });
      map.addLayer({
        id: 'perimeter-halo',
        type: 'line',
        source: 'perimeter',
        paint: { 'line-color': '#7CFF4A', 'line-width': 10, 'line-opacity': 0.22, 'line-blur': 6 },
      });
      map.addLayer({
        id: 'perimeter-line',
        type: 'line',
        source: 'perimeter',
        paint: { 'line-color': '#7CFF4A', 'line-width': 2.8, 'line-opacity': 1 },
      });

      // Centroides numerados de lotes residenciales (estilo Patagonia)
      const numFC: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: HUELLELHUE_DATA.lots
          .filter((l: any) => l.geometry?.type === 'Polygon' && ['ocean_front', 'forest_ocean', 'bosque_vivo'].includes(l.properties.category))
          .map((l: any, i: number) => {
            const ring = l.geometry.coordinates[0] as [number, number][];
            let sx = 0, sy = 0;
            for (const [x, y] of ring) { sx += x; sy += y; }
            const n = ring.length;
            return {
              type: 'Feature' as const,
              properties: { num: String(i + 1).padStart(2, '0') },
              geometry: { type: 'Point' as const, coordinates: [sx / n, sy / n] },
            };
          }),
      };
      map.addSource('lot-nums', { type: 'geojson', data: numFC });
      map.addLayer({
        id: 'lot-nums-bg',
        type: 'circle',
        source: 'lot-nums',
        minzoom: 14,
        paint: {
          'circle-radius': 9,
          'circle-color': 'rgba(0,0,0,0.55)',
          'circle-stroke-color': 'rgba(255,255,255,0.5)',
          'circle-stroke-width': 0.8,
        },
      });
      map.addLayer({
        id: 'lot-nums-label',
        type: 'symbol',
        source: 'lot-nums',
        minzoom: 14,
        layout: {
          'text-field': ['get', 'num'],
          'text-size': 10,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-allow-overlap': true,
        },
        paint: { 'text-color': '#fff' },
      });

      // Camera fit
      const coords = (perim.geometry as any).coordinates[0] as [number, number][];
      const b = new mapboxgl.LngLatBounds();
      coords.forEach((c) => b.extend(c));
      map.fitBounds(b, { padding: 70, pitch: 0, bearing: 0, duration: 0 });

      // Hover & click on lots
      const interactiveLayers = ['lots-fill', 'lots-macro-fill'];
      let hoveredId: number | null = null;
      interactiveLayers.forEach((layer) => {
        map.on('mousemove', layer, (e) => {
          if (!e.features?.length) return;
          map.getCanvas().style.cursor = 'pointer';
          const fid = e.features[0].id as number;
          if (hoveredId !== null && hoveredId !== fid) {
            map.setFeatureState({ source: 'lots', id: hoveredId }, { hover: false });
          }
          hoveredId = fid;
          map.setFeatureState({ source: 'lots', id: fid }, { hover: true });
        });
        map.on('mouseleave', layer, () => {
          map.getCanvas().style.cursor = '';
          if (hoveredId !== null) {
            map.setFeatureState({ source: 'lots', id: hoveredId }, { hover: false });
            hoveredId = null;
          }
        });
        map.on('click', layer, (e) => {
          if (!e.features?.length) return;
          const p = e.features[0].properties || {};
          const html = `
            <div style="padding: 22px 20px;">
              <div style="font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#c9a86b;margin-bottom:6px;">
                ${p.name || 'Lote'}
              </div>
              <div style="font-family:'Fraunces',serif;font-size:22px;font-weight:300;color:#e8e3d8;margin-bottom:10px;">
                ${p.area_ha} ha
              </div>
              <div style="font-size:11px;color:#b8b1a3;line-height:1.5;">
                ${p.architecture || p.conservation || ''}
              </div>
            </div>
          `;
          popupRef.current?.setLngLat(e.lngLat).setHTML(html).addTo(map);
        });
      });

      map.once('idle', () => setLoading(false));
    });

    return () => {
      popupRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [token, tokenLoading]);

  return (
    <section className="relative px-3 py-20 md:px-6 lg:px-10">
      <div className="mx-auto max-w-[1700px]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between px-2"
        >
          <div>
            <div className="hue-eyebrow mb-3">Masterplan · Lote B · Etapa 1</div>
            <h2 className="serif text-[clamp(2rem,4.5vw,3.2rem)] leading-[0.95]">
              Huellelhue <span className="italic text-[var(--hue-bone)]/55">reserva bosque & mar.</span>
            </h2>
          </div>
          <p className="max-w-md text-sm text-[var(--hue-bone)]/55">
            Distribución preliminar sobre coordenadas reales UTM 18S WGS84. 72 lotes residenciales,
            5 macrolotes operativos y 287 ha de reserva núcleo.
          </p>
        </motion.div>

        {/* Main infographic grid */}
        <div className="rounded-md overflow-hidden border border-white/8 bg-[#0a1410] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]">
          <div className="grid grid-cols-12 gap-0">
            {/* ───── LEFT SIDEBAR ───── */}
            <aside className="order-2 lg:order-1 col-span-12 lg:col-span-3 border-t lg:border-t-0 lg:border-r border-white/8 bg-[#070f0c]/95 backdrop-blur-md p-4 md:p-6 space-y-6 md:space-y-7">
              {/* Brand */}
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-[var(--hue-amber)]/15 border border-[var(--hue-amber)]/40 flex items-center justify-center">
                  <TreePine className="h-4 w-4 text-[var(--hue-amber)]" />
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.32em] uppercase text-[var(--hue-amber)] font-medium">Patagonia Reserve</div>
                  <div className="text-[10px] text-[var(--hue-bone)]/45 mt-0.5">Lote B · Etapa 1 desarrollo</div>
                </div>
              </div>

              <div>
                <h3 className="serif text-3xl leading-none">HUELLELHUE</h3>
                <p className="text-[11px] tracking-[0.18em] uppercase text-[var(--hue-bone)]/55 mt-2">Reserva Bosque & Mar</p>
              </div>

              <div className="hue-divider" />

              {/* Datos generales */}
              <div className="space-y-3">
                <div className="hue-eyebrow text-[10px]">Datos generales</div>
                {[
                  ['Superficie Lote B', SUMMARY.surface],
                  ['Frente de costa', SUMMARY.coast],
                  ['Lotes totales', `${SUMMARY.lots} unidades`],
                  ['Conservación núcleo', `${SUMMARY.conservationHa} (${SUMMARY.conservationPct}%)`],
                  ['Áreas comunes', `${SUMMARY.commonsHa} (${SUMMARY.commonsPct}%)`],
                  ['Macrolotes', '5 zonas'],
                  ['Densidad promedio', SUMMARY.density],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3 text-[11px]">
                    <span className="text-[var(--hue-bone)]/50">{k}</span>
                    <span className="text-[var(--hue-bone)] font-medium tabular-nums">{v}</span>
                  </div>
                ))}
              </div>

              <div className="hue-divider" />

              {/* Tipologías */}
              <div className="space-y-3">
                <div className="hue-eyebrow text-[10px]">Tipologías de lotes</div>
                {TYPOLOGIES.map((t) => (
                  <div key={t.label} className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full shrink-0 ring-2 ring-white/10"
                      style={{ background: t.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-[var(--hue-bone)] leading-tight">{t.label}</div>
                      <div className="text-[10px] text-[var(--hue-bone)]/45">{t.sub}</div>
                    </div>
                    <div className="text-[10px] text-[var(--hue-bone)]/70 tabular-nums">{t.count}</div>
                  </div>
                ))}
              </div>

              <div className="hue-divider" />

              {/* Macrolotes */}
              <div className="space-y-2.5">
                <div className="hue-eyebrow text-[10px]">Áreas y macrolotes</div>
                {MACROZONES.map((m) => (
                  <div key={m.label} className="flex items-center gap-3">
                    <span
                      className="h-7 w-7 rounded-md shrink-0 flex items-center justify-center border"
                      style={{ background: `${m.color}22`, borderColor: `${m.color}55` }}
                    >
                      <m.icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-[var(--hue-bone)] leading-tight">{m.label}</div>
                      <div className="text-[10px] text-[var(--hue-bone)]/45">{m.area}</div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* ───── CENTER MAP ───── */}
            <div className="order-1 lg:order-2 col-span-12 lg:col-span-6 relative min-h-[70vh] max-h-[80vh] lg:max-h-none lg:min-h-[820px]">
              <div ref={containerRef} className="absolute inset-0" />

              {/* Cinematic vignette */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]" />

              {/* Top-left title pill */}
              <div className="absolute top-5 left-5 z-10 max-w-[260px] rounded-sm bg-black/55 backdrop-blur-md border border-white/10 px-4 py-3">
                <div className="text-[9px] tracking-[0.3em] uppercase text-[var(--hue-amber)]">Masterplan desarrollo</div>
                <div className="serif text-lg leading-tight mt-1">Lote B – Etapa 1</div>
              </div>

              {/* North arrow */}
              <div className="absolute top-5 right-5 z-10 h-12 w-12 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center">
                <div className="flex flex-col items-center text-[9px] font-bold tracking-[0.2em] text-[var(--hue-bone)]">
                  <div className="text-[var(--hue-amber)]">▲</div>
                  <div>N</div>
                </div>
              </div>

              {/* Scale bar */}
              <div className="absolute bottom-5 left-5 z-10 bg-black/55 backdrop-blur-md border border-white/10 px-3 py-2 rounded-sm">
                <div className="flex items-center gap-0">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} className={`h-1.5 w-8 ${i % 2 === 0 ? 'bg-[var(--hue-bone)]' : 'bg-black'} border border-[var(--hue-bone)]/60`} />
                  ))}
                </div>
                <div className="flex justify-between mt-1 text-[8px] text-[var(--hue-bone)]/70 font-mono">
                  <span>0</span><span>500</span><span>1.000 m</span>
                </div>
              </div>

              {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#050908]">
                  <div className="flex flex-col items-center gap-3 text-[var(--hue-bone)]/60">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="hue-eyebrow text-[10px]">Cargando reserva</span>
                  </div>
                </div>
              )}
            </div>

            {/* ───── RIGHT SIDEBAR ───── */}
            <aside className="order-3 col-span-12 lg:col-span-3 border-t lg:border-t-0 lg:border-l border-white/8 bg-[#070f0c]/95 backdrop-blur-md p-4 md:p-6 space-y-6 md:space-y-7">
              {/* Leyenda */}
              <div className="space-y-3">
                <div className="hue-eyebrow text-[10px]">Leyenda</div>
                <div className="space-y-2">
                  {LEGEND.map((l) => (
                    <div key={l.label} className="flex items-start gap-2.5">
                      {l.line ? (
                        <span className="mt-1.5 h-[2px] w-4 shrink-0" style={{ background: l.color, boxShadow: `0 0 6px ${l.color}` }} />
                      ) : (
                        <span
                          className={`mt-1 h-2.5 w-2.5 rounded-sm shrink-0 ${l.dash ? 'border border-dashed' : ''}`}
                          style={{ background: l.dash ? 'transparent' : l.color, borderColor: l.color }}
                        />
                      )}
                      <span className="text-[10.5px] text-[var(--hue-bone)]/85 leading-snug">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hue-divider" />

              {/* Donut */}
              <div className="space-y-3">
                <div className="hue-eyebrow text-[10px]">Distribución de usos</div>
                <Donut />
              </div>

              <div className="hue-divider" />

              {/* Resumen */}
              <div className="space-y-2.5">
                <div className="hue-eyebrow text-[10px]">Resumen</div>
                {[
                  ['Superficie Lote B', SUMMARY.surface],
                  ['Frente de costa', SUMMARY.coast],
                  ['Lotes totales', SUMMARY.lots],
                  ['Primera línea', '28 (1 ha)'],
                  ['Segunda línea', '32 (0,5–1 ha)'],
                  ['Tercera línea', '12 (0,5–1 ha)'],
                  ['Conservación núcleo', SUMMARY.conservationHa],
                  ['Camino principal', '6,3 km'],
                  ['Senderos y miradores', '18 km'],
                  ['Río / esteros protegidos', '7,4 km'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3 text-[11px] border-b border-white/5 pb-1.5">
                    <span className="text-[var(--hue-bone)]/55">{k}</span>
                    <span className="text-[var(--hue-bone)] font-medium tabular-nums text-right">{v}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          {/* ───── BOTTOM SECTOR STRIP ───── */}
          <div className="border-t border-white/8 bg-[#070f0c] px-6 py-5">
            <div className="hue-eyebrow text-[10px] mb-3">Sectores destacados</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {SECTORS.map((s) => (
                <div key={s.label} className="group relative aspect-[4/3] overflow-hidden rounded-sm border border-white/10">
                  <img
                    src={s.src}
                    alt={s.label}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <div className="text-[9px] tracking-[0.18em] uppercase text-[var(--hue-bone)] font-medium leading-tight">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--hue-bone)]/40 px-4">
          Coordenadas reales UTM 18S WGS84 · Plano topográfico Fundo Hueyelhue (Luis San Juan Sepúlveda 2007).
          Distribución preliminar sujeta a estudios sectoriales y aprobación SAG según DL 3.516.
        </p>
      </div>
    </section>
  );
}
