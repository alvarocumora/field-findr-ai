import { motion, useReducedMotion } from 'framer-motion';
import { Search, CalendarDays, KeyRound } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: Search,
    title: 'Encuentra',
    description: 'Explora proyectos por ubicación, precio y superficie. Revisa la disponibilidad de sus parcelas desde la ficha.',
  },
  {
    number: '02',
    icon: CalendarDays,
    title: 'Visita',
    description: 'Conoce el plano, fotografías y antecedentes disponibles. Coordina una visita directamente con el equipo comercial.',
  },
  {
    number: '03',
    icon: KeyRound,
    title: 'Reserva',
    description: 'Selecciona una unidad disponible e inicia el proceso de reserva desde la misma experiencia digital.',
  },
];

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.15 } } };
const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const HowItWorksFlow = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative py-16 md:py-24" aria-labelledby="how-it-works-title">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-transparent to-muted/20" />
      <div className="container relative px-4">
        <motion.div
          className="mb-14 text-center"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Encuentra · Visita · Reserva</p>
          <h2 id="how-it-works-title" className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            De la búsqueda a terreno, sin perder el contexto.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            OfertaTerrenos conecta cada paso para que compradores y equipos comerciales trabajen sobre el mismo proyecto y la misma parcela.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-8 md:grid-cols-3 lg:gap-12"
          variants={prefersReducedMotion ? {} : container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {STEPS.map((step, i) => (
            <motion.div key={step.number} variants={prefersReducedMotion ? {} : item} className="relative text-center md:text-left">
              {i < STEPS.length - 1 && (
                <div className="absolute left-[60%] top-8 hidden h-px w-[80%] bg-gradient-to-r from-border via-primary/20 to-border md:block" />
              )}
              <div className="relative mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-border/50 bg-card md:mx-0">
                <step.icon className="h-7 w-7 text-primary" />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{step.number}</span>
              </div>
              <h3 className="mb-2 font-heading text-lg font-bold text-foreground">{step.title}</h3>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground md:mx-0">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksFlow;
