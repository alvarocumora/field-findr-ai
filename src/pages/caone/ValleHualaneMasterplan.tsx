import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { jsPDF } from 'jspdf';
import { Download, ExternalLink, MapPin, Mountain, Printer, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { useSEO } from '@/hooks/useSEO';
import { toast } from 'sonner';

type LotSource = {
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

type MasterplanData = {
  name: string;
  rol: string;
  center: [number, number];
  price_per_ha?: number;
  lots: LotSource[];
  roads?: GeoJSON.FeatureCollection<GeoJSON.LineString>;
  road_source?: string;
};

const DATA_URL = '/data/caone-168-921-lots.json';
const LOGO_URL = '/brands/valle-de-hualane-logo.svg';
const PRICE_PER_HA = 12_990_000;

const clp = (value: number) => '$' + value.toLocaleString('es-CL');

const closePolygon = (coords: [number, number][]) => {
  if (coords.length === 0) return coords;
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return coords;
  return [...coords, first];
};

const lotsGeoJson = (lots: LotSource[]): GeoJSON.FeatureCollection<GeoJSON.Polygon> => ({
  type: 'FeatureCollection',
  features: lots.map((lot) => ({
    type: 'Feature',
    id: lot.id,
    properties: {
      id: lot.id,
      lot_number: lot.lot_number,
      area_ha: lot.area_ha,
      price: lot.price,
      status: lot.status,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [closePolygon(lot.polygon)],
    },
  })),
});

const projectBounds = (lots: LotSource[]) => {
  const bounds = new mapboxgl.LngLatBounds();
  lots.forEach((lot) => lot.polygon.forEach(([lng, lat]) => bounds.extend([lng, lat])));
  return bounds;
};

async function svgToPngDataUrl(svgUrl: string, width = 1400) {
  const svg = await fetch(svgUrl).then((r) => r.text());
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
    const ratio = img.naturalHeight / img.naturalWidth;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = Math.round(width * ratio);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo preparar el logo');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function ValleHualaneMasterplan() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { token, loading: tokenLoading, error: tokenError } = useMapboxToken();

  const { data, isLoading, error } = useQuery({
    queryKey: ['valle-hualane-masterplan-data'],
    queryFn: async () => {
      const response = await fetch(DATA_URL);
      if (!response.ok) throw new Error('No se pudo cargar la geometría KMZ del proyecto');
      return (await response.json()) as MasterplanData;
    },
  });

  const availableCount = useMemo(
    () => data?.lots.filter((lot) => lot.area_ha >= 1 && lot.status === 'available').length ?? 0,
    [data],
  );

  useSEO({
    title: 'Valle de Hualañé · Masterplan ROL 168-921',
    description:
      'Masterplan interactivo de Valle de Hualañé, ROL 168-921, generado desde la geometría KMZ del proyecto sobre imagen satelital.',
    type: 'website',
    url: 'https://ofertaterrenos.com/valle-hualane/plano',
    canonicalUrl: 'https://ofertaterrenos.com/valle-hualane/plano',
    image: 'https://ofertaterrenos.com/social/valle-hualane-og.png',
  });

  const fitProject = useCallback(() => {
    if (!mapRef.current || !data?.lots.length) return;
    mapRef.current.fitBounds(projectBounds(data.lots), {
      padding: { top: 80, right: 80, bottom: 80, left: 80 },
      pitch: 0,
      bearing: 0,
      duration: 900,
      maxZoom: 16.1,
    });
  }, [data]);

  useEffect(() => {
    if (!mapContainer.current || !token || tokenLoading || !data || mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: data.center,
      zoom: 14.6,
      pitch: 0,
      bearing: 0,
      antialias: true,
      preserveDrawingBuffer: true,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      const lots = lotsGeoJson(data.lots);
      map.addSource('vh-lots', { type: 'geojson', data: lots });

      map.addLayer({
        id: 'vh-lots-fill',
        type: 'fill',
        source: 'vh-lots',
        paint: {
          'fill-color': [
            'case',
            ['<', ['get', 'area_ha'], 1],
            '#68736d',
            '#1f7a57',
          ],
          'fill-opacity': [
            'case',
            ['<', ['get', 'area_ha'], 1],
            0.35,
            0.24,
          ],
        },
      });

      map.addLayer({
        id: 'vh-lots-outline',
        type: 'line',
        source: 'vh-lots',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2.4,
          'line-opacity': 0.98,
        },
      });

      if (data.roads?.features?.length) {
        map.addSource('vh-roads', { type: 'geojson', data: data.roads });
        map.addLayer({
          id: 'vh-roads-halo',
          type: 'line',
          source: 'vh-roads',
          paint: {
            'line-color': '#ffffff',
            'line-width': 8,
            'line-opacity': 0.95,
          },
        });
        map.addLayer({
          id: 'vh-roads',
          type: 'line',
          source: 'vh-roads',
          paint: {
            'line-color': '#df2027',
            'line-width': 5.2,
            'line-opacity': 0.98,
          },
        });
      }

      map.addLayer({
        id: 'vh-lot-labels',
        type: 'symbol',
        source: 'vh-lots',
        layout: {
          'text-field': [
            'concat',
            'Lote ',
            ['get', 'lot_number'],
            '\n',
            ['to-string', ['get', 'area_ha']],
            ' ha',
          ],
          'text-size': ['interpolate', ['linear'], ['zoom'], 13, 9, 16, 14],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-allow-overlap': false,
          'text-anchor': 'center',
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(8,32,25,0.92)',
          'text-halo-width': 2,
        },
      });

      setMapReady(true);
      window.setTimeout(fitProject, 120);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [data, fitProject, token, tokenLoading]);

  const share = async () => {
    const url = 'https://ofertaterrenos.com/valle-hualane/plano';
    await navigator.clipboard.writeText(url);
    toast.success('Link del masterplan copiado');
  };

  const downloadPdf = async () => {
    const map = mapRef.current;
    if (!map || !data || !mapReady) {
      toast.error('El mapa todavía se está preparando');
      return;
    }

    setDownloading(true);
    try {
      fitProject();
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        map.once('idle', done);
        window.setTimeout(done, 1800);
      });

      const mapImage = map.getCanvas().toDataURL('image/png', 1);
      const logoPng = await svgToPngDataUrl(LOGO_URL);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3',
        compress: true,
      });

      const pageW = 420;
      const pageH = 297;
      const margin = 12;
      const headerH = 43;
      const footerH = 24;

      pdf.setFillColor(8, 46, 37);
      pdf.rect(0, 0, pageW, headerH, 'F');
      pdf.addImage(logoPng, 'PNG', margin, 5.5, 74, 28);

      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('MASTERPLAN · ROL 168-921', 102, 16);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Sector Caone · Hualañé · Región del Maule', 102, 24);
      pdf.text('Base geométrica: KMZ técnico del proyecto', 102, 31.5);

      pdf.setFillColor(235, 194, 91);
      pdf.roundedRect(318, 7, 88, 27, 4, 4, 'F');
      pdf.setTextColor(19, 53, 44);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.text('VALOR REFERENCIAL', 362, 14, { align: 'center' });
      pdf.setFontSize(16);
      pdf.text(clp(data.price_per_ha ?? PRICE_PER_HA), 362, 23, { align: 'center' });
      pdf.setFontSize(8);
      pdf.text('CLP · por hectárea', 362, 29.5, { align: 'center' });

      const mapY = headerH + 7;
      const mapH = pageH - mapY - footerH - 8;
      pdf.setDrawColor(18, 70, 55);
      pdf.setLineWidth(0.7);
      pdf.roundedRect(margin, mapY, pageW - margin * 2, mapH, 3, 3, 'S');
      pdf.addImage(mapImage, 'PNG', margin + 1, mapY + 1, pageW - margin * 2 - 2, mapH - 2);

      const footerY = pageH - footerH;
      pdf.setFillColor(247, 244, 236);
      pdf.rect(0, footerY, pageW, footerH, 'F');
      pdf.setTextColor(20, 55, 45);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('VALLE DE HUALAÑÉ', margin, footerY + 8);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.text(
        `${data.lots.length} lotes · ${availableCount} lotes disponibles ≥ 1 ha · Superficie predial 41,75 ha`,
        margin,
        footerY + 14,
      );
      pdf.text(
        'Plano referencial para fines comerciales. Superficies, deslindes, servidumbres y disponibilidad deben confirmarse con antecedentes vigentes.',
        margin,
        footerY + 20,
      );

      pdf.setFillColor(31, 122, 87);
      pdf.rect(319, footerY + 5, 6, 4, 'F');
      pdf.setFontSize(7.5);
      pdf.text('Parcelas ≥ 1 ha', 328, footerY + 8.5);
      pdf.setFillColor(104, 115, 109);
      pdf.rect(354, footerY + 5, 6, 4, 'F');
      pdf.text('0,75 ha · consultar', 363, footerY + 8.5);
      pdf.setDrawColor(223, 32, 39);
      pdf.setLineWidth(2.2);
      pdf.line(319, footerY + 16, 325, footerY + 16);
      pdf.setTextColor(20, 55, 45);
      pdf.text('Servidumbre / acceso KMZ', 328, footerY + 17.5);

      pdf.save('Masterplan_Valle_de_Hualane_ROL_168-921.pdf');
      toast.success('PDF generado desde el masterplan KMZ');
    } catch (err) {
      console.error(err);
      toast.error('No se pudo generar el PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading || tokenLoading) {
    return <div className="grid min-h-screen place-items-center bg-[#f7f4ec] text-[#17352d]">Preparando masterplan…</div>;
  }

  if (error || tokenError || !data) {
    return <div className="grid min-h-screen place-items-center bg-[#f7f4ec] p-6 text-center text-[#17352d]">No fue posible cargar el masterplan.</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#17352d]">
      <header className="border-b border-[#b98a35]/20 bg-[#082e25] text-white">
        <div className="mx-auto flex max-w-[1700px] flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-7">
          <Link to="/valle-hualane" className="flex items-center gap-4">
            <img src={LOGO_URL} alt="Valle de Hualañé" className="h-16 w-auto md:h-20" />
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[#eac25b] text-[#17352d] hover:bg-[#eac25b]">
              {clp(data.price_per_ha ?? PRICE_PER_HA)} / ha
            </Badge>
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={share}>
              <Share2 className="mr-2 h-4 w-4" />Compartir
            </Button>
            <Button className="bg-[#eac25b] text-[#17352d] hover:bg-[#eac25b]/90" onClick={downloadPdf} disabled={downloading || !mapReady}>
              <Download className="mr-2 h-4 w-4" />{downloading ? 'Generando…' : 'Descargar PDF'}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1700px] px-4 py-5 md:px-7">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#b98a35]">Masterplan generado desde KMZ</p>
            <h1 className="mt-1 text-3xl font-black md:text-5xl">Valle de Hualañé</h1>
            <p className="mt-2 text-sm text-slate-600 md:text-base">ROL 168-921 · Sector Caone · Hualañé · Región del Maule</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-[#1f7a57]/30 text-[#1f7a57]">{data.lots.length} lotes</Badge>
            <Badge variant="outline" className="border-[#1f7a57]/30 text-[#1f7a57]">{availableCount} lotes ≥ 1 ha</Badge>
            <Badge variant="outline" className="border-[#1f7a57]/30 text-[#1f7a57]"><MapPin className="mr-1 h-3 w-3" />41,75 ha prediales</Badge>
          </div>
        </div>

        <section className="overflow-hidden rounded-[28px] border border-[#1f7a57]/20 bg-[#071712] shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0b342d] px-4 py-3 text-white">
            <div>
              <p className="font-semibold">Plano comercial interactivo</p>
              <p className="text-xs text-white/55">Parcelas y servidumbres representadas con la geometría técnica del ROL 168-921.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={fitProject}>
                <Mountain className="mr-2 h-4 w-4" />Encuadrar
              </Button>
              <Button size="sm" asChild variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Link to="/valle-hualane/tour"><ExternalLink className="mr-2 h-4 w-4" />Tour 3D</Link>
              </Button>
            </div>
          </div>
          <div ref={mapContainer} className="h-[72vh] min-h-[620px] w-full" />
        </section>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <p className="text-xs leading-relaxed text-slate-500">
            Fuente geométrica: dataset derivado del KMZ técnico ROL 168-921, incluyendo polígonos de lotes y trazado de servidumbres. El plano es comercial y no reemplaza los antecedentes oficiales de subdivisión, títulos o certificados vigentes.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />Imprimir
            </Button>
            <Button onClick={downloadPdf} disabled={downloading || !mapReady} className="bg-[#17352d] text-white hover:bg-[#17352d]/90">
              <Download className="mr-2 h-4 w-4" />PDF A3
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
