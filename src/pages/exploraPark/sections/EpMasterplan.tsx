import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion } from 'framer-motion';
import { Loader2, Compass, Layers } from 'lucide-react';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { EXPLORA_PARK_PROJECT } from '../data/project';
import { EXPLORA_PARK_LOTS, type EpLot, type EpLotStatus } from '../data/lots';

type StatusFilter = EpLotStatus;

const STATUS_META: Record<StatusFilter, { color: string; label: string; sub: string }> = {
  available: { color: '#10b981', label: 'Disponible', sub: 'A la venta' },
  reserved: { color: '#f59e0b', label: 'Reservada', sub: 'Con reserva activa' },
  sold: { color: '#64748b', label: 'Vendida', sub: 'No disponible' },
};

export default function EpMasterplan() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<Set<StatusFilter>>(
    new Set<StatusFilter>(['available', 'reserved', 'sold']),
  );
  const { token, loading: tokenLoading } = useMapboxToken();

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { available: 0, reserved: 0, sold: 0 };
    for (const l of EXPLORA_PARK_LOTS) c[l.status]++;
    return c;
  }, []);

  useEffect(() => {
    if (!containerRef.current || tokenLoading || !token || mapRef.current) return;
    mapboxgl.accessToken = token;

    const { bbox, center } = EXPLORA_PARK_PROJECT;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [center.lng, center.lat],
      zoom: 14.5,
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
        features: EXPLORA_PARK_LOTS.map((l, i) => ({
          type: 'Feature',
          id: i,
          properties: {
            id: l.id,
            num: l.lot_number,
            status: l.status,
            area: l.area_m2,
            price: l.price_clp,
            listing_id: l.listing_id ?? '',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[...l.polygon, l.polygon[0]]],
          },
        })),
      };
      map.addSource('lots', { type: 'geojson', data: fc });

      map.addLayer({
        id: 'lots-fill',
        type: 'fill',
        source: 'lots',
        paint: {
          'fill-color': [
            'match', ['get', 'status'],
            'available', STATUS_META.available.color,
            'reserved', STATUS_META.reserved.color,
            'sold', STATUS_META.sold.color,
            '#888',
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false], 0.9,
            0.55,
          ],
        },
      });
      map.addLayer({
        id: 'lots-line',
        type: 'line',
        source: 'lots',
        paint: { 'line-color': 'rgba(255,255,255,0.6)', 'line-width': 0.6 },
      });

      // Lot numbers
      const nums: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: EXPLORA_PARK_LOTS.map((l) => ({
          type: 'Feature',
          properties: { num: l.lot_number, status: l.status },
          geometry: { type: 'Point', coordinates: l.centroid },
        })),
      };
      map.addSource('nums', { type: 'geojson', data: nums });
      map.addLayer({
        id: 'nums-label',
        type: 'symbol',
        source: 'nums',
        minzoom: 15.5,
        layout: {
          'text-field': ['get', 'num'],
          'text-size': 10,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#fff',
          'text-halo-color': 'rgba(0,0,0,0.75)',
          'text-halo-width': 1.2,
        },
      });

      map.fitBounds(
        new mapboxgl.LngLatBounds([bbox.minLng, bbox.minLat], [bbox.maxLng, bbox.maxLat]),
        { padding: 60, duration: 0 },
      );

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
        const status = String(p.status) as StatusFilter;
        const meta = STATUS_META[status];
        const priceStr = Number(p.price).toLocaleString('es-CL');
        const link = p.listing_id
          ? `<a href="/propiedad/${p.listing_id}" style="display:inline-block;margin-top:10px;padding:6px 12px;border:1px solid rgba(201,176,107,0.5);color:#e8e3d8;text-decoration:none;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">Ver ficha →</a>`
          : '';
        const html = `
          <div style="padding:16px 18px;">
            <div style="font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:${meta.color};margin-bottom:6px;">
              Lote ${p.num} · ${meta.label}
            </div>
            <div style="font-family:'Fraunces',serif;font-size:22px;font-weight:300;color:#e8e3d8;margin-bottom:4px;">
              ${Number(p.area).toLocaleString('es-CL')} m²
            </div>
            <div style="font-size:12px;color:#b8b1a3;">$${priceStr} CLP</div>
            ${link}
          </div>`;
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const filter = ['in', ['get', 'status'], ['literal', Array.from(activeStatus)]] as any;
    try {
      map.setFilter('lots-fill', filter);
      map.setFilter('lots-line', filter);
      map.setFilter('nums-label', filter);
    } catch {
      /* layers not ready */
    }
  }, [activeStatus, loading]);

  const toggle = (s: StatusFilter) => {
    setActiveStatus((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  return (
    <section id="masterplan" className="relative px-3 py-24 md:px-6 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between px-2"
        >
          <div>
            <div className="hue-eyebrow mb-3">Masterplan · 437 parcelas interactivas</div>
            <h2 className="serif text-[clamp(2rem,4.5vw,3.2rem)] leading-[0.95]">
              Explora Park <span className="italic text-[var(--hue-bone)]/55">explora cada lote.</span>
            </h2>
          </div>
          <p className="max-w-md text-sm text-[var(--hue-bone)]/55">
            Polígonos generados desde el KMZ oficial (437 parcelas). Filtra por estado y haz click en
            cada lote para ver precio, superficie y ficha pública.
          </p>
        </motion.div>

        <div className="rounded-md overflow-hidden border border-white/8 bg-[#08110c] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]">
          <div className="grid grid-cols-12 gap-0">
            <aside className="order-2 lg:order-1 col-span-12 lg:col-span-3 border-t lg:border-t-0 lg:border-r border-white/8 bg-[#06110a]/95 backdrop-blur-md p-4 md:p-6 space-y-6">
              <div>
                <div className="text-[10px] tracking-[0.32em] uppercase text-[var(--hue-amber)] font-medium">
                  OFERTA TERRENOS
                </div>
                <h3 className="serif text-3xl leading-none mt-2">EXPLORA PARK</h3>
                <p className="text-[11px] tracking-[0.18em] uppercase text-[var(--hue-bone)]/55 mt-2">
                  Hualañé · Maule
                </p>
              </div>

              <div className="hue-divider" />

              <div className="space-y-3">
                <div className="hue-eyebrow text-[10px]">Resumen</div>
                {[
                  ['Superficie total', `${EXPLORA_PARK_PROJECT.totalAreaHa} ha`],
                  ['Parcelas totales', String(EXPLORA_PARK_PROJECT.totalLots)],
                  ['Superficie promedio', `${EXPLORA_PARK_PROJECT.avgAreaM2.toLocaleString('es-CL')} m²`],
                  ['Precio promedio', `$${EXPLORA_PARK_PROJECT.avgPriceClp.toLocaleString('es-CL')}`],
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
                  <Layers className="h-3 w-3" /> Filtros por estado
                </div>
                {(Object.keys(STATUS_META) as StatusFilter[]).map((s) => {
                  const active = activeStatus.has(s);
                  const meta = STATUS_META[s];
                  return (
                    <button
                      key={s}
                      onClick={() => toggle(s)}
                      className={`w-full flex items-center gap-3 px-2 py-1.5 rounded transition ${
                        active ? 'bg-white/5' : 'opacity-40 hover:opacity-70'
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-sm shrink-0 ring-2 ring-white/10"
                        style={{ background: meta.color }}
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-[11px] text-[var(--hue-bone)] leading-tight">{meta.label}</div>
                        <div className="text-[10px] text-[var(--hue-bone)]/45">{meta.sub}</div>
                      </div>
                      <span className="text-[10px] tabular-nums text-[var(--hue-bone)]/60">
                        {counts[s]}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="hue-divider" />

              <Link
                to="#lotes"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('lotes')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hue-pill w-full justify-center hover:bg-white/8 transition"
              >
                Ver grilla de lotes →
              </Link>
            </aside>

            <div className="order-1 lg:order-2 col-span-12 lg:col-span-9 relative h-[440px] md:h-[600px] lg:h-[720px]">
              <div ref={containerRef} className="absolute inset-0" />
              {(loading || tokenLoading) && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#06110a]/90 backdrop-blur-sm z-10">
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
          </div>
        </div>
      </div>
    </section>
  );
}
