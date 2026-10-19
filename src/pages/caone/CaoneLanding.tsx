import { Link } from 'react-router-dom';
import { CheckCircle2, Compass, Copy, FileText, MapPin, Mountain, PlayCircle, Ruler, Trees } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useSEO } from '@/hooks/useSEO';
import { toast } from 'sonner';
import ProjectScene3D from '@/components/landing/ProjectScene3D';
import { useCaoneLots } from './data/useCaoneLots';
import { CAONE_PROJECT } from './data/project';

const clp = (value: number) => `$${value.toLocaleString('es-CL')}`;
const pricePerHa = CAONE_PROJECT.pricePerLotClp;
const projectUrl = 'https://ofertaterrenos.com/valle-hualane';
// Tour y disponibilidad ya viven en /proyecto/:id (misma fuente de datos:
// tour_scenes y lots), así que todas esas CTA apuntan ahí — antes algunas
// iban a /valle-hualane/tour y otras a /proyecto/:id para lo mismo.
// El masterplan sigue en /valle-hualane/plano a propósito: ese proyecto no
// tiene kmz_file_url/plan_images en la tabla projects, así que la pestaña
// "map" genérica no puede mostrar el terreno 3D ni ofrecer la descarga PDF
// A3 que sí tiene la página bespoke.
const projectTabUrl = (tab: 'tour360' | 'lots') => `/proyecto/${CAONE_PROJECT.id}?tab=${tab}`;

const STATUS_LABEL: Record<string, string> = {
  available: 'Disponible',
  reserved: 'Reservado',
  sold: 'Vendido',
};

