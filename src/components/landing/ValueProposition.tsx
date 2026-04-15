import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, ShieldCheck, BarChart3, Home, Calculator, Cuboid, Users, Megaphone, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AUDIENCES = [
  {
    title: 'Para Inversionistas',
    subtitle: 'Decisiones respaldadas por datos',
    icon: TrendingUp,
    color: 'from-primary/20 to-primary/5',
    borderColor: 'border-primary/20',
    iconColor: 'text-primary',
    features: [
      { icon: BarChart3, text: 'Scoring de inversión con IA' },
      { icon: TrendingUp, text: 'Análisis de plusvalía territorial' },
      { icon: ShieldCheck, text: 'Datos verificados del SII' },
      { icon: Calculator, text: 'Comparador multi-parcela' },
    ],
    cta: { label: 'Ver oportunidades', href: '/explorar' },
  },
  {
    title: 'Para Compradores',
    subtitle: 'Tu terreno ideal, sin fricciones',
    icon: Home,
    color: 'from-accent/20 to-accent/5',
    borderColor: 'border-accent/20',
    iconColor: 'text-accent',
    features: [
      { icon: Cuboid, text: 'Diseñador 3D de parcela' },
      { icon: Calculator, text: 'Simulador financiero integrado' },
      { icon: ShieldCheck, text: 'Reserva 100% digital' },
      { icon: Home, text: 'Due diligence automatizada' },
    ],
    cta: { label: 'Explorar terrenos', href: '/explorar' },
  },
  {
    title: 'Para Corredores',
    subtitle: 'Vende más, más rápido',
    icon: Users,
    color: 'from-warning/20 to-warning/5',
    borderColor: 'border-warning/20',
    iconColor: 'text-warning',
    features: [
      { icon: Users, text: 'CRM con lead scoring' },
      { icon: Megaphone, text: 'Cotizador público embebible' },
      { icon: FileText, text: 'Brochures generadas con IA' },
      { icon: BarChart3, text: 'Dashboard de rendimiento' },
    ],
    cta: { label: 'Comenzar gratis', href: '/auth' },
  },
];

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.15 } } };
const item = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const ValueProposition = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />

      <div className="container px-4 relative">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary/70 mb-4">
            ¿Por qué Ofertaterrenos?
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold tracking-tight text-foreground">
            Una plataforma, tres soluciones
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Diseñada para cada actor del mercado de terrenos en Chile
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-3 gap-6 lg:gap-8"
          variants={prefersReducedMotion ? {} : container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {AUDIENCES.map((audience) => (
            <motion.div
              key={audience.title}
              variants={prefersReducedMotion ? {} : item}
              className={`relative group rounded-2xl border ${audience.borderColor} bg-gradient-to-b ${audience.color} backdrop-blur-sm p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1`}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-background/80 border border-border/50 mb-6 ${audience.iconColor}`}>
                <audience.icon className="h-6 w-6" />
              </div>

              <h3 className="text-xl font-heading font-bold text-foreground mb-1">
                {audience.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">{audience.subtitle}</p>

              <ul className="space-y-3 mb-8">
                {audience.features.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3 text-sm text-foreground/80">
                    <feature.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    {feature.text}
                  </li>
                ))}
              </ul>

              <Button variant="ghost" asChild className="group/btn p-0 h-auto text-primary hover:text-primary">
                <Link to={audience.cta.href} className="flex items-center gap-2 text-sm font-medium">
                  {audience.cta.label}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ValueProposition;
