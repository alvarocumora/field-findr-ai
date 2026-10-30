import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Compass, MapPin } from 'lucide-react';
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
  const { data: projects = [], isLoading, isError, refetch, isFetching } = useShowcaseProjects();
  const { data: tours } = useProjectsWithTour(projects.map((p) => p.id));

  if (isLoading) return <section id="proyectos-en-venta" className="container scroll-mt-20 px-4 py-16"><div className="h-[420px] animate-pulse rounded-3xl bg-muted" /></section>;
  if (isError || !projects.length) return <section id="proyectos-en-venta" className="container scroll-mt-20 px-4 py-12"><h2 className="font-editorial text-3xl">Encuentra tu terreno</h2><p className="mt-3 text-muted-foreground">{isError ? 'No pudimos cargar los proyectos en este momento.' : 'Explora las publicaciones y consulta sus opciones de compra.'}</p>{isError && <button type="button" disabled={isFetching} onClick={() => void refetch()} className="mt-4 mr-4 inline-flex min-h-11 items-center text-primary underline focus-ring">Reintentar proyectos</button>}<Link to="/explorar" className="mt-4 inline-flex min-h-11 items-center text-primary underline focus-ring">Ver terrenos en venta</Link></section>;

  return (
    <section id="proyectos-en-venta" className="scroll-mt-20 py-16 md:py-24" aria-labelledby="dock-title">
      <div className="container px-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Tu próxima oportunidad</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h2 id="dock-title" className="max-w-3xl font-editorial text-3xl font-medium md:text-5xl">Proyectos para dar el siguiente paso.</h2>
          <Link to="/explorar" className="inline-flex min-h-11 items-center gap-2 text-primary underline focus-ring">Ver catálogo completo <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const base = `/proyecto/${encodeURIComponent(project.id)}`;
            return (
              <article key={project.id} className="flex min-w-0 flex-col overflow-hidden rounded-3xl border bg-card rural-shadow">
                <Link to={base} className="block focus-ring" aria-label={`Ver ${project.name}`}>
                  {project.image ? <img src={project.image} alt={`Vista de ${project.name}`} loading="lazy" className="aspect-[4/3] w-full object-cover" /> : <div className="aspect-[4/3] grid-topo" />}
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" aria-hidden="true" />{[project.city, project.region].filter(Boolean).join(', ') || 'Chile'}</p>
                  <h3 className="mt-2 font-editorial text-2xl font-medium">{project.name}</h3>
                  <p className="mt-3 font-semibold text-primary">{priceLabel(project.minPrice)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{project.inventoryReady ? `${project.available} parcelas disponibles` : 'Consulta disponibilidad'}</p>
                  <div className="mt-auto flex flex-wrap gap-3 pt-6">
                    <Link to={`${base}?tab=lots`} className="brand-gradient-btn inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold focus-ring">Ver parcelas <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                    {tours?.has(project.id) && <Link to={`${base}?tab=tour360`} className="inline-flex min-h-11 items-center gap-2 text-sm text-primary underline focus-ring"><Compass className="h-4 w-4" aria-hidden="true" />Tour 360</Link>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FluidProjectDock;
