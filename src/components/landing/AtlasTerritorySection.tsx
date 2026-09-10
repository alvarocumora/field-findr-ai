import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, MapPinned, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface AtlasProject {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  total_lots: number | null;
  available_lots: number | null;
}

const AtlasTerritorySection = () => {
  const prefersReducedMotion = useReducedMotion();
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['atlas-active-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, city, region, total_lots, available_lots')
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as AtlasProject[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const regions = useMemo(() => {
    const grouped = new Map<string, { projects: number; lots: number; available: number }>();
    projects.forEach((project) => {
      const region = project.region?.trim();
      if (!region) return;
      const current = grouped.get(region) ?? { projects: 0, lots: 0, available: 0 };
      current.projects += 1;
      current.lots += Number(project.total_lots ?? 0);
      current.available += Number(project.available_lots ?? 0);
      grouped.set(region, current);
    });

    return Array.from(grouped.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.projects - a.projects || b.available - a.available)
      .slice(0, 6);
  }, [projects]);

  const selectedRegion = activeRegion ?? regions[0]?.name ?? null;
  const visibleProjects = useMemo(
    () => projects.filter((project) => project.region === selectedRegion).slice(0, 4),
    [projects, selectedRegion],
  );

  return (
    <section id="atlas" className="relative overflow-hidden border-y border-border/50 bg-foreground py-20 text-background md:py-28" aria-labelledby="atlas-title">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] grid-topo" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 top-1/2 h-[30rem] w-[30rem] -translate-y-1/2 rounded-full border border-background/15" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-8 top-1/2 h-[20rem] w-[20rem] -translate-y-1/2 rounded-full border border-background/10" aria-hidden="true" />

      <div className="container relative px-4">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-24"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-background/70">
              <Compass className="h-3.5 w-3.5" /> OfertaTerrenos Atlas
            </div>
            <h2 id="atlas-title" className="mt-5 max-w-xl font-heading text-4xl font-bold leading-tight md:text-6xl">
              Chile no es una lista. Es un territorio para explorar.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-background/65 md:text-lg">
              Navega desde la región hasta el proyecto y la parcela. Atlas convierte inventario real en una experiencia territorial, sin perder disponibilidad ni contexto comercial.
            </p>

            <div className="mt-8 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-background/50" aria-label="Flujo Atlas">
              <span>Chile</span><span>→</span><span>Región</span><span>→</span><span>Proyecto</span><span>→</span><span className="text-background">Parcela</span>
            </div>
          </motion.div>

          <div className="rounded-3xl border border-background/15 bg-background/[0.055] p-4 shadow-2xl backdrop-blur-sm md:p-6">
            <div className="flex flex-col gap-4 border-b border-background/10 pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-background/45">Exploración territorial</p>
                <p className="mt-1 text-sm text-background/70">Selecciona una región para descubrir su inventario activo.</p>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link to="/explorar"><MapPinned className="mr-2 h-4 w-4" />Abrir explorador</Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="grid gap-3 py-6 sm:grid-cols-2">
                {[0, 1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-background/10" />)}
              </div>
            ) : regions.length > 0 ? (
              <>
                <div className="flex gap-2 overflow-x-auto py-5 scrollbar-hide">
                  {regions.map((region) => {
                    const active = region.name === selectedRegion;
                    return (
                      <button
                        key={region.name}
                        type="button"
                        onClick={() => setActiveRegion(region.name)}
                        className={`min-w-[10rem] rounded-2xl border px-4 py-3 text-left transition-colors ${active ? 'border-background/45 bg-background text-foreground' : 'border-background/10 bg-background/5 text-background hover:bg-background/10'}`}
                        aria-pressed={active}
                      >
                        <span className={`block text-[10px] uppercase tracking-[0.14em] ${active ? 'text-foreground/55' : 'text-background/45'}`}>{region.projects} proyecto{region.projects === 1 ? '' : 's'}</span>
                        <span className="mt-1 block font-heading text-lg font-bold">{region.name}</span>
                        <span className={`mt-1 block text-xs ${active ? 'text-foreground/60' : 'text-background/55'}`}>{region.available} lotes disponibles</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {visibleProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: prefersReducedMotion ? 0 : index * 0.06 }}
                      className="group rounded-2xl border border-background/10 bg-background/[0.045] p-5 transition-colors hover:bg-background/[0.09]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-background/45">{project.city || selectedRegion}</p>
                          <h3 className="mt-1 font-heading text-xl font-bold">{project.name}</h3>
                        </div>
                        <Sparkles className="h-4 w-4 text-background/35 transition-colors group-hover:text-background" />
                      </div>
                      <div className="mt-5 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-2xl font-bold">{Number(project.available_lots ?? 0)}</p>
                          <p className="text-xs text-background/45">lotes disponibles</p>
                        </div>
                        <Link to={`/explorar?q=${encodeURIComponent(project.name)}`} className="inline-flex items-center text-sm font-medium text-background/75 hover:text-background">
                          Viajar al proyecto <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-sm text-background/55">
                Atlas mostrará aquí las regiones cuando existan proyectos activos con ubicación publicada.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AtlasTerritorySection;
