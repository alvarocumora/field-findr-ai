import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Map, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLandingStats } from '@/hooks/useLandingStats';
import { useTrackEvent } from '@/hooks/useTrackEvent';
import ProjectCommercialCard, { CommercialProject } from './ProjectCommercialCard';
import globeImage from '@/assets/brand/ot-globe-wide.jpg';

const CartographicHero = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [search, setSearch] = useState('');
  const { data: stats } = useLandingStats();
  const { track } = useTrackEvent();

  const { data: projects = [] } = useQuery({
    queryKey: ['commercial-hero-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, slug, name, description, city, region, images, total_lots, available_lots, featured, created_at')
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;

      const visible = (data ?? []).filter((project) => Array.isArray(project.images) && project.images.length > 0).slice(0, 3);
      const enriched = await Promise.all(visible.map(async (project) => {
        const { data: lots } = await supabase.rpc('get_public_lots', { p_project_id: project.id });
        const prices = (lots ?? [])
          .map((lot) => Number(lot.price))
          .filter((price) => Number.isFinite(price) && price > 0);
        return { ...project, minPrice: prices.length ? Math.min(...prices) : undefined };
      }));
      return enriched as CommercialProject[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const totalProjects = useMemo(() => projects.length, [projects]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    void track('landing_search_started', { query });
    navigate(query ? `/explorar?q=${encodeURIComponent(query)}` : '/explorar');
  };

  return (
    <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden bg-background" aria-labelledby="hero-title">
      <img
        src={globeImage}
        alt="Globo cartográfico centrado en Sudamérica"
        className="absolute inset-0 h-full w-full object-cover object-[62%_center] opacity-80"
        width={1920}
        height={1088}
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
      <div className="absolute inset-0 grid-topo opacity-20" aria-hidden="true" />

      <div className="container relative z-content flex min-h-[calc(100svh-4rem)] flex-col justify-between px-4 pb-7 pt-12 md:pb-10 md:pt-16">
        <motion.div
          className="max-w-3xl"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            Proyectos disponibles en Chile
          </div>
          <h1 id="hero-title" className="max-w-3xl font-heading text-5xl font-bold leading-[0.95] text-foreground sm:text-6xl lg:text-7xl">
            Encuentra tierra con futuro.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Explora loteos completos, revisa sus planos y disponibilidad, y agenda una visita desde una sola plataforma.
          </p>

          <form onSubmit={submitSearch} className="mt-7 flex max-w-2xl flex-col gap-2 sm:flex-row" role="search">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Comuna, región o tipo de terreno"
                aria-label="Buscar proyectos por comuna, región o tipo"
                className="h-12 rounded-md border-border/70 bg-background/80 pl-11 backdrop-blur-md"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 rounded-md px-6">
              Explorar proyectos <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
            <Button asChild type="button" variant="outline" size="lg" className="h-12 rounded-md border-border/70 bg-background/60 px-5 backdrop-blur-md">
              <Link to="/explorar?view=map"><Map className="mr-2 h-4 w-4" aria-hidden="true" />Ver mapa</Link>
            </Button>
          </form>
        </motion.div>

        <div className="mt-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-foreground">Proyectos para explorar</p>
              <Link to="/explorar" className="text-xs text-primary hover:underline">Ver todos</Link>
            </div>
            <div className="flex max-w-full gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {projects.slice(0, 3).map((project) => (
                <ProjectCommercialCard
                  key={project.id}
                  project={project}
                  compact
                  onOpen={(selected) => void track('landing_project_opened', { project_id: selected.id })}
                />
              ))}
              {totalProjects === 0 && (
                <div className="flex h-48 w-[15.5rem] items-center justify-center rounded-md border border-border/60 bg-card/70 px-6 text-center text-sm text-muted-foreground">
                  Cargando proyectos disponibles…
                </div>
              )}
            </div>
          </div>

          {stats?.totalListings ? (
            <dl className="flex shrink-0 gap-6 border-t border-border/60 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <div><dt className="text-[10px] uppercase text-muted-foreground">Publicados</dt><dd className="font-heading text-xl font-bold">{stats.totalListings}</dd></div>
              <div><dt className="text-[10px] uppercase text-muted-foreground">Disponibles</dt><dd className="font-heading text-xl font-bold text-primary">{stats.totalLots}</dd></div>
            </dl>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default CartographicHero;