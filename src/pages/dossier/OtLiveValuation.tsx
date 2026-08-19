import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2, TrendingUp, RefreshCw, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { useUfRate } from '@/hooks/useUfRate';
import { PROPIEDAD } from './islaMaipoData';

interface RawComp {
  id: string;
  title: string;
  price: number;
  currency: string;
  area_m2: number | null;
  location: string;
  source_url: string;
  source_portal: string;
}

interface Comp extends RawComp {
  ufM2: number;
  lat: number;
  lng: number;
}

/** Predios grandes transan bajo el valor unitario de sitios pequeños (factor escala). */
const ESCALA_MACROPREDIO = 0.55;
const BANDA = 0.12;

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const uf0 = (n: number) => n.toLocaleString('es-CL', { maximumFractionDigits: 0 });
const uf2 = (n: number) => n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function geocode(location: string, token: string): Promise<[number, number] | null> {
  try {
    const q = encodeURIComponent(`${location}, Región Metropolitana, Chile`);
    const r = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?country=CL&limit=1&access_token=${token}`,
    );
    const j = await r.json();
    const c = j?.features?.[0]?.center;
    return Array.isArray(c) && c.length === 2 ? [c[0], c[1]] : null;
  } catch {
    return null;
  }
}

export default function OtLiveValuation() {
  const { token } = useMapboxToken();
  const { today: ufToday } = useUfRate();
  const [comps, setComps] = useState<Comp[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 1. Cargar comparables reales de portales (zona Isla de Maipo / Talagante)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase.functions.invoke(
          'scrape-real-listings?zone=isla-de-maipo&country=chile&limit=24',
          { method: 'GET' },
        );
        const raw = ((data?.listings ?? []) as RawComp[]).filter(
          (l) => l.price > 0 && l.area_m2 && l.area_m2 > 300,
        );
        if (!token) {
          if (!cancelled) { setComps([]); setLoading(false); }
          return;
        }
        const enriched: Comp[] = [];
        for (const l of raw.slice(0, 14)) {
          const ufM2 =
            (l.currency === 'UF' ? l.price : l.price / (ufToday || 39500)) / (l.area_m2 as number);
          if (!Number.isFinite(ufM2) || ufM2 <= 0 || ufM2 > 30) continue;
          const c = await geocode(l.location, token);
          if (!c) continue;
          enriched.push({ ...l, ufM2, lng: c[0], lat: c[1] });
        }
        if (!cancelled) {
          setComps(enriched);
          setUpdatedAt(new Date());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token, ufToday, reloadKey]);

  const stats = useMemo(() => {
    if (comps.length === 0) return null;
    const vals = comps.map((c) => c.ufM2);
    const med = median(vals);
    const ufM2Predio = med * ESCALA_MACROPREDIO;
    const valor = ufM2Predio * PROPIEDAD.superficieTotalM2;
    return {
      n: comps.length,
      min: Math.min(...vals),
      max: Math.max(...vals),
      med,
      ufM2Predio,
      valor,
      bajo: valor * (1 - BANDA),
      alto: valor * (1 + BANDA),
    };
  }, [comps]);

  // 2. Mapa en vivo
  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [PROPIEDAD.lng, PROPIEDAD.lat],
      zoom: 10.5,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    const el = document.createElement('div');
    el.className =
      'h-5 w-5 rounded-full border-2 border-white bg-primary shadow-[0_0_0_6px_hsl(var(--primary)/0.25)]';
    new mapboxgl.Marker({ element: el })
      .setLngLat([PROPIEDAD.lng, PROPIEDAD.lat])
      .setPopup(new mapboxgl.Popup({ offset: 14 }).setHTML('<strong>Predio Gálvez 1458</strong><br/>18,41 ha'))
      .addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [token]);

  // 3. Marcadores de comparables
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    comps.forEach((c) => {
      const el = document.createElement('div');
      el.className =
        'rounded-full border border-white/70 bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-black shadow';
      el.textContent = `${uf2(c.ufM2)} UF/m²`;
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([c.lng, c.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 12 }).setHTML(
            `<div style="max-width:220px"><strong>${c.title.replace(/</g, '')}</strong><br/>${
              c.area_m2?.toLocaleString('es-CL')
            } m² · ${c.location}<br/><a href="${c.source_url}" target="_blank" rel="noopener">Ver en ${
              c.source_portal
            }</a></div>`,
          ),
        )
        .addTo(map);
      markersRef.current.push(marker);
    });
    if (comps.length > 0) {
      const b = new mapboxgl.LngLatBounds([PROPIEDAD.lng, PROPIEDAD.lat], [PROPIEDAD.lng, PROPIEDAD.lat]);
      comps.forEach((c) => b.extend([c.lng, c.lat]));
      map.fitBounds(b, { padding: 60, maxZoom: 12, duration: 800 });
    }
  }, [comps]);

  const deltaTranssa = stats ? (stats.valor / PROPIEDAD.tasacionUf - 1) * 100 : 0;

  return (
    <section className="mt-12" aria-label="Tasación OFERTA TERRENOS en vivo">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-primary">OFERTA TERRENOS · Valuation</p>
          <h2 className="mt-1 text-2xl font-semibold text-foreground">Tasación en vivo con mercado real</h2>
          <p className="text-sm text-muted-foreground">
            Valor de mercado estimado a partir de terrenos publicados hoy en Isla de Maipo, Talagante y El Monte.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Actualizar mercado
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="overflow-hidden rounded-xl border">
          <div ref={containerRef} className="h-[380px] w-full bg-muted md:h-[460px]" />
          <div className="flex flex-wrap items-center justify-between gap-2 bg-card px-4 py-2.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Predio en evaluación
              <span className="ml-3 h-2.5 w-2.5 rounded-full bg-amber-500" /> Comparables publicados
            </span>
            <span>
              {updatedAt ? `Actualizado ${updatedAt.toLocaleString('es-CL')}` : 'Cargando mercado…'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" /> Valor de mercado OT
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {loading && !stats ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Consultando portales…
                </div>
              ) : stats ? (
                <>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Valor estimado</p>
                    <p className="text-2xl font-semibold text-foreground">UF {uf0(stats.valor)}</p>
                    <p className="text-xs text-muted-foreground">
                      Rango UF {uf0(stats.bajo)} – UF {uf0(stats.alto)} ·{' '}
                      {ufToday ? `≈ $${(stats.valor * ufToday).toLocaleString('es-CL', { maximumFractionDigits: 0 })}` : ''}
                    </p>
                  </div>
                  <Separator />
                  <ul className="space-y-1.5">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Comparables activos</span>
                      <span className="font-medium text-foreground">{stats.n}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Mediana mercado</span>
                      <span className="font-medium text-foreground">{uf2(stats.med)} UF/m²</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Rango observado</span>
                      <span className="font-medium text-foreground">
                        {uf2(stats.min)} – {uf2(stats.max)} UF/m²
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Unitario aplicado al predio</span>
                      <span className="font-medium text-foreground">{uf2(stats.ufM2Predio)} UF/m²</span>
                    </li>
                  </ul>
                  <Separator />
                  <ul className="space-y-1.5">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Tasación Transsa {PROPIEDAD.tasacionFecha}</span>
                      <span className="font-medium text-foreground">UF {uf0(PROPIEDAD.tasacionUf)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Diferencia vs. mercado hoy</span>
                      <Badge variant={deltaTranssa >= 0 ? 'default' : 'secondary'}>
                        {deltaTranssa >= 0 ? '+' : ''}
                        {deltaTranssa.toFixed(1)}%
                      </Badge>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Avalúo fiscal (3 roles)</span>
                      <span className="font-medium text-foreground">
                        ${PROPIEDAD.avaluoFiscal.toLocaleString('es-CL')}
                      </span>
                    </li>
                  </ul>
                </>
              ) : (
                <p className="text-muted-foreground">
                  No hay comparables publicados disponibles en este momento. La tasación de referencia sigue siendo
                  el informe {PROPIEDAD.tasador} por UF {uf0(PROPIEDAD.tasacionUf)}.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4 text-primary" /> Metodología
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p>
                Enfoque comparativo de mercado (IVS 2022): se recogen ofertas vigentes de terrenos en la comuna y
                comunas colindantes, se normaliza el precio a UF/m² con la UF del día
                {ufToday ? ` ($${ufToday.toLocaleString('es-CL')})` : ''} y se toma la mediana para descartar
                extremos.
              </p>
              <p>
                Al ser un macropredio de {(PROPIEDAD.superficieTotalM2 / 10000).toLocaleString('es-CL')} ha se
                aplica un factor de escala de {ESCALA_MACROPREDIO * 100}% sobre el unitario de sitios menores, y se
                expresa un rango de ±{BANDA * 100}% como valor razonable (FMV).
              </p>
              <p>
                Estimación referencial de OFERTA TERRENOS con datos de oferta pública; no reemplaza una tasación
                formal ni constituye oferta de crédito.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
