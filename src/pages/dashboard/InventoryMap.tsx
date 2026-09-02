import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Layers, ExternalLink, Map as MapIcon } from 'lucide-react';
import { normalizePolygon } from '@/lib/polygonUtils';

type Project = {
  id: string; name: string; slug: string | null; location: string | null; region: string | null;
  latitude: number | null; longitude: number | null; status: string | null;
  total_lots: number | null; available_lots: number | null;
};

type PublicLot = {
  id: string; lot_number: string | null; status: string | null;
  price: number | null; area: number | null; listing_id: string | null;
  polygon: unknown; latitude: number | null; longitude: number | null;
};

const STATUS_COLOR: Record<string, string> = {
  available: '#10b981',
  reserved: '#f59e0b',
  sold: '#64748b',
};

const clp = (n: number | null) => (n ? `$${Math.round(n).toLocaleString('es-CL')}` : 'Consultar');

/**
 * Mapa de inventario (/panel/inventario): todos los loteos del usuario sobre un
 * mapa satelital, con sus parcelas publicadas. Un click en cualquier parcela o
 * en la tarjeta del proyecto abre su landing pública `/p/:slug`.
 */
const InventoryMap = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { token, loading: tokenLoading } = useMapboxToken();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [styleReady, setStyleReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['inventory-map-projects', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, slug, location, region, latitude, longitude, status, total_lots, available_lots')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Project[];
    },
  });

  const activeProject = useMemo(
    () => projects.find(p => p.id === selected) ?? projects[0] ?? null,
    [projects, selected],
  );

  const { data: lots = [] } = useQuery({
    queryKey: ['inventory-map-lots', activeProject?.id],
    enabled: !!activeProject?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_lots', { p_project_id: activeProject!.id });
      if (error) throw error;
      return (data ?? []) as unknown as PublicLot[];
    },
  });

  const landingPath = (p: Project | null) => (p?.slug ? `/p/${p.slug}` : `/proyecto/${p?.id}`);

  // Init map
  useEffect(() => {
    if (!containerRef.current || tokenLoading || !token || mapRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-71.5, -35.0],
      zoom: 5,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.on('load', () => {
      map.addSource('inv-lots', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'inv-lots-fill',
        type: 'fill',
        source: 'inv-lots',
        paint: {
          'fill-color': ['match', ['get', 'status'], 'available', STATUS_COLOR.available, 'reserved', STATUS_COLOR.reserved, 'sold', STATUS_COLOR.sold, '#888'],
          'fill-opacity': 0.45,
        },
      });
      map.addLayer({
        id: 'inv-lots-line',
        type: 'line',
        source: 'inv-lots',
        paint: { 'line-color': 'rgba(255,255,255,0.75)', 'line-width': 0.8 },
      });
      setStyleReady(true);
    });
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      setStyleReady(false);
    };
  }, [token, tokenLoading]);

  // Paint lots of the active project + fit bounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const src = map.getSource('inv-lots') as mapboxgl.GeoJSONSource | undefined;
    if (!src) return;

    const features: GeoJSON.Feature[] = [];
    const bounds = new mapboxgl.LngLatBounds();
    let any = false;

    for (const lot of lots) {
      const norm = normalizePolygon(lot.polygon);
      if (!norm.valid) continue;
      const ring = norm.coordinates as [number, number][];
      ring.forEach(c => bounds.extend(c));
      any = true;
      features.push({
        type: 'Feature',
        properties: {
          id: lot.id,
          num: lot.lot_number,
          status: (lot.status ?? 'available').toLowerCase(),
          price: lot.price,
          area: lot.area,
          published: lot.listing_id ? 1 : 0,
        },
        geometry: { type: 'Polygon', coordinates: [[...ring, ring[0]]] },
      });
    }

    src.setData({ type: 'FeatureCollection', features });

    if (any) map.fitBounds(bounds, { padding: 48, duration: 700, maxZoom: 16 });
    else if (activeProject?.latitude && activeProject?.longitude) {
      map.flyTo({ center: [activeProject.longitude, activeProject.latitude], zoom: 13 });
    }
  }, [lots, styleReady, activeProject]);

  // Click a lot → open project landing
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const onClick = () => navigate(landingPath(activeProject));
    const onEnter = () => { map.getCanvas().style.cursor = 'pointer'; };
    const onLeave = () => { map.getCanvas().style.cursor = ''; };
    map.on('click', 'inv-lots-fill', onClick);
    map.on('mouseenter', 'inv-lots-fill', onEnter);
    map.on('mouseleave', 'inv-lots-fill', onLeave);
    return () => {
      map.off('click', 'inv-lots-fill', onClick);
      map.off('mouseenter', 'inv-lots-fill', onEnter);
      map.off('mouseleave', 'inv-lots-fill', onLeave);
    };
  }, [styleReady, activeProject, navigate]);

  const published = lots.filter(l => l.listing_id).length;
  const priceFrom = lots.reduce<number | null>(
    (min, l) => (l.price && (min === null || l.price < min) ? l.price : min), null,
  );

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mapa de inventario</h1>
          <p className="text-muted-foreground">Tus loteos y las parcelas publicadas. Haz click en el plano para abrir la landing pública.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/asesor/listings"><Layers className="h-4 w-4 mr-2" aria-hidden />Ver listado</Link>
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-[520px] w-full rounded-2xl" />
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-3">
            <MapIcon className="h-10 w-10 mx-auto text-muted-foreground" aria-hidden />
            <p className="font-semibold">Aún no tienes loteos publicados</p>
            <Button asChild><Link to="/asesor/loteos">Crear mi primer loteo</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
          <div className="space-y-3 lg:max-h-[620px] lg:overflow-y-auto pr-1">
            {projects.map(p => {
              const isActive = activeProject?.id === p.id;
              return (
                <Card
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(p.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(p.id); } }}
                  className={`cursor-pointer transition-colors ${isActive ? 'border-primary ring-1 ring-primary/30' : 'hover:border-primary/40'}`}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3" aria-hidden />
                          {[p.location, p.region].filter(Boolean).join(', ') || 'Sin ubicación'}
                        </p>
                      </div>
                      <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>
                        {p.status === 'active' ? 'Publicado' : p.status ?? 'Borrador'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{p.total_lots ?? 0} lotes · {p.available_lots ?? 0} disponibles</span>
                      <Link
                        to={landingPath(p)}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        Ver landing <ExternalLink className="h-3 w-3" aria-hidden />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-semibold">{activeProject?.name}</span>
                <span className="text-muted-foreground">{published} parcelas publicadas</span>
                <span className="text-muted-foreground">Desde {clp(priceFrom)}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {Object.entries({ Disponible: STATUS_COLOR.available, Reservada: STATUS_COLOR.reserved, Vendida: STATUS_COLOR.sold }).map(([label, color]) => (
                  <span key={label} className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} aria-hidden />{label}
                  </span>
                ))}
              </div>
            </div>
            <div ref={containerRef} className="h-[520px] w-full" aria-label={`Mapa de ${activeProject?.name ?? 'inventario'}`} />
            <div className="border-t p-3 flex justify-end">
              <Button asChild size="sm">
                <Link to={landingPath(activeProject)}>Abrir landing pública <ExternalLink className="h-4 w-4 ml-2" aria-hidden /></Link>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InventoryMap;
