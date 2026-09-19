import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BadgeDollarSign,
  Calculator,
  SearchCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const EXPERIENCES = [
  {
    eyebrow: 'Match inteligente',
    title: 'Encuentra terrenos que realmente calzan contigo',
    text: 'Cuéntanos presupuesto, zona y propósito. El motor ordena las propiedades por compatibilidad.',
    to: '/quiz',
    cta: 'Descubrir mi match',
    icon: SearchCheck,
    accent: 'from-primary/20 via-primary/5 to-transparent',
  },
  {
    eyebrow: 'Tasación y análisis',
    title: 'Estima el valor antes de tomar una decisión',
    text: 'Usa el predictor de precio, plusvalía, comparador y herramientas de inversión en un solo lugar.',
    to: '/tools?tab=price-predictor',
    cta: 'Tasar un terreno',
    icon: Calculator,
    accent: 'from-sky-500/20 via-sky-500/5 to-transparent',
  },
  {
    eyebrow: 'Círculo OfertaTerrenos',
    title: 'Compra, vende y aprende acompañado por la red',
    text: 'Conecta con consultores, corredores y proyectos activos, con atribución y seguimiento visibles.',
    to: '/comunidad',
    cta: 'Entrar a la comunidad',
    icon: UsersRound,
    accent: 'from-violet-500/20 via-violet-500/5 to-transparent',
  },
  {
    eyebrow: 'Programa de referidos',
    title: 'Tu dato también puede generar valor',
    text: 'Comparte proyectos con personas interesadas y sigue cada oportunidad desde tu enlace personal.',
    to: '/referidos',
    cta: 'Generar mi enlace',
    icon: BadgeDollarSign,
    accent: 'from-amber-500/20 via-amber-500/5 to-transparent',
  },
];

const OpportunityHubSection = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-border/50 bg-background py-16 md:py-24" aria-labelledby="opportunity-hub-title">
      <div className="pointer-events-none absolute left-1/2 top-24 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full border border-primary/10" aria-hidden="true" />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-32 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full border border-dashed border-primary/15"
        animate={prefersReducedMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute left-[18%] top-28 h-2 w-2 rounded-full bg-primary shadow-[0_0_24px_hsl(var(--primary))]" aria-hidden="true" />
      <div className="pointer-events-none absolute right-[16%] top-64 h-1.5 w-1.5 rounded-full bg-primary/80 shadow-[0_0_20px_hsl(var(--primary))]" aria-hidden="true" />

      <div className="container relative px-4">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Tu próxima acción
          </div>
          <h2 id="opportunity-hub-title" className="mt-5 font-heading text-4xl font-bold leading-tight md:text-6xl">
            No sólo mires el mapa. Activa tu oportunidad.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Encuentra tu mejor match, conoce el valor del terreno y participa de una comunidad que conecta compradores, proyectos y consultores.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {EXPERIENCES.map((experience, index) => (
            <motion.div
              key={experience.title}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={prefersReducedMotion ? undefined : { y: -6 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: prefersReducedMotion ? 0 : index * 0.07 }}
            >
              <Link
                to={experience.to}
                className="group relative flex h-full min-h-64 overflow-hidden rounded-3xl border border-border/60 bg-card/75 p-6 shadow-sm transition-colors hover:border-primary/35 md:p-8"
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${experience.accent} opacity-80`} aria-hidden="true" />
                <div className="relative flex w-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-background/75 text-primary shadow-sm backdrop-blur">
                      <experience.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
                  </div>
                  <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{experience.eyebrow}</p>
                  <h3 className="mt-2 max-w-lg font-heading text-2xl font-bold leading-tight">{experience.title}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{experience.text}</p>
                  <span className="mt-auto pt-6 text-sm font-semibold text-foreground">{experience.cta}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="relative mt-6 overflow-hidden rounded-3xl border border-primary/25 bg-foreground p-7 text-background md:p-10"
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.985 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55 }}
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full border border-background/10" aria-hidden="true" />
          <motion.div
            className="pointer-events-none absolute -right-8 -top-12 h-56 w-56 rounded-full border border-dashed border-background/20"
            animate={prefersReducedMotion ? undefined : { rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            aria-hidden="true"
          />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">La red también recompensa</p>
              <h3 className="mt-3 max-w-3xl font-heading text-3xl font-bold leading-tight md:text-5xl">
                Recomienda o conviértete en consultor.
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-background/65 md:text-base">
                Participa en proyectos y parcelas con seguimiento de origen, oportunidades atribuidas y recompensas visibles.
              </p>
            </div>

            <div className="grid min-w-72 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-background/15 bg-background/[0.06] p-4 backdrop-blur">
                <p className="text-[10px] uppercase tracking-[0.16em] text-background/50">Por referido cerrado</p>
                <p className="mt-1 font-heading text-3xl font-bold text-emerald-400">$100.000</p>
              </div>
              <div className="rounded-2xl border border-background/15 bg-background/[0.06] p-4 backdrop-blur">
                <p className="text-[10px] uppercase tracking-[0.16em] text-background/50">Consultor · por venta</p>
                <p className="mt-1 font-heading text-3xl font-bold text-background">Desde $500.000</p>
              </div>
            </div>
          </div>

          <div className="relative mt-8 flex flex-col gap-3 border-t border-background/10 pt-6 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="bg-emerald-500 text-black hover:bg-emerald-400">
              <Link to="/referidos">Quiero recomendar <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-background/25 bg-transparent text-background hover:bg-background/10 hover:text-background">
              <Link to="/brokers/inscripcion?source=landing-consultores">Ser consultor OfertaTerrenos</Link>
            </Button>
            <p className="text-[10px] leading-relaxed text-background/40 sm:ml-auto sm:max-w-xs sm:text-right">
              Montos sujetos a validación, atribución y cierre efectivo según las condiciones de cada proyecto.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default OpportunityHubSection;
