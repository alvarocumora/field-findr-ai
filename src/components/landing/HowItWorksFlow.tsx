import { motion, useReducedMotion } from 'framer-motion';
import { Search, BarChart3, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    number: '01',
    icon: Search,
    title: 'Busca',
    description: 'Filtra por región, tipo de terreno, aptitud, superficie y precio. Usa IA para encontrar exactamente lo que necesitas.',
  },
  {
    number: '02',
    icon: BarChart3,
    title: 'Compara',
    description: 'Analiza terrenos lado a lado con datos del SII, scoring de inversión, plusvalía estimada y factibilidad legal.',
  },
  {
    number: '03',
    icon: ShieldCheck,
    title: 'Invierte',
    description: 'Reserva digitalmente, simula financiamiento y accede a due diligence automatizada. Todo en un solo lugar.',
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
            Simple y poderoso
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold tracking-tight text-foreground">
            Cómo funciona
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

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button asChild size="lg" className="btn-glow">
            <Link to="/explorar">
              Comenzar ahora
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksFlow;
