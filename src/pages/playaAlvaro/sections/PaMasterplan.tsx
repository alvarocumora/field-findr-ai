import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion } from 'framer-motion';
import { Loader2, Waves, Compass, Map as MapIcon, Layers } from 'lucide-react';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { PLAYA_ALVARO_PROJECT } from '../data/project';
import { PLAYA_ALVARO_LOTS, type PaLot } from '../data/lots';
import { PLAYA_ALVARO_MACROS } from '../data/macros';
import { PLAYA_ALVARO_EDGES } from '../data/edges';

/* ───────── Helpers geo ───────── */
// Generar polígono circular (octógono+) a partir de centroide + radio en metros
function circlePolygon(lng: number, lat: number, radiusM: number, segments = 28): [number, number][] {
  const coords: [number, number][] = [];
  const earth = 6378137;
  const latRad = (lat * Math.PI) / 180;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * 2 * Math.PI;
    const dx = radiusM * Math.cos(a);
    const dy = radiusM * Math.sin(a);
    const dLng = (dx / (earth * Math.cos(latRad))) * (180 / Math.PI);
    const dLat = (dy / earth) * (180 / Math.PI);
    coords.push([lng + dLng, lat + dLat]);
  }
  return coords;
}

// Bucket por superficie
function sizeBucket(area: number): 'micro' | 'medio' | 'grande' | 'macro' {
  if (area < 1) return 'micro';
  if (area < 5) return 'medio';
  if (area < 15) return 'grande';
  return 'macro';
}

const BUCKET_COLORS: Record<string, string> = {
  micro: '#5cc4d6',   // turquesa
  medio: '#3a9d8f',   // verde-mar
  grande: '#c4a05c',  // arena
  macro: '#b07ac4',   // amatista
};

const BUCKETS = [
  { id: 'micro', label: '< 1 ha', sub: 'Parcela mínima' },
  { id: 'medio', label: '1 – 5 ha', sub: 'Residencial' },
  { id: 'grande', label: '5 – 15 ha', sub: 'Familiar / inversor' },
  { id: 'macro', label: '15+ ha', sub: 'Macrolote' },
];

