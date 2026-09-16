import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion } from 'framer-motion';
import { Loader2, Compass, Layers, Mountain } from 'lucide-react';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { useTerrainElevation } from '@/hooks/useTerrainElevation';
import { VEL_PROJECT } from '../data/project';
import { type VelLotStatus } from '../data/lots';
import { useVelLots } from '../data/useVelLots';
import { useVelState } from '../state/VelContext';
import { VEL_POIS } from '../data/poi';
import VelLotPanel from '../components/VelLotPanel';

type StatusFilter = VelLotStatus;

const STATUS_META: Record<StatusFilter, { color: string; label: string; sub: string }> = {
  available: { color: '#10b981', label: 'Disponible', sub: 'A la venta' },
  reserved: { color: '#f59e0b', label: 'Reservada', sub: 'Con reserva activa' },
  sold: { color: '#64748b', label: 'Vendida', sub: 'No disponible' },
};

export default function VelMasterplan() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [styleReady, setStyleReady] = useState(false);
  const [terrain3d, setTerrain3d] = useState(false);
  const { token, loading: tokenLoading } = useMapboxToken();
  const { data: terrainData, loading: terrainLoading, getElevation } = useTerrainElevation();

  const { lots } = useVelLots();
  const lotsRef = useRef(lots);
  lotsRef.current = lots;

  const {
    activeStatus,
    toggleStatus,
    hoveredLotId,
    setHoveredLotId,
    selectedLotId,
    selectLot,
    focusRequest,
    requestFocus,
    poiRequest,
  } = useVelState();

  const selectedLot = useMemo(
    () => lots.find((lot) => lot.id === selectedLotId) ?? null,
    [lots, selectedLotId],
  );

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

    const { bbox, center } = VEL_PROJECT;
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

      map.addSource('vel-terrain', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      map.addLayer({
        id: 'vel-hillshade',
        type: 'hillshade',
        source: 'vel-terrain',
        layout: { visibility: 'none' },
        paint: {
          'hillshade-exaggeration': 0.45,
          'hillshade-shadow-color': '#06110a',
          'hillshade-highlight-color': '#d8c58b',
        },
      });

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
        const lotId = (e.features[0].properties as any)?.id as string | undefined;
        if (lotId) setHoveredLotId(lotId);
      });
      map.on('mouseleave', 'lots-fill', () => {
        map.getCanvas().style.cursor = '';
        setHoveredLotId(null);
      });
      map.on('click', 'lots-fill', (e) => {
        if (!e.features?.length) return;
        const lotId = (e.features[0].properties as any)?.id as string | undefined;
        if (lotId) selectLot(lotId);
      });

      setStyleReady(true);
      map.once('idle', () => setLoading(false));
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      setStyleReady(false);
    };
     
  }, [token, tokenLoading]);

  // Terrain View: relieve Mapbox + cámara oblicua.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    try {
      map.setTerrain(terrain3d ? { source: 'vel-terrain', exaggeration: 1.18 } : null);
      map.setLayoutProperty('vel-hillshade', 'visibility', terrain3d ? 'visible' : 'none');
      map.easeTo({
        pitch: terrain3d ? 52 : 0,
        bearing: terrain3d ? -18 : 0,
        duration: 900,
      });
    } catch {
      // El estilo todavía puede estar terminando de montar la fuente DEM.
    }
  }, [terrain3d, styleReady]);

  useEffect(() => {
    if (!selectedLot || !token) return;
    void getElevation(selectedLot.polygon, selectedLot.id, token);
  }, [selectedLot, token, getElevation]);

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
    const filter = ['in', ['get', 'status'], ['literal', Array.from(activeStatus)]] as any;
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
      try { map.setFeatureState({ source: 'lots', id: prev }, { hover: false }); } catch {}
    }
    if (hoveredLotId) {
      try { map.setFeatureState({ source: 'lots', id: hoveredLotId }, { hover: true }); } catch {}
    }
    lastHoverRef.current = hoveredLotId;
  }, [hoveredLotId, styleReady]);

  // Puntos de interés del entorno
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const markers = VEL_POIS.map((poi) => {
      const el = document.createElement('div');
      el.className = 'vel-poi-marker';
      el.style.cssText =
        'display:flex;align-items:center;gap:6px;padding:3px 8px;border-radius:999px;' +
        'background:rgba(6,17,10,.82);border:1px solid rgba(201,176,107,.45);' +
        'color:#efe7d6;font-size:10px;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap';
      el.textContent = `${poi.name} · ${poi.distanceKm} km`;
      return new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([poi.lng, poi.lat])
        .addTo(map);
    });
    return () => markers.forEach((m) => m.remove());
  }, [styleReady]);

  // POI focus request (desde la sección Entorno)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady || !poiRequest) return;
    const poi = VEL_POIS.find((p) => p.key === poiRequest.poiKey);
    if (!poi) return;
    const bounds = new mapboxgl.LngLatBounds(
      [VEL_PROJECT.center.lng, VEL_PROJECT.center.lat],
      [VEL_PROJECT.center.lng, VEL_PROJECT.center.lat],
    ).extend([poi.lng, poi.lat]);
    map.fitBounds(bounds, { padding: 90, duration: 1200, maxZoom: 13 });
  }, [poiRequest, styleReady]);

  // Focus request: fly to the lot & open popup
  const lastFocusRef = useRef<string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady || !focusRequest) return;
    const lot = lotsRef.current.find((l) => l.id === focusRequest.lotId);
    if (!lot) return;

    // clear previous focus
    if (lastFocusRef.current && lastFocusRef.current !== lot.id) {
      try { map.setFeatureState({ source: 'lots', id: lastFocusRef.current }, { focus: false }); } catch {}
    }
    try { map.setFeatureState({ source: 'lots', id: lot.id }, { focus: true }); } catch {}
    lastFocusRef.current = lot.id;

    // compute bounds
    const bounds = lot.polygon.reduce(
      (b, [lng, lat]) => b.extend([lng, lat] as [number, number]),
      new mapboxgl.LngLatBounds(lot.polygon[0] as [number, number], lot.polygon[0] as [number, number]),
    );
    map.fitBounds(bounds, { padding: 120, duration: 900, maxZoom: 18, pitch: terrain3d ? 52 : 0, bearing: terrain3d ? -18 : 0 });

    selectLot(lot.id);
  }, [focusRequest, styleReady, terrain3d, selectLot]);

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
            <div className="hue-eyebrow mb-3">Masterplan · {VEL_PROJECT.totalLots} parcelas interactivas</div>
            <h2 className="serif text-[clamp(2rem,4.5vw,3.2rem)] leading-[0.95]">
              Valle Escondido Licantén <span className="italic text-[var(--hue-bone)]/55">explora cada lote.</span>
            </h2>
          </div>
          <p className="max-w-md text-sm text-[var(--hue-bone)]/55">
            Explora el proyecto en satélite o relieve 3D. Selecciona una parcela para ver Rural Score,
            elevación estimada, precio por m² y acciones comerciales en una sola ficha.
          </p>
        </motion.div>

        <div className="rounded-md overflow-hidden border border-white/8 bg-[#08110c] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]">
          <div className="grid grid-cols-12 gap-0">
            <aside className="order-2 lg:order-1 col-span-12 lg:col-span-3 border-t lg:border-t-0 lg:border-r border-white/8 bg-[#06110a]/95 backdrop-blur-md p-4 md:p-6 space-y-6">
              <div>
                <div className="text-[10px] tracking-[0.32em] uppercase text-[var(--hue-amber)] font-medium">
                  OFERTA TERRENOS
                </div>
                <h3 className="serif text-3xl leading-none mt-2">VALLE ESCONDIDO</h3>
                <p className="text-[11px] tracking-[0.18em] uppercase text-[var(--hue-bone)]/55 mt-2">
                  Licantén · Maule
                </p>
              </div>

              <div className="hue-divider" />

              <div className="space-y-3">
                <div className="hue-eyebrow text-[10px]">Resumen del filtro</div>
                {[
                  ['Parcelas visibles', `${summary.total} / ${VEL_PROJECT.totalLots}`],
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
              <div className="absolute left-3 top-3 z-20">
                <button
                  type="button"
                  onClick={() => setTerrain3d((value) => !value)}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-[10px] uppercase tracking-[0.12em] backdrop-blur-md transition ${
                    terrain3d
                      ? 'border-[var(--hue-amber)]/70 bg-[var(--hue-amber)] text-[#07110b]'
                      : 'border-white/15 bg-black/55 text-[var(--hue-bone)] hover:border-[var(--hue-amber)]/45'
                  }`}
                >
                  <Mountain className="h-3.5 w-3.5" />
                  {terrain3d ? 'Terrain 3D activo' : 'Terrain 3D'}
                </button>
              </div>
              {(loading || tokenLoading) && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#06110a]/90 backdrop-blur-sm z-10">
                  <div className="flex items-center gap-3 text-[var(--hue-bone)]/70">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs tracking-[0.2em] uppercase">Cargando masterplan…</span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-sm bg-black/55 backdrop-blur-md px-3 py-1.5 text-[10px] tracking-[0.22em] uppercase text-[var(--hue-bone)]/70">
                <Compass className="h-3 w-3" /> WGS84 · {terrain3d ? 'Terrain 3D' : 'Satélite'}
              </div>
              {selectedLot && (
                <VelLotPanel
                  lot={selectedLot}
                  allLots={lots}
                  terrain={terrainData}
                  terrainLoading={terrainLoading}
                  onClose={() => selectLot(null)}
                  onFocus={() => {
                    setTerrain3d(true);
                    requestFocus(selectedLot.id);
                  }}
                />
              )}
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
