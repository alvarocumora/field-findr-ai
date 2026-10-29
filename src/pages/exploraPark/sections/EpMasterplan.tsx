import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion } from 'framer-motion';
import { Loader2, Compass, Layers } from 'lucide-react';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { EXPLORA_PARK_PROJECT } from '../data/project';
import { type EpLotStatus } from '../data/lots';
import { useEpLots } from '../data/useEpLots';
import { useExploraParkState } from '../state/ExploraParkContext';

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
  const [styleReady, setStyleReady] = useState(false);
  const { token, loading: tokenLoading } = useMapboxToken();

  const { lots } = useEpLots();
  const lotsRef = useRef(lots);
  lotsRef.current = lots;

  const {
    activeStatus,
    toggleStatus,
    hoveredLotId,
    setHoveredLotId,
    focusRequest,
  } = useExploraParkState();

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { available: 0, reserved: 0, sold: 0 };
    for (const l of lots) c[l.status]++;
    return c;
  }, [lots]);

  // Live summary based on active filters
  const summary = useMemo(() => {
    const visible = lots.filter((l) => activeStatus.has(l.status));
    const total = visible.length;
    const totalArea = visible.reduce((s, l) => s + l.area_m2, 0);
    const totalPrice = visible.reduce((s, l) => s + l.price_clp, 0);
    return {
      total,
      totalHa: totalArea / 10000,
      avgAreaM2: total ? Math.round(totalArea / total) : 0,
      avgPriceClp: total ? Math.round(totalPrice / total) : 0,
    };
  }, [activeStatus, lots]);

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
        features: lotsRef.current.map((l) => ({
          type: 'Feature',
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
      map.addSource('lots', { type: 'geojson', data: fc, promoteId: 'id' });

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
            ['boolean', ['feature-state', 'hover'], false], 0.92,
            ['boolean', ['feature-state', 'focus'], false], 0.85,
            0.5,
          ],
        },
      });
      map.addLayer({
        id: 'lots-line',
        type: 'line',
        source: 'lots',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false], '#ffffff',
            ['boolean', ['feature-state', 'focus'], false], '#c9b06b',
            'rgba(255,255,255,0.6)',
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false], 2,
            ['boolean', ['feature-state', 'focus'], false], 1.8,
            0.6,
          ],
        },
      });

      // Lot numbers
      const nums: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: lotsRef.current.map((l) => ({
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

      map.on('mousemove', 'lots-fill', (e) => {
        if (!e.features?.length) return;
        map.getCanvas().style.cursor = 'pointer';
        const lotId = (e.features[0].properties)?.id as string | undefined;
        if (lotId) setHoveredLotId(lotId);
      });
      map.on('mouseleave', 'lots-fill', () => {
        map.getCanvas().style.cursor = '';
        setHoveredLotId(null);
      });
      map.on('click', 'lots-fill', (e) => {
        if (!e.features?.length) return;
        openPopupForFeature(map, e.features[0], e.lngLat);
      });

      setStyleReady(true);
      map.once('idle', () => setLoading(false));
    });

    return () => {
      popupRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
      setStyleReady(false);
    };
     
  }, [token, tokenLoading]);

  // Refresca la fuente cuando llegan los datos en vivo (precio/estado/ficha).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const fillSrc = map.getSource('lots') as mapboxgl.GeoJSONSource | undefined;
    const numsSrc = map.getSource('nums') as mapboxgl.GeoJSONSource | undefined;
    if (!fillSrc || !numsSrc) return;
    fillSrc.setData({
      type: 'FeatureCollection',
      features: lots.map((l) => ({
        type: 'Feature',
        id: l.id,
        properties: {
          id: l.id, num: l.lot_number, status: l.status,
          area: l.area_m2, price: l.price_clp, listing_id: l.listing_id ?? '',
        },
        geometry: { type: 'Polygon', coordinates: [[...l.polygon, l.polygon[0]]] },
      })),
    } as GeoJSON.FeatureCollection);
    numsSrc.setData({
      type: 'FeatureCollection',
      features: lots.map((l) => ({
        type: 'Feature',
        properties: { num: l.lot_number, status: l.status },
        geometry: { type: 'Point', coordinates: l.centroid },
      })),
    } as GeoJSON.FeatureCollection);
  }, [lots, styleReady]);

  // Apply status filter
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const filter = ['in', ['get', 'status'], ['literal', Array.from(activeStatus)]];
    try {
      map.setFilter('lots-fill', filter);
      map.setFilter('lots-line', filter);
      map.setFilter('nums-label', filter);
    } catch {
      /* ignore */
    }
  }, [activeStatus, styleReady]);

  // Sync external hover (from grid) → feature-state
  const lastHoverRef = useRef<string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const prev = lastHoverRef.current;
    if (prev && prev !== hoveredLotId) {
      try { map.setFeatureState({ source: 'lots', id: prev }, { hover: false }); } catch { /* The map source may be removed during teardown; feature highlighting is optional. */ }
    }
    if (hoveredLotId) {
      try { map.setFeatureState({ source: 'lots', id: hoveredLotId }, { hover: true }); } catch { /* The map source may be removed during teardown; feature highlighting is optional. */ }
    }
    lastHoverRef.current = hoveredLotId;
  }, [hoveredLotId, styleReady]);

  // Focus request: fly to the lot & open popup
  const lastFocusRef = useRef<string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady || !focusRequest) return;
    const lot = lotsRef.current.find((l) => l.id === focusRequest.lotId);
    if (!lot) return;

    // clear previous focus
    if (lastFocusRef.current && lastFocusRef.current !== lot.id) {
      try { map.setFeatureState({ source: 'lots', id: lastFocusRef.current }, { focus: false }); } catch { /* The map source may be removed during teardown; feature highlighting is optional. */ }
    }
    try { map.setFeatureState({ source: 'lots', id: lot.id }, { focus: true }); } catch { /* The map source may be removed during teardown; feature highlighting is optional. */ }
    lastFocusRef.current = lot.id;

    // compute bounds
    const bounds = lot.polygon.reduce(
      (b, [lng, lat]) => b.extend([lng, lat] as [number, number]),
      new mapboxgl.LngLatBounds(lot.polygon[0] as [number, number], lot.polygon[0] as [number, number]),
    );
    map.fitBounds(bounds, { padding: 120, duration: 900, maxZoom: 18 });

    // synthetic feature for popup
    const feat = {
      properties: {
        id: lot.id,
        num: lot.lot_number,
        status: lot.status,
        area: lot.area_m2,
        price: lot.price_clp,
        listing_id: lot.listing_id ?? '',
      },
    };
    openPopupForFeature(map, feat, { lng: lot.centroid[0], lat: lot.centroid[1] });
  }, [focusRequest, styleReady]);

  function openPopupForFeature(map: mapboxgl.Map, feature: { properties: Record<string, unknown> | null }, lngLat: mapboxgl.LngLatLike) {
    const p = feature.properties || {};
    const status = String(p.status) as StatusFilter;
    const meta = STATUS_META[status];
    const priceStr = Number(p.price).toLocaleString('es-CL');
    const link = p.listing_id
      ? `<a href="/propiedad/${p.listing_id}" style="flex:1;text-align:center;padding:8px 12px;border:1px solid rgba(201,176,107,0.55);background:rgba(201,176,107,0.08);color:#e8e3d8;text-decoration:none;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;border-radius:2px;">Abrir ficha →</a>`
      : `<span style="flex:1;text-align:center;padding:8px 12px;border:1px dashed rgba(255,255,255,0.15);color:rgba(232,227,216,0.5);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;border-radius:2px;">Sin ficha</span>`;
    const scrollBtn = `<button data-ep-scroll-grid="${p.id}" style="padding:8px 10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.03);color:#e8e3d8;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;border-radius:2px;cursor:pointer;">En grilla</button>`;
    const html = `
      <div style="padding:16px 18px;min-width:220px;">
        <div style="font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:${meta.color};margin-bottom:6px;">
          Lote ${p.num} · ${meta.label}
        </div>
        <div style="font-family:'Fraunces',serif;font-size:22px;font-weight:300;color:#e8e3d8;margin-bottom:4px;">
          ${Number(p.area).toLocaleString('es-CL')} m²
        </div>
        <div style="font-size:12px;color:#b8b1a3;margin-bottom:12px;">$${priceStr} CLP</div>
        <div style="display:flex;gap:6px;align-items:stretch;">${link}${scrollBtn}</div>
      </div>`;
    popupRef.current?.setLngLat(lngLat).setHTML(html).addTo(map);

    // wire the "En grilla" button
    setTimeout(() => {
      const el = document.querySelector<HTMLButtonElement>(`button[data-ep-scroll-grid="${p.id}"]`);
      if (el) {
        el.addEventListener('click', () => {
          const target = document.getElementById(`ep-lot-${p.id}`);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          else document.getElementById('lotes')?.scrollIntoView({ behavior: 'smooth' });
        }, { once: true });
      }
    }, 0);
  }

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
            Filtros sincronizados con la grilla. Pasa el mouse sobre una parcela y se resaltará en
            ambos. Haz click para abrir su ficha pública directamente desde el popup.
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
                <div className="hue-eyebrow text-[10px]">Resumen del filtro</div>
                {[
                  ['Parcelas visibles', `${summary.total} / ${EXPLORA_PARK_PROJECT.totalLots}`],
                  ['Superficie filtrada', `${summary.totalHa.toFixed(1)} ha`],
                  ['Superficie promedio', `${summary.avgAreaM2.toLocaleString('es-CL')} m²`],
                  ['Precio promedio', summary.avgPriceClp ? `$${summary.avgPriceClp.toLocaleString('es-CL')}` : '—'],
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
                      onClick={() => toggleStatus(s)}
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
              {hoveredLotId && (
                <div className="pointer-events-none absolute top-3 right-3 z-10 rounded-sm bg-black/60 backdrop-blur-md px-3 py-1.5 text-[10px] tracking-[0.22em] uppercase text-[var(--hue-bone)]/85">
                  Lote {lots.find((l) => l.id === hoveredLotId)?.lot_number ?? ''}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
