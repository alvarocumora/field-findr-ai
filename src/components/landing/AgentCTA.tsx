import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, BarChart3, FileText, Megaphone, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FEATURES = [
  { icon: Users, title: 'CRM Integrado', description: 'Gestiona leads con scoring automático' },
  { icon: BarChart3, title: 'Lead Scoring IA', description: 'Prioriza compradores calificados' },
  { icon: Megaphone, title: 'Cotizador Público', description: 'Widget embebible en tu sitio web' },
  { icon: FileText, title: 'Brochures con IA', description: 'PDF profesionales en un clic' },
];

const AgentCTA = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Dark premium background */}
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.03] via-background to-primary/[0.02]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      <div className="container px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-mono uppercase tracking-wider mb-8">
              <Zap className="h-3.5 w-3.5" />
              Para profesionales inmobiliarios
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold tracking-tight text-foreground">
              Vende más rápido con{' '}
              <span className="gradient-text-hero">inteligencia artificial</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              La suite completa para corredores y desarrolladores que quieren 
              escalar sus ventas de terrenos y lotes.
            </p>
          </motion.div>

          {/* Features grid */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="p-5 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm text-center hover:border-primary/20 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-3">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button asChild size="lg" className="btn-glow text-base px-8">
              <Link to="/auth">
                Comienza gratis
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link to="/pricing">Ver planes</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AgentCTA;
