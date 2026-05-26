import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion } from 'framer-motion';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { HUELLELHUE_DATA } from '../data/lots';
import { Loader2 } from 'lucide-react';

const COLOR_MAP: Record<string, string> = {
  ocean_front: '#1e6091',
  forest_ocean: '#3a7d44',
  bosque_vivo: '#5a6b35',
  eco_lodge: '#c9a86b',
  wellness: '#d4b78a',
  glamping: '#b89460',
  gastronomy: '#a07d4f',
  research: '#8b6a44',
  conservation_core: '#0d2818',
};

const LEGEND = [
  { color: '#1e6091', label: 'Ocean Front Reserve', sub: '24 lotes · ~3,2 ha' },
  { color: '#3a7d44', label: 'Forest Ocean Residences', sub: '42 lotes · ~2,1 ha' },
  { color: '#5a6b35', label: 'Bosque Vivo', sub: '28 lotes · ~1,5 ha' },
  { color: '#c9a86b', label: 'Macrolotes Operativos', sub: '3 zonas · 6-10 ha' },
  { color: '#0d2818', label: 'Reserva Núcleo', sub: '~120 ha intocadas' },
];

export default function HueMasterplan() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const { token, loading: tokenLoading } = useMapboxToken();

  useEffect(() => {
    if (!containerRef.current || tokenLoading || !token || mapRef.current) return;

    mapboxgl.accessToken = token;
    const [lng, lat] = HUELLELHUE_DATA.center as [number, number];

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [lng, lat],
      zoom: 13.2,
      pitch: 55,
      bearing: -25,
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
      // 3D terrain
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.4 });

      // Sky atmospheric
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0, 60],
          'sky-atmosphere-sun-intensity': 12,
        },
      });

      // Lots source
      const fc: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: HUELLELHUE_DATA.lots.map((l, idx) => ({
          ...l,
          id: idx,
        })) as unknown as GeoJSON.Feature[],
      };
      map.addSource('lots', { type: 'geojson', data: fc, generateId: false });

      // Conservation core (background)
      map.addLayer({
        id: 'lots-conservation-fill',
        type: 'fill',
        source: 'lots',
        filter: ['==', ['get', 'category'], 'conservation_core'],
        paint: {
          'fill-color': '#0d2818',
          'fill-opacity': 0.55,
        },
      });
      map.addLayer({
        id: 'lots-conservation-line',
        type: 'line',
        source: 'lots',
        filter: ['==', ['get', 'category'], 'conservation_core'],
        paint: {
          'line-color': '#1a4030',
          'line-width': 1,
          'line-dasharray': [4, 3],
        },
      });

      // Residential lots fill (line 1/2/3)
      map.addLayer({
        id: 'lots-fill',
        type: 'fill',
        source: 'lots',
        filter: ['in', ['get', 'category'], ['literal', ['ocean_front', 'forest_ocean', 'bosque_vivo']]],
        paint: {
          'fill-color': [
            'match',
            ['get', 'category'],
            'ocean_front', '#1e6091',
            'forest_ocean', '#3a7d44',
            'bosque_vivo', '#5a6b35',
            '#444',
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false], 0.85,
            0.55,
          ],
        },
      });
      map.addLayer({
        id: 'lots-line',
        type: 'line',
        source: 'lots',
        filter: ['in', ['get', 'category'], ['literal', ['ocean_front', 'forest_ocean', 'bosque_vivo']]],
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false], '#e8e3d8',
            'rgba(232,227,216,0.4)',
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false], 2,
            0.6,
          ],
        },
      });

      // Macrolots
      map.addLayer({
        id: 'lots-macro-fill',
        type: 'fill',
        source: 'lots',
        filter: ['==', ['get', 'line'], 'macro'],
        paint: {
          'fill-color': '#c9a86b',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false], 0.6,
            0.35,
          ],
        },
      });
      map.addLayer({
        id: 'lots-macro-line',
        type: 'line',
        source: 'lots',
        filter: ['==', ['get', 'line'], 'macro'],
        paint: {
          'line-color': '#c9a86b',
          'line-width': 1.4,
        },
      });

      // Perímetro real KMZ — overlay de verificación (halo + línea brillante)
      const perim = HUELLELHUE_DATA.perimeter as unknown as GeoJSON.Feature;
      map.addSource('perimeter', { type: 'geojson', data: perim });
      map.addLayer({
        id: 'perimeter-halo',
        type: 'line',
        source: 'perimeter',
        paint: {
          'line-color': '#ffd166',
          'line-width': 8,
          'line-opacity': 0.18,
          'line-blur': 4,
        },
      });
      map.addLayer({
        id: 'perimeter-line',
        type: 'line',
        source: 'perimeter',
        paint: {
          'line-color': '#ffd166',
          'line-width': 2.5,
          'line-opacity': 0.95,
        },
      });

      // Centroides — verificación visual
      const centroidsFC: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: HUELLELHUE_DATA.lots
          .filter((l: any) => l.properties.category !== 'conservation_core')
          .map((l: any) => {
            const ring = l.geometry.coordinates[0] as [number, number][];
            let sx = 0, sy = 0;
            for (const [x, y] of ring) { sx += x; sy += y; }
            const n = ring.length;
            return {
              type: 'Feature' as const,
              properties: { category: l.properties.category, id: l.properties.id },
              geometry: { type: 'Point' as const, coordinates: [sx / n, sy / n] },
            };
          }),
      };
      map.addSource('centroids', { type: 'geojson', data: centroidsFC });
      map.addLayer({
        id: 'centroids-dot',
        type: 'circle',
        source: 'centroids',
        paint: {
          'circle-radius': 3,
          'circle-color': [
            'match', ['get', 'category'],
            'ocean_front', '#5fb6ff',
            'forest_ocean', '#7fdb8a',
            'bosque_vivo', '#c7d97a',
            '#ffd166',
          ],
          'circle-stroke-color': '#000',
          'circle-stroke-width': 1,
          'circle-opacity': 0.95,
        },
      });

      // Ajustar cámara al perímetro real para verificación
      const coords = (perim.geometry as any).coordinates[0] as [number, number][];
      const b = new mapboxgl.LngLatBounds();
      coords.forEach((c) => b.extend(c));
      map.fitBounds(b, { padding: 60, pitch: 50, bearing: -20, duration: 0 });

      // Hover state
      let hoveredId: number | null = null;
      const interactiveLayers = ['lots-fill', 'lots-macro-fill', 'lots-conservation-fill'];

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
          const f = e.features[0];
          const p = f.properties || {};
          const lineLabel: Record<string, string> = {
            '1': 'Primera línea',
            '2': 'Segunda línea',
            '3': 'Tercera línea',
            'macro': 'Macrolote operativo',
            'conservation': 'Reserva núcleo',
          };

          const html = `
            <div style="padding: 24px 22px;">
              <div style="font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#c9a86b;margin-bottom:8px;">
                ${lineLabel[String(p.line)] || ''}
              </div>
              <div style="font-family:'Fraunces',serif;font-size:24px;font-weight:300;line-height:1.1;margin-bottom:4px;color:#e8e3d8;">
                ${p.name}
              </div>
              <div style="font-size:11px;color:#b8b1a3;margin-bottom:18px;font-family:monospace;">
                ID ${p.id} · ${p.area_ha} ha
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:11px;color:#b8b1a3;border-top:1px solid rgba(232,227,216,0.15);padding-top:14px;">
                <div>
                  <div style="font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#c9a86b;margin-bottom:3px;">Océano</div>
                  <div style="color:#e8e3d8;">${p.ocean_exposure}</div>
                </div>
                <div>
                  <div style="font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#c9a86b;margin-bottom:3px;">Privacidad</div>
                  <div style="color:#e8e3d8;">${p.privacy}</div>
                </div>
                <div style="grid-column:span 2;">
                  <div style="font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#c9a86b;margin-bottom:3px;">Conservación</div>
                  <div style="color:#e8e3d8;">${p.conservation}</div>
                </div>
                <div style="grid-column:span 2;">
                  <div style="font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#c9a86b;margin-bottom:3px;">Arquitectura sugerida</div>
                  <div style="color:#e8e3d8;font-style:italic;">${p.architecture}</div>
                </div>
              </div>
            </div>
          `;
          popupRef.current?.setLngLat(e.lngLat).setHTML(html).addTo(map);
        });
      });

      // Subtle camera idle rotation for cinematic feel
      let bearing = -25;
      const idleRotate = setInterval(() => {
        if (!map.isMoving() && !popupRef.current?.isOpen()) {
          bearing = (bearing - 0.04) % 360;
          map.setBearing(bearing);
        }
      }, 60);

      map.once('idle', () => setLoading(false));

      return () => clearInterval(idleRotate);
    });

    return () => {
      popupRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [token, tokenLoading]);

  // Filter application
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const baseCats = ['ocean_front', 'forest_ocean', 'bosque_vivo'];
    if (activeFilter === null) {
      map.setLayoutProperty('lots-fill', 'visibility', 'visible');
      map.setLayoutProperty('lots-line', 'visibility', 'visible');
      map.setLayoutProperty('lots-macro-fill', 'visibility', 'visible');
      map.setLayoutProperty('lots-macro-line', 'visibility', 'visible');
      map.setLayoutProperty('lots-conservation-fill', 'visibility', 'visible');
    } else if (baseCats.includes(activeFilter)) {
      map.setFilter('lots-fill', ['==', ['get', 'category'], activeFilter]);
      map.setFilter('lots-line', ['==', ['get', 'category'], activeFilter]);
    }
  }, [activeFilter]);

  return (
    <section className="relative px-4 py-24 md:px-8 lg:px-12">
      <div className="mx-auto max-w-[1600px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between px-2"
        >
          <div>
            <div className="hue-eyebrow mb-3">Masterplan interactivo · Lote B</div>
            <h2 className="serif text-[clamp(2rem,5vw,3.5rem)] leading-[0.95]">
              Explora la reserva <span className="italic text-[var(--hue-bone)]/60">en tiempo real.</span>
            </h2>
          </div>
          <p className="max-w-md text-sm text-[var(--hue-bone)]/55">
            Sobrevuelo cinematográfico sobre coordenadas reales UTM 18S del plano topográfico.
            Hover sobre cualquier polígono para inspeccionar.
          </p>
        </motion.div>

        <div className="hue-map-container">
          <div ref={containerRef} className="absolute inset-0" />
          <div className="hue-map-vignette" />

          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#050908]">
              <div className="flex flex-col items-center gap-3 text-[var(--hue-bone)]/60">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="hue-eyebrow">Cargando reserva</span>
              </div>
            </div>
          )}

          {/* Legend overlay */}
          <div className="absolute left-4 top-4 z-10 max-w-[260px] rounded-sm bg-black/65 p-4 backdrop-blur-md border border-white/10">
            <div className="hue-eyebrow mb-3 text-[var(--hue-amber)]">Leyenda</div>
            <div className="space-y-2.5">
              {LEGEND.map((l) => (
                <div key={l.label} className="flex items-start gap-3">
                  <span
                    className="mt-1 inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ background: l.color, boxShadow: `0 0 8px ${l.color}` }}
                  />
                  <div className="text-[11px] leading-tight">
                    <div className="text-[var(--hue-bone)]">{l.label}</div>
                    <div className="text-[var(--hue-bone)]/45 mt-0.5">{l.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats overlay */}
          <div className="absolute right-4 top-4 z-10 hidden md:flex gap-px bg-black/65 backdrop-blur-md border border-white/10">
            {[
              { l: 'Lotes residenciales', v: '178' },
              { l: 'Macrolotes', v: '5' },
              { l: 'Reserva', v: '250 ha' },
            ].map((s) => (
              <div key={s.l} className="px-5 py-3">
                <div className="serif text-2xl text-[var(--hue-bone)]">{s.v}</div>
                <div className="hue-eyebrow mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--hue-bone)]/40 px-4">
          Coordenadas reales UTM 18S WGS84 · Plano topográfico Fundo Hueyelhue (Luis San Juan Sepúlveda 2007).
          Distribución preliminar sujeta a estudios sectoriales.
        </p>
      </div>
    </section>
  );
}
