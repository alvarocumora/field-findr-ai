import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Compass, MapPinned } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useTrackEvent } from '@/hooks/useTrackEvent';
import { groupByCanonicalRegion, resolveChileCommune, resolveRegionTerritory } from '@/lib/territories';

interface AtlasProject {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
}

interface TravelState {
  project: AtlasProject;
  stage: 'region' | 'commune' | 'project';
}

const AtlasTerritorySection = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { track } = useTrackEvent();
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [activeCommune, setActiveCommune] = useState<string | null>(null);
  const [travel, setTravel] = useState<TravelState | null>(null);
  const travelTimers = useRef<number[]>([]);

  const { data: projects = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['atlas-active-projects', 'Chile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, slug, city, region, country')
        .eq('status', 'active')
        .eq('country', 'Chile')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as AtlasProject[];
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => () => {
    travelTimers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const regions = useMemo(() => {
    return groupByCanonicalRegion(projects)
      .map(({ territory, items }) => ({
        key: territory.key,
        slug: territory.slug,
        name: territory.displayName,
        canonicalName: territory.name,
        projects: items.length,
      }))
      .sort((a, b) => b.projects - a.projects || a.name.localeCompare(b.name, 'es'))
      .slice(0, 6);
  }, [projects]);

  const selectedRegion = activeRegion ?? regions[0]?.key ?? null;
  const selectedRegionMeta = regions.find((region) => region.key === selectedRegion) ?? null;

  const regionProjects = useMemo(
    () => projects.filter((project) => {
      if (!project.region || !selectedRegion) return false;
      return resolveRegionTerritory(project.region, project.country || 'Chile').key === selectedRegion;
    }),
    [projects, selectedRegion],
  );

  const communes = useMemo(() => {
    const grouped = new Map<string, {
      key: string;
      name: string;
      code: string | null;
      province: string | null;
      projects: number;
    }>();

    regionProjects.forEach((project) => {
      const resolved = resolveChileCommune(project.city, project.region);
      const name = resolved?.commune || project.city?.trim();
      if (!name) return;
      const key = resolved?.communeCode || name.toLowerCase();
      const current = grouped.get(key) ?? {
        key,
        name,
        code: resolved?.communeCode || null,
        province: resolved?.province || null,
        projects: 0,
      };
      current.projects += 1;
      grouped.set(key, current);
    });

    return [...grouped.values()].sort((a, b) =>
      b.projects - a.projects || a.name.localeCompare(b.name, 'es'),
    );
  }, [regionProjects]);

  const visibleProjects = useMemo(() => {
    const scoped = activeCommune
      ? regionProjects.filter((project) => {
          const resolved = resolveChileCommune(project.city, project.region);
          const key = resolved?.communeCode || project.city?.trim().toLowerCase();
          return key === activeCommune;
        })
      : regionProjects;
    return scoped.slice(0, 6);
  }, [regionProjects, activeCommune]);

  // Si las tarjetas visibles ya comparten una sola comuna (filtrada a mano o
  // porque la región solo tiene proyectos en una comuna), repetirla en cada
  // tarjeta es ruido, no información — se muestra una sola vez arriba.
  const visibleCommuneCount = useMemo(() => {
    const keys = new Set(
      visibleProjects.map((project) => {
        const resolved = resolveChileCommune(project.city, project.region);
        return resolved?.communeCode || project.city?.trim().toLowerCase() || project.region;
      }),
    );
    return keys.size;
  }, [visibleProjects]);
  const showCardCommuneLabel = visibleCommuneCount > 1;

  const travelToProject = (project: AtlasProject) => {
    void track('atlas_travel_started', {
      project_id: project.id,
      project_name: project.name,
      region: project.region,
    });

    // Siempre el proyecto canónico por ID, nunca la landing bespoke por slug
    // (si existe) — una misma tarjeta/transición no debe competir con
    // ProjectCommercialCard por el destino de un mismo proyecto (gap
    // encontrado al revisar el lote Rural Finder).
    const projectHome = `/proyecto/${encodeURIComponent(project.id)}/experiencia`;

    if (prefersReducedMotion) {
      navigate(projectHome);
      return;
    }

    travelTimers.current.forEach((timer) => window.clearTimeout(timer));
    setTravel({ project, stage: 'region' });
    travelTimers.current = [
      window.setTimeout(() => setTravel({ project, stage: 'commune' }), 520),
      window.setTimeout(() => setTravel({ project, stage: 'project' }), 1040),
      window.setTimeout(() => navigate(projectHome), 1600),
    ];
  };

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
            <div className="inline-flex items-center gap-2 text-background/70">
              <Compass className="h-3.5 w-3.5" />
              <span className="font-swiss text-[11px]">OfertaTerrenos Atlas</span>
            </div>
            <h2 id="atlas-title" className="mt-5 max-w-xl font-editorial text-4xl font-medium leading-[1.05] md:text-6xl">
              Explora Chile desde su territorio.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-background/65 md:text-lg">
              Navega por región y comuna, descubre los proyectos y llega a sus fichas territoriales. La disponibilidad y los precios se verifican en cada proyecto.
            </p>

            <div className="mt-8 flex items-center gap-2 font-swiss text-[11px] text-background/50" aria-label="Flujo Atlas">
              <span>Chile</span><span>→</span><span>Región</span><span>→</span><span>Comuna</span><span>→</span><span className="text-background">Proyecto</span>
            </div>
          </motion.div>

          <div className="rounded-3xl border border-background/15 bg-background/[0.055] p-4 shadow-2xl backdrop-blur-sm md:p-6">
            <div className="flex flex-col gap-4 border-b border-background/10 pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-swiss text-[11px] text-background/45">Exploración territorial</p>
                <p className="mt-1 text-sm text-background/70">Selecciona región y comuna para navegar el inventario territorial hasta cada proyecto.</p>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link to="/explorar"><MapPinned className="mr-2 h-4 w-4" />Abrir explorador</Link>
              </Button>
            </div>

            {isError ? (
              <div role="alert" className="py-8 text-sm text-background">
                <p>No pudimos cargar las regiones en este momento. Puedes seguir al explorador o volver a intentarlo.</p>
                <Button type="button" variant="secondary" className="mt-4 min-h-11" onClick={() => void refetch()}>Reintentar Atlas</Button>
              </div>
            ) : isLoading ? (
              <div className="grid gap-3 py-6 sm:grid-cols-2">
                {[0, 1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-background/10" />)}
              </div>
            ) : regions.length > 0 ? (
              <>
                <div className="flex gap-2 overflow-x-auto py-5 scrollbar-hide">
                  {regions.map((region) => {
                    const active = region.key === selectedRegion;
                    return (
                      <button
                        key={region.key}
                        type="button"
                        onClick={() => {
                          setActiveRegion(region.key);
                          setActiveCommune(null);
                        }}
                        className={`min-w-[10rem] rounded-2xl border px-4 py-3 text-left transition-colors ${active ? 'border-background/45 bg-background text-foreground' : 'border-background/10 bg-background/5 text-background hover:bg-background/10'}`}
                        aria-pressed={active}
                      >
                        <span className={`block font-swiss text-[10px] ${active ? 'text-foreground/55' : 'text-background/45'}`}>{region.projects} proyecto{region.projects === 1 ? '' : 's'}</span>
                        <span className="mt-1 block font-editorial text-lg font-medium">{region.name}</span>
                        <span className={`mt-1 block text-xs ${active ? 'text-foreground/60' : 'text-background/55'}`}>Explorar proyectos en esta región</span>
                      </button>
                    );
                  })}
                </div>

                {communes.length > 0 && (
                  <div className="mb-5 flex items-center gap-2 border-t border-background/10 pt-4">
                    <span className="font-swiss shrink-0 text-[10px] text-background/40">Comuna</span>
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                      {communes.map((commune) => {
                        const active = commune.key === activeCommune;
                        return (
                          <button
                            key={commune.key}
                            type="button"
                            onClick={() => setActiveCommune(active ? null : commune.key)}
                            className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${active ? 'border-emerald-300/60 bg-emerald-300/15 text-background' : 'border-background/15 text-background/70 hover:bg-background/[0.08]'}`}
                            aria-pressed={active}
                          >
                            {commune.name} <span className="text-background/45">· {commune.projects}</span>
                          </button>
                        );
                      })}
                    </div>
                    {activeCommune && (
                      <button
                        type="button"
                        className="shrink-0 text-[11px] text-background/55 hover:text-background"
                        onClick={() => setActiveCommune(null)}
                      >
                        Ver todas
                      </button>
                    )}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {visibleProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: prefersReducedMotion ? 0 : index * 0.06 }}
                      className="group rounded-2xl border border-background/10 bg-background/[0.045] p-5 transition-colors hover:bg-background/[0.09]"
                    >
                      {/* La comuna ya está seleccionada arriba (filtro activo) —
                          repetirla en cada tarjeta era ruido puro, no info nueva. */}
                      {showCardCommuneLabel && (() => {
                        const commune = resolveChileCommune(project.city, project.region);
                        return (
                          <p className="font-swiss text-[10px] text-background/45">
                            {commune?.commune || project.city || selectedRegionMeta?.name || project.region}
                            {commune?.province ? ` · Prov. ${commune.province}` : ''}
                          </p>
                        );
                      })()}
                      <h3 className={`font-editorial text-xl font-medium ${showCardCommuneLabel ? 'mt-1' : ''}`}>{project.name}</h3>
                      <div className="mt-5 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-xs text-background/65">Disponibilidad por confirmar en la ficha del proyecto</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => travelToProject(project)}
                          className="inline-flex items-center text-sm font-medium text-background/75 transition-colors hover:text-background"
                        >
                          Ver proyecto <ArrowRight className="ml-1.5 h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-sm text-background/55">
                Atlas mostrará aquí las regiones de Chile cuando existan proyectos activos con ubicación publicada.
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {travel ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
          >
            <motion.div
              className="absolute h-[26rem] w-[26rem] rounded-full border border-white/15 md:h-[40rem] md:w-[40rem]"
              initial={{ scale: 0.35, opacity: 0.2 }}
              animate={{ scale: travel.stage === 'project' ? 2.6 : travel.stage === 'commune' ? 1.45 : 0.8, opacity: 0.5 }}
              transition={{ duration: 0.52, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute h-[15rem] w-[15rem] rounded-full border border-white/10 md:h-[24rem] md:w-[24rem]"
              initial={{ scale: 0.4 }}
              animate={{ scale: travel.stage === 'project' ? 2.2 : travel.stage === 'commune' ? 1.25 : 0.72 }}
              transition={{ duration: 0.52, ease: 'easeInOut' }}
            />

            <div className="relative z-10 max-w-3xl px-6 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/45">OfertaTerrenos Atlas</p>
              <motion.p
                key={travel.stage}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="mt-5 font-editorial text-4xl font-medium md:text-7xl"
              >
                {travel.stage === 'region' && (travel.project.region || 'Chile')}
                {travel.stage === 'commune' && (travel.project.city || 'Chile')}
                {travel.stage === 'project' && travel.project.name}
              </motion.p>
              <motion.div
                className="mx-auto mt-8 h-px max-w-md origin-left bg-white/35"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
              <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">
                <span className={travel.stage === 'region' ? 'text-white' : undefined}>Región</span>
                <span>→</span>
                <span className={travel.stage === 'commune' ? 'text-white' : undefined}>Comuna</span>
                <span>→</span>
                <span className={travel.stage === 'project' ? 'text-white' : undefined}>Proyecto</span>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
};

export default AtlasTerritorySection;
