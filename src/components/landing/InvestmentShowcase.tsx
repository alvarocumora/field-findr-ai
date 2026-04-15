import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLandingStats } from '@/hooks/useLandingStats';

const InvestmentShowcase = () => {
  const prefersReducedMotion = useReducedMotion();
  const { data: stats } = useLandingStats();

  const kpis = [
    {
      icon: TrendingUp,
      value: '12–18%',
      label: 'Plusvalía promedio anual',
      description: 'en zonas de expansión urbana',
    },
    {
      icon: MapPin,
      value: `${stats?.totalRegions || 12}`,
      label: 'Regiones cubiertas',
      description: 'desde Coquimbo hasta Los Lagos',
    },
    {
      icon: Sparkles,
      value: `${stats?.totalListings || 0}+`,
      label: 'Terrenos analizados',
      description: 'con scoring de inversión IA',
    },
  ];

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.03]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

      <div className="container px-4 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary/70 mb-4">
              Inteligencia Territorial
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold tracking-tight text-foreground leading-tight">
              Invierte con datos,{' '}
              <span className="gradient-text-hero">no con intuición</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Cada terreno en nuestra plataforma incluye análisis de plusvalía, 
              scoring de inversión y datos verificados del SII. Toma decisiones 
              con la misma información que usan los grandes desarrolladores.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="btn-glow">
                <Link to="/explorar">
                  Ver análisis completo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link to="/tools">Herramientas IA</Link>
              </Button>
            </div>
          </motion.div>

          {/* Right: KPI cards */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {kpis.map((kpi, i) => (
              <motion.div
                key={kpi.label}
                className="flex items-center gap-6 p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-colors"
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * i, duration: 0.4 }}
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <kpi.icon className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-heading font-bold text-foreground tracking-tight">
                    {kpi.value}
                  </p>
                  <p className="text-sm font-medium text-foreground/80">{kpi.label}</p>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default InvestmentShowcase;
