import { motion, useReducedMotion } from 'framer-motion';
import { Search, CalendarDays, KeyRound } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: Search,
    title: 'Explora',
    description: 'Compara proyectos completos por ubicación, precio, superficie y disponibilidad.',
  },
  {
    number: '02',
    icon: CalendarDays,
    title: 'Visita',
    description: 'Revisa el plano, las fichas y los documentos disponibles. Luego agenda una visita.',
  },
  {
    number: '03',
    icon: KeyRound,
    title: 'Reserva',
    description: 'Elige una unidad disponible y sigue el avance de tu compra desde un solo lugar.',
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
    <section className="py-16 md:py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-transparent to-muted/20" />

      <div className="container px-4 relative">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary/70 mb-3">
            Una ruta clara
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold tracking-tight text-foreground">
            De la búsqueda a la reserva
          </h2>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-8 lg:gap-12"
          variants={prefersReducedMotion ? {} : container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              variants={prefersReducedMotion ? {} : item}
              className="relative text-center md:text-left"
            >
              {/* Connector line (desktop only) */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-border via-primary/20 to-border" />
              )}

              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border/50 mb-5 mx-auto md:mx-0">
                <step.icon className="h-7 w-7 text-primary" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {step.number}
                </span>
              </div>

              <h3 className="text-lg font-heading font-bold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto md:mx-0">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default HowItWorksFlow;
