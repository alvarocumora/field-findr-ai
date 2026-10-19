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
      <div className="max-w-2xl">
        <p className="font-swiss text-[11px] text-primary">Así decides</p>
        <h2 id="decision-stack-title" className="mt-4 font-editorial text-4xl font-medium leading-[1.05] md:text-5xl">
          Del territorio a una decisión concreta.
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          OfertaTerrenos une exploración territorial, inventario y operación comercial para que no tengas que saltar entre mapas, portales y planillas.
        </p>
      </div>

      <div className="mt-10 grid border-t border-border/60 md:grid-cols-2 xl:grid-cols-4">
        {JOURNEY.map((step) => (
          <article
            key={step.number}
            className="border-b border-r-0 border-border/60 py-6 pr-6 xl:border-b-0 xl:border-r xl:last:border-r-0"
          >
            <div className="flex items-center justify-between">
              <span className="font-swiss text-base text-primary">{step.number}</span>
              <step.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-editorial text-xl font-medium">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-6 border-t border-border/40 pt-8 lg:grid-cols-3">
        {EVIDENCE.map((item) => (
          <div key={item.title} className="flex gap-4">
            <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
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
