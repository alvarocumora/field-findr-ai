import {
  CalendarCheck2,
  FileCheck2,
  MapPinned,
  MousePointerClick,
  Search,
  ShieldCheck,
} from 'lucide-react';

const JOURNEY = [
  {
    number: '01',
    icon: Search,
    title: 'Explora',
    text: 'Parte desde Chile, baja a una región y entra a proyectos con inventario activo.',
  },
  {
    number: '02',
    icon: MapPinned,
    title: 'Evalúa',
    text: 'Compara ubicación, superficie, precio y disponibilidad directamente sobre el territorio.',
  },
  {
    number: '03',
    icon: CalendarCheck2,
    title: 'Visita',
    text: 'Coordina terreno con el equipo comercial manteniendo proyecto y parcela como contexto.',
  },
  {
    number: '04',
    icon: MousePointerClick,
    title: 'Reserva',
    text: 'Cuando encuentres la unidad correcta, inicia la reserva desde el mismo recorrido.',
  },
];

const EVIDENCE = [
  {
    icon: MapPinned,
    title: 'Plano y ubicación',
    text: 'Polígonos, superficie y posición de cada parcela dentro del proyecto.',
  },
  {
    icon: FileCheck2,
    title: 'Antecedentes visibles',
    text: 'Ficha, material y documentos publicados por el proyecto en un solo punto.',
  },
  {
    icon: ShieldCheck,
    title: 'Proceso trazable',
    text: 'Consulta, visita y reserva permanecen vinculadas a la misma unidad.',
  },
];

const DecisionStackSection = () => (
  <section className="border-y border-border/50 bg-muted/15 py-16 md:py-24" aria-labelledby="decision-stack-title">
    <div className="container px-4">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Así decides</p>
        <h2 id="decision-stack-title" className="mt-3 font-heading text-3xl font-bold leading-tight md:text-5xl">
          Del territorio a una decisión concreta.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          OfertaTerrenos une exploración territorial, inventario y operación comercial para que no tengas que saltar entre mapas, portales y planillas.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {JOURNEY.map((step) => (
          <article key={step.number} className="rounded-2xl border border-border/60 bg-card/70 p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">{step.number}</span>
            </div>
            <h3 className="mt-5 font-heading text-lg font-bold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {EVIDENCE.map((item) => (
          <div key={item.title} className="flex gap-4 rounded-2xl border border-border/40 bg-background/60 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default DecisionStackSection;