const CaoneLanding = () => {
  const { lots, available } = useCaoneLots();

  useSEO({
    title: 'Valle de Hualañé · Parcelas desde 1 ha · ROL 168-921',
    description: 'Valle de Hualañé, ROL 168-921 en Sector Caone. Masterplan generado desde KMZ, todas las parcelas a $12.990.000 CLP precio único y tour satelital 3D.',
    type: 'website',
    url: 'https://ofertaterrenos.com/valle-hualane',
    canonicalUrl: 'https://ofertaterrenos.com/valle-hualane',
    image: 'https://ofertaterrenos.com/social/valle-hualane-og.png',
  });

  const copyProjectLink = async () => {
    await navigator.clipboard.writeText(projectUrl);
    toast.success('Link del proyecto copiado');
  };

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#17352d]">
      <header className="relative overflow-hidden bg-[#0b342d] text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_75%_10%,white,transparent_35%)]" />
        <div className="relative container max-w-6xl px-4 py-16 md:py-24">
          <Badge className="mb-4 bg-[#f6c64e] text-[#17352d] hover:bg-[#f6c64e]">Precio lanzamiento</Badge>
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <img src="/brands/valle-de-hualane-logo.svg" alt="Valle de Hualañé" className="mb-5 h-24 w-auto max-w-full md:h-32" />
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-100/80">Sector Caone · Hualañé · Región del Maule</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">Valle de Hualañé</h1>
              <p className="mt-3 text-xl font-semibold text-[#f6c64e]">Parcelas rurales desde 1 hectárea</p>
              <p className="mt-4 max-w-2xl text-lg text-white/80">Proyecto ROL 168-921. Masterplan comercial generado desde la geometría KMZ del proyecto, con lotes seleccionados desde 1,00 ha.</p>
            </div>
            <div className="rounded-3xl bg-[#f6c64e] px-7 py-6 text-center text-[#17352d] shadow-xl">
              <p className="text-xs font-bold uppercase tracking-wider">Desde</p>
              <p className="mt-1 text-4xl font-black">{clp(pricePerHa)}</p>
              <p className="mt-1 text-xs font-semibold">CLP · precio único por parcela</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-[#17352d] hover:bg-white/90">
              <Link to="/valle-hualane/plano"><FileText className="mr-2 h-4 w-4" />Masterplan KMZ + PDF</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <Link to={projectTabUrl('tour360')}><PlayCircle className="mr-2 h-4 w-4" />Tour 360 · cotizar y reservar</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={copyProjectLink}>
              <Copy className="mr-2 h-4 w-4" />Copiar link
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <Link to={projectTabUrl('lots')}>Consultar disponibilidad</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl px-4 py-10 md:py-14">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { icon: Trees, label: 'Lotes', value: `${lots.length}` },
            { icon: CheckCircle2, label: 'Disponibles', value: `${available}` },
            { icon: Ruler, label: 'Superficie predial', value: `${CAONE_PROJECT.totalAreaHa.toLocaleString('es-CL')} ha` },
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

        <section className="py-12">
          <div className="grid overflow-hidden rounded-3xl border border-[#1b5c49]/15 bg-[#0b342d] shadow-xl lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col justify-center p-7 text-white md:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f6c64e]">Terrain Tour · experiencia interactiva</p>
              <h2 className="mt-3 text-3xl font-black md:text-4xl">Recorre Caone antes de visitar el terreno</h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
                Explora el loteo sobre imagen satelital y relieve 3D, cambia entre vista cenital y perspectiva,
                inicia un recorrido aéreo y selecciona cualquier parcela para acercarte a su ubicación real.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {[
                  { icon: Mountain, title: 'Relieve 3D', text: 'Terreno satelital con elevación.' },
                  { icon: Compass, title: 'KMZ real', text: 'Parcelas y servidumbres del archivo técnico.' },
                  { icon: MapPin, title: 'Lote a lote', text: 'Acércate y comparte cada parcela.' },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <Icon className="h-5 w-5 text-[#f6c64e]" />
                    <p className="mt-2 font-bold">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/55">{text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-[#f6c64e] text-[#17352d] hover:bg-[#f6c64e]/90">
                  <Link to={projectTabUrl('tour360')}><PlayCircle className="mr-2 h-4 w-4" />Iniciar tour virtual</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={copyProjectLink}>
                  <Copy className="mr-2 h-4 w-4" />Compartir proyecto
                </Button>
              </div>
            </div>
            <Link to={projectTabUrl('tour360')} className="group relative block min-h-[360px] overflow-hidden bg-black md:min-h-[430px]">
              <ProjectScene3D latitude={-35.001545359260206} longitude={-71.65328947973632} />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f6c64e]">Vista satelital 3D</p>
                  <p className="mt-1 text-lg font-bold text-white">Abrir experiencia interactiva</p>
                </div>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-[#17352d] transition group-hover:scale-105">
                  <PlayCircle className="h-6 w-6" />
                </div>
              </div>
            </Link>
          </div>
        </section>

        <section id="masterplan" className="scroll-mt-8 py-12">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1b5c49]">Master plan comercial</p>
              <h2 className="mt-1 text-3xl font-black">ROL 168-921</h2>
            </div>
            <Badge variant="outline" className="border-[#1b5c49]/30 text-[#1b5c49]">{available} de {lots.length} lotes disponibles</Badge>
          </div>
          <Link to="/valle-hualane/plano" className="group block overflow-hidden rounded-3xl border border-[#1b5c49]/15 bg-white shadow-sm">
            <img
              src="/projects/caone-hualane-168-921-masterplan.svg"
              alt="Vista previa masterplan Valle de Hualañé ROL 168-921"
              className="block h-auto w-full transition duration-300 group-hover:scale-[1.01]"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1b5c49]/10 p-4 md:p-5">
              <div>
                <p className="font-bold text-[#17352d]">Abrir masterplan interactivo desde KMZ</p>
                <p className="mt-1 text-xs text-slate-500">Vista satelital · lotes reales · servidumbres · descarga PDF A3</p>
              </div>
              <Button className="bg-[#17352d] text-white hover:bg-[#17352d]/90">Abrir masterplan</Button>
            </div>
          </Link>
          <p className="mt-3 text-xs text-slate-500">El masterplan interactivo usa la geometría de lotes y servidumbres derivada del KMZ del ROL 168-921. La disponibilidad, deslindes y antecedentes legales deben confirmarse antes de reservar o comprar.</p>
        </section>

        <section className="pb-12">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1b5c49]">Inventario comercial</p>
            <h2 className="mt-1 text-3xl font-black">Parcelas y superficies</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8">
            {lots.map((lot) => {
              const isAvailable = lot.status === 'available';
              const dotClass = isAvailable ? 'bg-emerald-600' : lot.status === 'reserved' ? 'bg-amber-500' : 'bg-slate-400';
              return (
                <div key={lot.lot_number} className={`rounded-2xl border p-3 ${isAvailable ? 'border-[#1b5c49]/20 bg-white' : 'border-slate-300 bg-slate-100'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black">Lote {lot.lot_number}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} title={STATUS_LABEL[lot.status]} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{lot.area_ha.toFixed(2)} ha</p>
                  <p className={`mt-2 text-xs font-bold ${isAvailable ? 'text-[#1b5c49]' : 'text-slate-500'}`}>
                    {isAvailable ? clp(lot.price_clp ?? pricePerHa) : STATUS_LABEL[lot.status]}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-500">La disponibilidad y el precio de cada lote se leen en vivo desde la plataforma; deslindes y antecedentes legales deben confirmarse antes de reservar o comprar.</p>
        </section>

        <section className="mb-8 rounded-3xl bg-[#17352d] p-7 text-white md:p-10">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center gap-2 text-[#f6c64e]"><FileText className="h-5 w-5" /><span className="text-sm font-bold uppercase tracking-wider">Información comercial</span></div>
              <h2 className="mt-2 text-3xl font-black">Agenda una visita o solicita antecedentes</h2>
              <p className="mt-2 max-w-2xl text-white/75">Consulta disponibilidad por lote, condiciones de reserva y documentación del proyecto.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <Link to={projectTabUrl('tour360')}><PlayCircle className="mr-2 h-4 w-4" />Abrir tour virtual</Link>
              </Button>
              <Button asChild size="lg" className="bg-[#f6c64e] text-[#17352d] hover:bg-[#f6c64e]/90">
                <Link to={projectTabUrl('lots')}>Ver parcelas y reservar</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CaoneLanding;
