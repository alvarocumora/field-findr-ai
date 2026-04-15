import { Shield, Award, Clock, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const BADGES = [
  { icon: Shield, title: 'Datos Verificados', description: 'Información validada del SII y Conservador' },
  { icon: Award, title: 'IA de Precisión', description: 'Análisis con datos reales del mercado' },
  { icon: Clock, title: 'Tiempo Real', description: 'Precios y disponibilidad actualizados' },
  { icon: Users, title: 'Soporte Experto', description: 'Equipo inmobiliario a tu disposición' },
];

const LOGOS = [
  'Mapbox', 'OpenAI', 'MercadoPago', 'SII Chile',
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
    <section className="py-16 border-t border-border/50">
      <div className="container px-4">
        {/* Trust badges */}
        <motion.div
          className="flex flex-wrap justify-center gap-8 md:gap-12 mb-12"
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

        {/* Logo cloud integrated */}
        <div className="flex items-center justify-center gap-8 opacity-40">
          {LOGOS.map((name) => (
            <span key={name} className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
