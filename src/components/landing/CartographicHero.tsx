import { FormEvent, lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Building2, Map, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLandingStats } from '@/hooks/useLandingStats';
import { useTrackEvent } from '@/hooks/useTrackEvent';
import globeImage from '@/assets/brand/ot-globe-wide.jpg';

const InteractiveEarth = lazy(() => import('./InteractiveEarth'));

const CartographicHero = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [search, setSearch] = useState('');
  const [earthReady, setEarthReady] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState(false);
  const { data: stats } = useLandingStats();
  const { track } = useTrackEvent();

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      setWebglAvailable(Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')));
    } catch {
      setWebglAvailable(false);
    }
  }, []);

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
        className={`absolute inset-0 h-full w-full object-cover object-[68%_center] transition-opacity duration-1000 ${earthReady ? 'opacity-15' : 'opacity-65'}`}
        width={1920}
        height={1088}
        loading="eager"
      />

      {webglAvailable && (
        <div className={`absolute inset-y-0 right-0 w-full transition-opacity duration-1000 md:w-[68%] ${earthReady ? 'opacity-100' : 'opacity-0'}`}>
          <Suspense fallback={null}>
            <InteractiveEarth reducedMotion={Boolean(prefersReducedMotion)} onReady={() => setEarthReady(true)} />
          </Suspense>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/15" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/55" />
      <div className="pointer-events-none absolute inset-0 grid-topo opacity-20" aria-hidden="true" />

      <div className="container pointer-events-none relative z-content flex min-h-[calc(100svh-4rem)] items-center px-4 py-14 md:py-20">
        <motion.div
          className="pointer-events-auto max-w-3xl"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/65 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            La red de terrenos de Chile
          </div>

          <h1 id="hero-title" className="max-w-3xl font-heading text-5xl font-bold leading-[0.94] text-foreground sm:text-6xl lg:text-7xl xl:text-8xl">
            Encuentra. Visita. Reserva.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-xl">
            Descubre proyectos y terrenos disponibles, revisa parcelas y precios, y conecta directamente con quienes los comercializan.
          </p>

          <form onSubmit={submitSearch} className="mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row" role="search">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Comuna, región o tipo de terreno"
                aria-label="Buscar proyectos por comuna, región o tipo"
                className="h-12 rounded-md border-border/70 bg-background/85 pl-11 backdrop-blur-md"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 rounded-md px-6">
              Explorar terrenos <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild type="button" variant="outline" className="border-border/70 bg-background/55 backdrop-blur-md">
              <Link to="/explorar?view=map"><Map className="mr-2 h-4 w-4" aria-hidden="true" />Ver proyectos en el mapa</Link>
            </Button>
            <Button asChild type="button" variant="ghost" className="bg-background/25 backdrop-blur-sm">
              <Link to="/planes-loteos"><Building2 className="mr-2 h-4 w-4" aria-hidden="true" />¿Vendes terrenos? Publica y gestiona</Link>
            </Button>
          </div>

          {stats?.totalProjects ? (
            <dl className="mt-10 flex max-w-xl flex-wrap gap-x-8 gap-y-4 border-t border-border/60 pt-5">
              <div><dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Proyectos activos</dt><dd className="mt-1 font-heading text-2xl font-bold">{stats.totalProjects}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Lotes trazados</dt><dd className="mt-1 font-heading text-2xl font-bold text-primary">{stats.totalLots}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Proceso</dt><dd className="mt-1 text-sm font-medium">Explora → visita → reserva</dd></div>
            </dl>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
};

export default CartographicHero;
