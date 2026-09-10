import { CalendarCheck2, FileText, Images, MapPinned, MousePointerClick, WalletCards } from 'lucide-react';

const FEATURES = [
  { icon: MapPinned, title: 'Plano y ubicación', text: 'Entiende dónde está cada parcela y cómo se inserta en el proyecto.' },
  { icon: WalletCards, title: 'Precio y disponibilidad', text: 'Revisa unidades activas y compara alternativas con información comercial actualizada.' },
  { icon: Images, title: 'Fotografías y recorrido', text: 'Conoce el entorno y el proyecto antes de desplazarte a terreno.' },
  { icon: FileText, title: 'Ficha y documentos', text: 'Consulta la información publicada por cada proyecto desde una sola experiencia.' },
  { icon: CalendarCheck2, title: 'Agenda una visita', text: 'Pasa de la búsqueda a terreno conectando directamente con el equipo comercial.' },
  { icon: MousePointerClick, title: 'Reserva online', text: 'Cuando encuentres la unidad correcta, inicia el proceso de reserva desde la plataforma.' },
];

const DecisionStackSection = () => (
  <section className="py-16 md:py-24" aria-labelledby="decision-stack-title">
    <div className="container px-4">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="max-w-xl lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Antes de visitar</p>
          <h2 id="decision-stack-title" className="mt-3 font-heading text-3xl font-bold leading-tight md:text-5xl">
            Todo lo que necesitas para decidir, en un solo lugar.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            OfertaTerrenos conecta la exploración digital con la operación comercial real: información del proyecto, contacto, visita y reserva sin saltar entre portales y planillas.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature, index) => (
            <article key={feature.title} className="group rounded-2xl border border-border/60 bg-card/60 p-5 transition-colors hover:border-primary/35 hover:bg-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span>
              </div>
              <h3 className="mt-5 font-heading text-lg font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default DecisionStackSection;
