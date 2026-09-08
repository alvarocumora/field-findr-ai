import { ShieldCheck, Map, FileCheck2, CalendarCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const BADGES = [
  { icon: Map, title: 'Polígonos reales', description: 'Revisa ubicación, forma y superficie antes de consultar.' },
  { icon: FileCheck2, title: 'Documentos visibles', description: 'Cada proyecto publica el respaldo que tiene disponible.' },
  { icon: CalendarCheck, title: 'Visita coordinada', description: 'Agenda con el equipo comercial desde la misma ficha.' },
  { icon: ShieldCheck, title: 'Proceso trazable', description: 'Consulta, visita y reserva quedan conectadas a tu avance.' },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
} as const;
const item = {
  hidden: { opacity: 0, x: -15 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
} as const;

const TrustBadges = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-16 md:py-24 border-y border-border/50 bg-muted/20" aria-labelledby="trust-title">
      <div className="container px-4">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-semibold uppercase text-primary">Decide con evidencia</p>
          <h2 id="trust-title" className="mt-3 text-3xl md:text-4xl font-heading font-bold">El terreno antes que la promesa.</h2>
          <p className="mt-3 text-muted-foreground">Información concreta para pasar del interés a una visita informada.</p>
        </div>
        {/* Trust badges */}
        <motion.div
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          variants={prefersReducedMotion ? {} : container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
        >
          {BADGES.map((badge) => (
            <motion.div
              key={badge.title}
              variants={prefersReducedMotion ? {} : item}
              className="flex items-center gap-3 text-left"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <badge.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">{badge.title}</h4>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default TrustBadges;