/* ───────── Donut ───────── */
function Donut({ counts }: { counts: Record<string, number> }) {
  const total = PLAYA_ALVARO_LOTS.length;
  const segs = BUCKETS.map((b) => ({
    v: Math.round(((counts[b.id] || 0) / total) * 100),
    c: BUCKET_COLORS[b.id],
    l: b.label,
  }));
  const r = 42;
  const c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 110 110" className="h-[120px] w-[120px] -rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
        {segs.map((s, i) => {
          const len = (s.v / 100) * c;
          const el = (
            <circle key={i} cx="55" cy="55" r={r} fill="none" stroke={s.c} strokeWidth="14"
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-off} />
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

/* ───────── Componente ───────── */
export default function PaMasterplan() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeBuckets, setActiveBuckets] = useState<Set<string>>(
    new Set(BUCKETS.map((b) => b.id))
  );
  const [selected, setSelected] = useState<PaLot | null>(null);
  const { token, loading: tokenLoading } = useMapboxToken();

  // Stats
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalArea = 0;
    let totalPriceUf = 0;
    for (const l of PLAYA_ALVARO_LOTS) {
      const b = sizeBucket(l.area_ha);
      counts[b] = (counts[b] || 0) + 1;
      totalArea += l.area_ha;
      totalPriceUf += l.price_uf;
    }
    return {
      counts,
      totalArea: Math.round(totalArea),
      avgPriceUf: Math.round(totalPriceUf / PLAYA_ALVARO_LOTS.length),
    };
  }, []);

  // Init map
  useEffect(() => {
    if (!containerRef.current || tokenLoading || !token || mapRef.current) return;
    mapboxgl.accessToken = token;

    const { center, bounds } = PLAYA_ALVARO_PROJECT;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [center.lng, center.lat],
      zoom: 13,
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
      // LOTS source — polígonos circulares con metadata
      const lotsFC: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: PLAYA_ALVARO_LOTS.map((l, i) => ({
          type: 'Feature',
          id: i,
          properties: {
            id: l.id,
            num: l.lot_number,
            area: l.area_ha,
            price: l.price_uf,
            bucket: sizeBucket(l.area_ha),
            status: l.status,
          },
          geometry: {
            type: 'Polygon',
            coordinates: [circlePolygon(l.centroid[0], l.centroid[1], l.radius_m)],
          },
        })),
      };
      map.addSource('lots', { type: 'geojson', data: lotsFC });

      map.addLayer({
        id: 'lots-fill',
        type: 'fill',
        source: 'lots',
        paint: {
          'fill-color': [
            'match', ['get', 'bucket'],
            'micro', BUCKET_COLORS.micro,
            'medio', BUCKET_COLORS.medio,
            'grande', BUCKET_COLORS.grande,
            'macro', BUCKET_COLORS.macro,
            '#888',
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false], 0.92,
            0.6,
          ],
        },
      });
      map.addLayer({
        id: 'lots-line',
        type: 'line',
        source: 'lots',
        paint: {
          'line-color': 'rgba(255,255,255,0.65)',
          'line-width': 0.8,
        },
      });

      // Edges (perímetro/grilla)
      const edgesFC: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: PLAYA_ALVARO_EDGES.map((coords) => ({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: coords },
        })),
      };
      map.addSource('edges', { type: 'geojson', data: edgesFC });
      map.addLayer({
        id: 'edges-line',
        type: 'line',
        source: 'edges',
        paint: {
          'line-color': '#e8d28a',
          'line-width': 0.7,
          'line-opacity': 0.55,
        },
      });

      // Macros — predio matriz
      const macrosFC: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: PLAYA_ALVARO_MACROS.map((m) => ({
          type: 'Feature',
          properties: { folder: m.folder, area: m.area_ha },
          geometry: { type: 'Polygon', coordinates: [m.polygon] },
        })),
      };
      map.addSource('macros', { type: 'geojson', data: macrosFC });
      map.addLayer({
        id: 'macros-halo',
        type: 'line',
        source: 'macros',
        paint: { 'line-color': '#7CFFE0', 'line-width': 8, 'line-opacity': 0.18, 'line-blur': 5 },
      });
      map.addLayer({
        id: 'macros-line',
        type: 'line',
        source: 'macros',
        paint: { 'line-color': '#7CFFE0', 'line-width': 2.2, 'line-opacity': 0.95 },
      });

      // Números de lote
      const numFC: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: PLAYA_ALVARO_LOTS.map((l) => ({
          type: 'Feature',
          properties: { num: l.lot_number, bucket: sizeBucket(l.area_ha) },
          geometry: { type: 'Point', coordinates: l.centroid },
        })),
      };
      map.addSource('lot-nums', { type: 'geojson', data: numFC });
      map.addLayer({
        id: 'lot-nums-bg',
        type: 'circle',
        source: 'lot-nums',
        minzoom: 13.5,
        paint: {
          'circle-radius': 10,
          'circle-color': 'rgba(0,0,0,0.65)',
          'circle-stroke-color': 'rgba(255,255,255,0.55)',
          'circle-stroke-width': 0.8,
        },
      });
      map.addLayer({
        id: 'lot-nums-label',
        type: 'symbol',
        source: 'lot-nums',
        minzoom: 13.5,
        layout: {
          'text-field': ['get', 'num'],
          'text-size': 10,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-allow-overlap': true,
        },
        paint: { 'text-color': '#fff' },
      });

      // Fit bounds
      const b = new mapboxgl.LngLatBounds(
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat]
      );
      map.fitBounds(b, { padding: 70, duration: 0 });

      // Interacciones
      let hoveredId: number | null = null;
      map.on('mousemove', 'lots-fill', (e) => {
        if (!e.features?.length) return;
        map.getCanvas().style.cursor = 'pointer';
        const fid = e.features[0].id as number;
        if (hoveredId !== null && hoveredId !== fid) {
          map.setFeatureState({ source: 'lots', id: hoveredId }, { hover: false });
        }
        hoveredId = fid;
        map.setFeatureState({ source: 'lots', id: fid }, { hover: true });
      });
      map.on('mouseleave', 'lots-fill', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredId !== null) {
          map.setFeatureState({ source: 'lots', id: hoveredId }, { hover: false });
          hoveredId = null;
        }
      });
      map.on('click', 'lots-fill', (e) => {
        if (!e.features?.length) return;
        const p = e.features[0].properties || {};
        const lot = PLAYA_ALVARO_LOTS.find((l) => l.id === p.id) || null;
        setSelected(lot);
        const html = `
          <div style="padding: 18px 18px;">
            <div style="font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#5cc4d6;margin-bottom:6px;">
              ${p.id}
            </div>
            <div style="font-family:'Fraunces',serif;font-size:22px;font-weight:300;color:#e8e3d8;margin-bottom:6px;">
              ${p.area} ha
            </div>
            <div style="font-size:11px;color:#b8b1a3;line-height:1.5;">
              Desde <strong style="color:#e8e3d8">${p.price.toLocaleString('es-CL')} UF</strong>
              <br/>Estado: ${p.status}
            </div>
          </div>
        `;
        popupRef.current?.setLngLat(e.lngLat).setHTML(html).addTo(map);
      });

      map.once('idle', () => setLoading(false));
    });

    return () => {
      popupRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [token, tokenLoading]);

  // Aplicar filtros de bucket
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const filter = ['in', ['get', 'bucket'], ['literal', Array.from(activeBuckets)]];
    try {
      map.setFilter('lots-fill', filter);
      map.setFilter('lots-line', filter);
      map.setFilter('lot-nums-bg', filter);
      map.setFilter('lot-nums-label', filter);
    } catch {
      /* layers aún no listos */
    }
  }, [activeBuckets, loading]);

  const toggleBucket = (id: string) => {
    setActiveBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="relative px-3 py-20 md:px-6 lg:px-10">
      <div className="mx-auto max-w-[1700px]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between px-2"
        >
          <div>
            <div className="hue-eyebrow mb-3">Masterplan · 87 lotes interactivos</div>
            <h2 className="serif text-[clamp(2rem,4.5vw,3.2rem)] leading-[0.95]">
              Playa Álvaro <span className="italic text-[var(--hue-bone)]/55">explora cada lote.</span>
            </h2>
          </div>
          <p className="max-w-md text-sm text-[var(--hue-bone)]/55">
            Polígonos generados desde KMZ oficial (286 placemarks). Filtra por superficie,
            haz click en cada lote para ver precio y disponibilidad.
          </p>
        </motion.div>

        <div className="rounded-md overflow-hidden border border-white/8 bg-[#0a1822] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]">
          <div className="grid grid-cols-12 gap-0">
            {/* SIDEBAR IZQ */}
            <aside className="order-2 lg:order-1 col-span-12 lg:col-span-3 border-t lg:border-t-0 lg:border-r border-white/8 bg-[#06121b]/95 backdrop-blur-md p-4 md:p-6 space-y-6">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-[var(--hue-amber)]/15 border border-[var(--hue-amber)]/40 flex items-center justify-center">
                  <Waves className="h-4 w-4 text-[var(--hue-amber)]" />
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.32em] uppercase text-[var(--hue-amber)] font-medium">OFERTA TERRENOS</div>
                  <div className="text-[10px] text-[var(--hue-bone)]/45 mt-0.5">Subdivisión DL 3.516</div>
                </div>
              </div>

              <div>
                <h3 className="serif text-3xl leading-none">PLAYA ÁLVARO</h3>
                <p className="text-[11px] tracking-[0.18em] uppercase text-[var(--hue-bone)]/55 mt-2">
                  Costa Pacífico · Los Lagos
                </p>
              </div>

              <div className="hue-divider" />

              <div className="space-y-3">
                <div className="hue-eyebrow text-[10px]">Datos generales</div>
                {[
                  ['Superficie total', `${stats.totalArea} ha`],
                  ['Lotes totales', `${PLAYA_ALVARO_LOTS.length}`],
                  ['Superficie mín.', '0,47 ha'],
                  ['Superficie máx.', '25,47 ha'],
                  ['Precio promedio', `${stats.avgPriceUf.toLocaleString('es-CL')} UF`],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3 text-[11px]">
                    <span className="text-[var(--hue-bone)]/50">{k}</span>
                    <span className="text-[var(--hue-bone)] font-medium tabular-nums">{v}</span>
                  </div>
                ))}
              </div>

              <div className="hue-divider" />

              <div className="space-y-3">
                <div className="hue-eyebrow text-[10px] flex items-center gap-2">
                  <Layers className="h-3 w-3" /> Filtros por superficie
                </div>
                {BUCKETS.map((b) => {
                  const active = activeBuckets.has(b.id);
                  const count = stats.counts[b.id] || 0;
                  return (
                    <button
                      key={b.id}
                      onClick={() => toggleBucket(b.id)}
                      className={`w-full flex items-center gap-3 px-2 py-1.5 rounded transition ${
                        active ? 'bg-white/5' : 'opacity-40 hover:opacity-70'
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full shrink-0 ring-2 ring-white/10"
                        style={{ background: BUCKET_COLORS[b.id] }}
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-[11px] text-[var(--hue-bone)] leading-tight">{b.label}</div>
                        <div className="text-[10px] text-[var(--hue-bone)]/45">{b.sub}</div>
                      </div>
                      <span className="text-[10px] tabular-nums text-[var(--hue-bone)]/60">{count}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* MAP */}
            <div className="order-1 lg:order-2 col-span-12 lg:col-span-6 relative h-[420px] md:h-[560px] lg:h-[680px]">
              <div ref={containerRef} className="absolute inset-0" />
              {(loading || tokenLoading) && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#06121b]/90 backdrop-blur-sm z-10">
                  <div className="flex items-center gap-3 text-[var(--hue-bone)]/70">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs tracking-[0.2em] uppercase">Cargando masterplan…</span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-sm bg-black/55 backdrop-blur-md px-3 py-1.5 text-[10px] tracking-[0.22em] uppercase text-[var(--hue-bone)]/70">
                <Compass className="h-3 w-3" /> WGS84 · Satélite
              </div>
            </div>

            {/* SIDEBAR DER */}
            <aside className="order-3 col-span-12 lg:col-span-3 border-t lg:border-t-0 lg:border-l border-white/8 bg-[#06121b]/95 backdrop-blur-md p-4 md:p-6 space-y-6">
              <div className="hue-eyebrow text-[10px] flex items-center gap-2">
                <MapIcon className="h-3 w-3" /> Distribución por superficie
              </div>
              <Donut counts={stats.counts} />

              <div className="hue-divider" />

              <div className="space-y-3">
                <div className="hue-eyebrow text-[10px]">
                  {selected ? 'Lote seleccionado' : 'Ficha de lote'}
                </div>
                {selected ? (
                  <div className="space-y-2">
                    <div className="serif text-3xl text-[var(--hue-bone)] leading-none">
                      {selected.id}
                    </div>
                    <div className="text-[11px] text-[var(--hue-bone)]/55">
                      Superficie: <span className="text-[var(--hue-bone)]">{selected.area_ha} ha</span>
                    </div>
                    <div className="text-[11px] text-[var(--hue-bone)]/55">
                      Precio: <span className="text-[var(--hue-bone)]">{selected.price_uf.toLocaleString('es-CL')} UF</span>
                    </div>
                    <div className="text-[11px] text-[var(--hue-bone)]/55">
                      Estado: <span className="text-[var(--hue-amber)] uppercase tracking-wider">{selected.status}</span>
                    </div>
                    <a
                      href="#contacto"
                      onClick={(e) => {
                        e.preventDefault();
                        document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="mt-3 inline-flex items-center gap-2 border border-[var(--hue-amber)]/50 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-[var(--hue-bone)] hover:bg-[var(--hue-amber)] hover:text-[#050908] transition-all"
                    >
                      Reservar este lote →
                    </a>
                  </div>
                ) : (
                  <p className="text-[11px] text-[var(--hue-bone)]/45 leading-relaxed">
                    Haz click en cualquier lote del mapa para ver superficie, precio en UF y
                    disponibilidad. Usa los filtros para enfocar tu búsqueda.
                  </p>
                )}
              </div>

              <div className="hue-divider" />

              <div className="space-y-2 text-[11px] text-[var(--hue-bone)]/55 leading-relaxed">
                <p>
                  <span className="text-[var(--hue-amber)]">Etapa 1</span> · 87 lotes ya
                  subdividíidos según DL 3.516.
                </p>
                <p>
                  El predio matriz (línea turquesa) abarca {Math.round(stats.totalArea)} ha
                  de costa abierta al Pacífico.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
