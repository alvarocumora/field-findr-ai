import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Compass, LayoutGrid, Map as MapIcon, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useShowcaseProjects } from './CinematicShowcaseHero';

/** Project IDs that have at least one published 360 scene (real data, no guesses). */
const useProjectsWithTour = (ids: string[]) =>
  useQuery({
    queryKey: ['landing-tour-projects', ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('tour_scenes' as never).select('project_id').in('project_id', ids);
      if (error) throw error;
      return new Set(((data ?? []) as Array<{ project_id: string }>).map((r) => r.project_id));
    },
    staleTime: 5 * 60 * 1000,
  });

const priceLabel = (v?: number) => (v ? `Desde $${v.toLocaleString('es-CL')} CLP` : 'Precio a consultar');

/**
 * Selector interactivo de proyectos de la portada: todo acceso abre la ficha única
 * del proyecto (/proyecto/:id) directamente en el modo elegido (?tab=).
 */
const FluidProjectDock = () => {
  const reduced = useReducedMotion();
  const { data: projects = [], isLoading, isError } = useShowcaseProjects();
  const { data: tours } = useProjectsWithTour(projects.map((p) => p.id));
  const [activeId, setActiveId] = useState<string | null>(null);

  if (isLoading) return <section id="proyectos-en-venta" className="container scroll-mt-20 px-4 py-16"><div className="h-[420px] animate-pulse rounded-3xl bg-muted" /></section>;
  if (isError || !projects.length) return <section id="proyectos-en-venta" className="container scroll-mt-20 px-4 py-12"><h2 className="font-editorial text-3xl">Encuentra tu terreno</h2><p className="mt-3 text-muted-foreground">{isError ? 'No pudimos cargar los proyectos en este momento.' : 'Explora las publicaciones y consulta sus opciones de compra.'}</p><Link to="/explorar" className="mt-4 inline-flex min-h-11 items-center text-primary underline focus-ring">Ver terrenos en venta</Link></section>;

  const active = projects.find((p) => p.id === activeId) ?? projects[0];
  const base = `/proyecto/${encodeURIComponent(active.id)}`;
  const hasTour = tours?.has(active.id) ?? false;

  return (
    <section id="proyectos-en-venta" className="scroll-mt-20 py-16 md:py-24" aria-labelledby="dock-title">
      <div className="container px-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Encuentra tu parcela</p>
        <h2 id="dock-title" className="mt-3 max-w-3xl font-editorial text-3xl font-medium md:text-5xl">Proyectos en venta. Encuentra el tuyo.</h2>

        <div className="mt-10 grid gap-4 lg:grid-cols-[320px_1fr]">
          <div role="tablist" aria-label="Proyectos" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {projects.map((p) => {
              const selected = p.id === active.id;
              return (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveId(p.id)}
                  className={`min-w-[220px] shrink-0 rounded-2xl border p-4 text-left transition-colors focus-ring lg:min-w-0 ${selected ? 'border-primary bg-card rural-shadow' : 'border-border bg-background hover:border-primary/50'}`}
                >
                  <p className="font-editorial text-lg font-medium text-foreground">{p.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" aria-hidden="true" />{[p.city, p.region].filter(Boolean).join(', ') || 'Chile'}</p>
                  <p className="rural-data mt-2 text-xs text-foreground/80">{p.inventoryReady ? `${p.available} de ${p.total} disponibles` : 'Disponibilidad por consultar'}</p>
                </button>
              );
            })}
          </div>

          <div role="tabpanel" className="brand-border relative min-h-[420px] overflow-hidden rounded-3xl bg-card">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="absolute inset-0"
              >
                {active.image ? (
                  <img src={active.image} alt={`Vista de ${active.name}`} className="h-full w-full object-cover" />
                ) : <div className="h-full w-full grid-topo" />}
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
              <h3 className="font-editorial text-3xl font-medium text-foreground md:text-5xl">{active.name}</h3>
              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <div><dt className="sr-only">Precio</dt><dd className="font-semibold text-primary">{priceLabel(active.minPrice)}</dd></div>
                <div><dt className="sr-only">Disponibilidad</dt><dd className="text-foreground/80">{active.inventoryReady ? `${active.available} parcelas disponibles` : 'Disponibilidad por consultar'}</dd></div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                {hasTour && (
                  <Link to={`${base}?tab=tour360`} className="inline-flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-2 text-sm font-medium text-foreground backdrop-blur hover:border-primary focus-ring">
                    <Compass className="h-4 w-4" aria-hidden="true" />Tour 360
                  </Link>
                )}
                <Link to={`${base}?tab=map`} className="inline-flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-2 text-sm font-medium text-foreground backdrop-blur hover:border-primary focus-ring">
                  <MapIcon className="h-4 w-4" aria-hidden="true" />Plano de parcelas
                </Link>
                <Link to={`${base}?tab=lots`} className="inline-flex items-center gap-2 rounded-full border border-border bg-background/90 px-4 py-2 text-sm font-medium text-foreground backdrop-blur hover:border-primary focus-ring">
                  <LayoutGrid className="h-4 w-4" aria-hidden="true" />Ver parcelas
                </Link>
                <Link to={base} className="brand-gradient-btn inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold focus-ring">
                  Abrir proyecto<ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FluidProjectDock;
