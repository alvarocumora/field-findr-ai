import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Copy, ExternalLink, MapPin, MousePointer2, PlayCircle, Ruler, Share2, Trees } from 'lucide-react';
import { toast } from 'sonner';
import { LotMapView } from '@/components/lots/LotMapView';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useSEO } from '@/hooks/useSEO';

type CaoneLotSource = {
  id: string;
  lot_number: string;
  area_ha: number;
  area_m2: number;
  price: number | null;
  status: string;
  lat: number;
  lng: number;
  polygon: [number, number][];
};

type CaoneProjectData = {
  name: string;
  rol: string;
  center: [number, number];
  lots: CaoneLotSource[];
  roads?: GeoJSON.FeatureCollection<GeoJSON.LineString>;
  road_source?: string;
};

const projectUrl = 'https://ofertaterrenos.com/parcelas-caone-hualane';
const tourUrl = 'https://ofertaterrenos.com/parcelas-caone-hualane/tour';

const clp = (value: number | null) =>
  value ? `$${value.toLocaleString('es-CL')}` : 'Consultar';

export default function CaoneTour() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['caone-static-tour'],
    queryFn: async () => {
      const response = await fetch('/data/caone-168-921-lots.json');
      if (!response.ok) throw new Error('No se pudo cargar la geometría del proyecto');
      return (await response.json()) as CaoneProjectData;
    },
  });

  const lots = useMemo(
    () =>
      (data?.lots ?? []).map((lot) => ({
        id: lot.id,
        lot_number: lot.lot_number,
        area: lot.area_m2,
        price: lot.price,
        status: lot.status,
        latitude: lot.lat,
        longitude: lot.lng,
        polygon: lot.polygon,
      })),
    [data],
  );

  useEffect(() => {
    if (!data || selectedLotId) return;
    const requestedLot = searchParams.get('lote');
    if (!requestedLot) return;
    const match = data.lots.find((lot) => lot.lot_number === requestedLot);
    if (match) setSelectedLotId(match.id);
  }, [data, searchParams, selectedLotId]);

  const selectLot = (lotId: string) => {
    setSelectedLotId(lotId);
    const lot = data?.lots.find((candidate) => candidate.id === lotId);
    if (!lot) return;
    const next = new URLSearchParams(searchParams);
    next.set('lote', lot.lot_number);
    setSearchParams(next, { replace: true });
  };

  const selected = data?.lots.find((lot) => lot.id === selectedLotId) ?? null;
  const center = data
    ? { lng: data.center[0], lat: data.center[1] }
    : { lng: -71.65328948, lat: -35.00154536 };

  useSEO({
    title: 'Tour virtual · Parcelas Caone Hualañé',
    description: 'Explora el proyecto Caone ROL 168-921 sobre imagen satelital, selecciona parcelas y revisa superficie y precio.',
    type: 'website',
    url: tourUrl,
    canonicalUrl: tourUrl,
  });

  const copyProjectLink = async () => {
    await navigator.clipboard.writeText(projectUrl);
    toast.success('Link del proyecto copiado');
  };

  const copyTourLink = async () => {
    const url = selected ? `${tourUrl}?lote=${selected.lot_number}` : tourUrl;
    await navigator.clipboard.writeText(url);
    toast.success(selected ? `Link del lote ${selected.lot_number} copiado` : 'Link del tour copiado');
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#071712] text-white">Cargando tour virtual…</div>;
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071712] p-6 text-white">
        <Card className="max-w-md border-white/10 bg-white/5 text-white">
          <CardContent className="p-6 text-center">
            <p className="font-semibold">No pudimos cargar el tour.</p>
            <Button asChild className="mt-4"><Link to="/parcelas-caone-hualane">Volver al proyecto</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#071712] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#071712]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="text-white/80 hover:bg-white/10 hover:text-white">
              <Link to="/parcelas-caone-hualane" aria-label="Volver al proyecto"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">Terrain Tour · satélite + relieve 3D</p>
              <h1 className="truncate text-lg font-bold md:text-xl">Caone · ROL 168-921</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={copyTourLink}>
              <Share2 className="mr-2 h-4 w-4" /> Compartir tour
            </Button>
            <Button asChild className="bg-[#f6c64e] text-[#17352d] hover:bg-[#f6c64e]/90">
              <Link to="/contacto-loteos">Consultar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1680px] px-4 py-5 md:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge className="bg-[#f6c64e] text-[#17352d] hover:bg-[#f6c64e]"><PlayCircle className="mr-1 h-3.5 w-3.5" />Terrain Tour 3D</Badge>
          <Badge className="bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15">38 parcelas ≥ 1 ha</Badge>
          <Badge variant="outline" className="border-white/15 text-white/70">$12.990.000 CLP / ha</Badge>
          <Badge variant="outline" className="border-white/15 text-white/70"><MapPin className="mr-1 h-3 w-3" />Caone, Hualañé</Badge>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
            <div className="border-b border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
              <MousePointer2 className="mr-2 inline h-4 w-4" /> Explora en vista cenital o 3D, inicia el recorrido aéreo y toca una parcela para acercarte. Geometría de parcelas y servidumbres tomada directamente del KMZ del proyecto.
            </div>
            <div className="h-[72vh] min-h-[560px]">
              <LotMapView
                lots={lots}
                projectCenter={center}
                selectedLotId={selectedLotId}
                onLotClick={(lot) => selectLot(lot.id)}
                readOnly
                tourMode
                externalRoads={data.roads ?? null}
              />
            </div>
          </section>

          <aside className="space-y-4">
            <Card className="border-white/10 bg-white/[0.05] text-white">
              <CardContent className="p-5">
                {selected ? (
                  <>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Parcela seleccionada</p>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <h2 className="text-3xl font-black">Lote {selected.lot_number}</h2>
                      <Badge className={selected.status === 'available' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-slate-500/20 text-slate-200'}>
                        {selected.status === 'available' ? 'Disponible' : 'Consultar'}
                      </Badge>
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white/5 p-3"><Ruler className="h-4 w-4 text-emerald-300" /><p className="mt-2 text-xs text-white/50">Superficie</p><p className="font-bold">{selected.area_ha.toFixed(2)} ha</p></div>
                      <div className="rounded-2xl bg-white/5 p-3"><Trees className="h-4 w-4 text-emerald-300" /><p className="mt-2 text-xs text-white/50">Valor lote</p><p className="font-bold">{clp(selected.price)}</p><p className="mt-1 text-[10px] text-white/40">$12.990.000 / ha</p></div>
                    </div>
                    <div className="mt-5 grid gap-2">
                      <Button asChild className="w-full bg-[#f6c64e] text-[#17352d] hover:bg-[#f6c64e]/90">
                        <Link to="/contacto-loteos">Consultar lote {selected.lot_number}</Link>
                      </Button>
                      <Button variant="outline" className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={copyTourLink}>
                        <Share2 className="mr-2 h-4 w-4" />Compartir este lote
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Explora el terreno</p>
                    <h2 className="mt-2 text-2xl font-black">Selecciona una parcela en el mapa</h2>
                    <p className="mt-3 text-sm leading-relaxed text-white/60">Usa Cenital para revisar el master plan, 3D para entender el relieve y Recorrido para una visita aérea automática. Al tocar un lote, la cámara vuela hasta él.</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.05] text-white">
              <CardContent className="p-5">
                <p className="text-sm font-semibold">Link comercial del proyecto</p>
                <p className="mt-2 break-all text-xs text-white/45">{projectUrl}</p>
                <div className="mt-4 grid gap-2">
                  <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={copyProjectLink}><Copy className="mr-2 h-4 w-4" />Copiar link proyecto</Button>
                  <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={copyTourLink}><Share2 className="mr-2 h-4 w-4" />Copiar link tour</Button>
                  <Button asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"><a href={projectUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Abrir proyecto</a></Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
