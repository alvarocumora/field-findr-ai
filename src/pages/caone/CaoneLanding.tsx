import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, FileText, MapPin, Ruler, Trees } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useSEO } from '@/hooks/useSEO';

const lots = [
  ['1',1.08],['2',1.33],['3',2.00],['4',1.00],['5',1.00],['6',1.00],['7',1.00],['8',1.00],['9',1.00],['10',1.00],
  ['11',1.50],['12',1.00],['13',1.00],['14',1.00],['15',1.00],['16',1.00],['17',1.00],['18',1.00],['19',1.00],['20',1.00],
  ['21',1.00],['22',1.00],['23',1.00],['24',1.00],['25',1.14],['26',1.00],['27',1.00],['28',1.00],['29',1.00],['30',1.00],
  ['31',1.00],['32',1.00],['33',1.00],['34',1.00],['35',1.00],['36',0.75],['37',0.75],['38',1.20],['39',1.00],['40',1.00],
] as const;

const clp = (value: number) => `$${value.toLocaleString('es-CL')}`;
const launchPrice = 10_990_000;

const CaoneLanding = () => {
  const eligible = useMemo(() => lots.filter(([, area]) => area >= 1), []);

  useSEO({
    title: 'Parcelas Caone Hualañé · 1 ha desde $10.990.000',
    description: 'Master plan ROL 168-921 en Sector Caone, Hualañé. 38 parcelas desde 1 hectárea con precio lanzamiento de $10.990.000 CLP.',
    type: 'website',
    url: 'https://ofertaterrenos.com/parcelas-caone-hualane',
    canonicalUrl: 'https://ofertaterrenos.com/parcelas-caone-hualane',
  });

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#17352d]">
      <header className="relative overflow-hidden bg-[#0b342d] text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_75%_10%,white,transparent_35%)]" />
        <div className="relative container max-w-6xl px-4 py-16 md:py-24">
          <Badge className="mb-4 bg-[#f6c64e] text-[#17352d] hover:bg-[#f6c64e]">Precio lanzamiento</Badge>
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-100/80">Caone · Hualañé · Región del Maule</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">Parcelas rurales desde 1 hectárea</h1>
              <p className="mt-4 max-w-2xl text-lg text-white/80">Master plan del ROL 168-921, Sector Caone. Lotes seleccionados desde 1,00 ha con valor de lanzamiento.</p>
            </div>
            <div className="rounded-3xl bg-[#f6c64e] px-7 py-6 text-center text-[#17352d] shadow-xl">
              <p className="text-xs font-bold uppercase tracking-wider">Desde</p>
              <p className="mt-1 text-4xl font-black">{clp(launchPrice)}</p>
              <p className="mt-1 text-xs font-semibold">CLP · parcelas ≥ 1,00 ha</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-[#17352d] hover:bg-white/90">
              <a href="#masterplan">Ver master plan</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <Link to="/contacto-loteos">Consultar disponibilidad</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl px-4 py-10 md:py-14">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { icon: Trees, label: 'Lotes', value: '40' },
            { icon: CheckCircle2, label: 'En promoción', value: `${eligible.length}` },
            { icon: Ruler, label: 'Superficie predial', value: '41,75 ha' },
            { icon: MapPin, label: 'Ubicación', value: 'Caone, Hualañé' },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="border-[#1b5c49]/15 bg-white/90 shadow-sm">
              <CardContent className="p-4 md:p-5">
                <Icon className="h-5 w-5 text-[#1b5c49]" />
                <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">{label}</p>
                <p className="mt-1 font-bold text-[#17352d]">{value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section id="masterplan" className="scroll-mt-8 py-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1b5c49]">Master plan comercial</p>
              <h2 className="mt-1 text-3xl font-black">ROL 168-921</h2>
            </div>
            <Badge variant="outline" className="border-[#1b5c49]/30 text-[#1b5c49]">38 lotes ≥ 1 ha</Badge>
          </div>
          <div className="overflow-hidden rounded-3xl border border-[#1b5c49]/15 bg-white shadow-sm">
            <img
              src="/projects/caone-hualane-168-921-masterplan.svg"
              alt="Master plan Parcelas Caone Hualañé ROL 168-921"
              className="block h-auto w-full"
            />
          </div>
          <p className="mt-3 text-xs text-slate-500">Master plan preparado desde la planimetría y KMZ del ROL 168-921. La disponibilidad, deslindes y antecedentes legales deben confirmarse antes de reservar o comprar.</p>
        </section>

        <section className="pb-12">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1b5c49]">Inventario comercial</p>
            <h2 className="mt-1 text-3xl font-black">Parcelas y superficies</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8">
            {lots.map(([number, area]) => {
              const onPromo = area >= 1;
              return (
                <div key={number} className={`rounded-2xl border p-3 ${onPromo ? 'border-[#1b5c49]/20 bg-white' : 'border-slate-300 bg-slate-100'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black">Lote {number}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${onPromo ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{area.toFixed(2)} ha</p>
                  <p className={`mt-2 text-xs font-bold ${onPromo ? 'text-[#1b5c49]' : 'text-slate-500'}`}>{onPromo ? clp(launchPrice) : 'Consultar'}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-8 rounded-3xl bg-[#17352d] p-7 text-white md:p-10">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center gap-2 text-[#f6c64e]"><FileText className="h-5 w-5" /><span className="text-sm font-bold uppercase tracking-wider">Información comercial</span></div>
              <h2 className="mt-2 text-3xl font-black">Agenda una visita o solicita antecedentes</h2>
              <p className="mt-2 max-w-2xl text-white/75">Consulta disponibilidad por lote, condiciones de reserva y documentación del proyecto.</p>
            </div>
            <Button asChild size="lg" className="bg-[#f6c64e] text-[#17352d] hover:bg-[#f6c64e]/90">
              <Link to="/contacto-loteos">Hablar con OfertaTerrenos</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CaoneLanding;
