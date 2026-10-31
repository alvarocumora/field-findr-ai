import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeDollarSign,
  Calculator,
  SearchCheck,
  UsersRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BROKER_MIN_SALE_COMMISSION_CLP, clpAmount } from '@/lib/brokerProgram';
import { supabase } from '@/integrations/supabase/client';

const EXPERIENCES = [
  {
    index: '01',
    eyebrow: 'Match inteligente',
    title: 'Encuentra terrenos que realmente calzan contigo',
    text: 'Cuéntanos presupuesto, zona y propósito. El motor ordena las propiedades por compatibilidad.',
    to: '/quiz',
    cta: 'Descubrir mi match',
    icon: SearchCheck,
  },
  {
    index: '02',
    eyebrow: 'Tasación y análisis',
    title: 'Estima el valor antes de tomar una decisión',
    text: 'Usa el predictor de precio, plusvalía, comparador y herramientas de inversión en un solo lugar.',
    to: '/tools?tab=price-predictor',
    cta: 'Tasar un terreno',
    icon: Calculator,
  },
  {
    index: '03',
    eyebrow: 'Círculo OfertaTerrenos',
    title: 'Compra, vende y aprende acompañado por la red',
    text: 'Conecta con consultores, corredores y proyectos activos, con atribución y seguimiento visibles.',
    to: '/comunidad',
    cta: 'Entrar a la comunidad',
    icon: UsersRound,
  },
  {
    index: '04',
    eyebrow: 'Programa de referidos',
    title: 'Tu dato también puede generar valor',
    text: 'Comparte proyectos con personas interesadas y sigue cada oportunidad desde tu enlace personal.',
    to: '/referidos',
    cta: 'Generar mi enlace',
    icon: BadgeDollarSign,
  },
];

const OpportunityHubSection = () => {
  const prefersReducedMotion = useReducedMotion();
  const { data: landscapeImages = [] } = useQuery({
    queryKey: ['landing-opportunity-landscapes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('images')
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .limit(12);

      if (error) throw error;
      return (data ?? [])
        .flatMap((project) => Array.isArray(project.images) ? project.images : [])
        .filter((image): image is string => typeof image === 'string' && image.length > 0)
        .slice(0, EXPERIENCES.length);
    },
    staleTime: 10 * 60 * 1000,
  });

  return (
    <section className="relative border-b border-border/50 bg-background py-16 md:py-24" aria-labelledby="opportunity-hub-title">
      <div className="container relative px-4">
        <motion.div
          className="max-w-2xl"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
        >
          <p className="font-swiss text-[11px] text-primary">Tu próxima acción</p>
          <h2 id="opportunity-hub-title" className="mt-4 font-editorial text-4xl font-medium leading-[1.05] md:text-6xl">
            Activa tu oportunidad.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Encuentra tu mejor match, conoce el valor del terreno y participa de una comunidad que conecta compradores, proyectos y consultores.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {EXPERIENCES.map((experience, index) => {
            const landscape = landscapeImages[index % Math.max(landscapeImages.length, 1)];
            return (
            <motion.div
              key={experience.title}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: prefersReducedMotion ? 0 : index * 0.07 }}
            >
              <Link
                to={experience.to}
                className="group relative flex h-full min-h-64 overflow-hidden rounded-sm border border-border/60 bg-card p-6 transition-colors hover:border-primary/40 md:p-8"
              >
                {landscape ? (
                  <img
                    src={landscape}
                    alt=""
                    loading="lazy"
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45 transition duration-700 group-hover:scale-105 group-hover:opacity-55"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/30" aria-hidden="true" />
                <div className="relative flex w-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-swiss text-xs text-muted-foreground">{experience.index}</span>
                    <experience.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <p className="mt-7 font-swiss text-[11px] text-primary">{experience.eyebrow}</p>
                  <h3 className="mt-2 max-w-lg font-editorial text-2xl font-medium leading-tight">{experience.title}</h3>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{experience.text}</p>
                  <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-foreground">
                    {experience.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </motion.div>
            );
          })}
        </div>

        <motion.div
          className="relative mt-6 overflow-hidden rounded-sm border border-foreground/10 bg-foreground p-7 text-background md:p-10"
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55 }}
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-swiss text-[11px] text-emerald-400">La red también recompensa</p>
              <h3 className="mt-3 max-w-3xl font-editorial text-3xl font-medium leading-[1.05] md:text-5xl">
                Recomienda o conviértete en consultor.
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-background/65 md:text-base">
                Participa en proyectos y parcelas con seguimiento de origen, oportunidades atribuidas y recompensas visibles.
              </p>
            </div>

            <div className="grid min-w-72 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="border border-background/15 p-4">
                <p className="font-swiss text-[10px] text-background/50">Por referido cerrado</p>
                <p className="mt-1 font-editorial text-3xl font-medium text-emerald-400">$100.000</p>
              </div>
              <div className="border border-background/15 p-4">
                <p className="font-swiss text-[10px] text-background/50">Consultor · por venta</p>
                <p className="mt-1 font-editorial text-3xl font-medium text-background">Desde {clpAmount(BROKER_MIN_SALE_COMMISSION_CLP)}</p>
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
