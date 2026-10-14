import { FormEvent, lazy, Suspense, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowRight, Building2, Compass, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLandingStats } from '@/hooks/useLandingStats';
import { useTrackEvent } from '@/hooks/useTrackEvent';
import globeImage from '@/assets/brand/ot-globe-wide.jpg';

const InteractiveEarth = lazy(() => import('./InteractiveEarth'));

const EXAMPLE_SEARCHES = [
  '5.000 m² cerca de un lago',
  'Terreno hasta $30 millones',
  'Parcela a menos de 3 horas de Santiago',
];

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
    void track('atlas_search_started', { query });
    navigate(query ? `/explorar?q=${encodeURIComponent(query)}` : '/explorar');
  };

  const selectExample = (query: string) => {
    setSearch(query);
    void track('atlas_search_example_selected', { query });
  };

  return (
    <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden bg-background" aria-labelledby="hero-title">
      <img
        src={globeImage}
        alt="Globo cartográfico centrado en Sudamérica"
        className={`absolute inset-0 h-full w-full object-cover object-[72%_center] transition-opacity duration-1000 ${earthReady ? 'opacity-10' : 'opacity-55'}`}
        width={1920}
        height={1088}
        loading="eager"
      />

      {webglAvailable && (
        <div className={`absolute inset-y-0 right-0 w-full transition-opacity duration-1000 md:w-[72%] ${earthReady ? 'opacity-100' : 'opacity-0'}`}>
          <Suspense fallback={null}>
            <InteractiveEarth reducedMotion={Boolean(prefersReducedMotion)} onReady={() => setEarthReady(true)} />
          </Suspense>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/92 to-background/5" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/45" />
      <div className="pointer-events-none absolute inset-0 grid-topo opacity-20" aria-hidden="true" />

      <div className="container pointer-events-none relative z-content flex min-h-[calc(100svh-4rem)] items-center px-4 py-14 md:py-20">
        <motion.div
          className="pointer-events-auto max-w-4xl"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/65 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur-md">
            <Compass className="h-3.5 w-3.5" aria-hidden="true" />
            OfertaTerrenos Atlas
          </div>

          <h1 id="hero-title" className="max-w-4xl font-heading text-5xl font-bold leading-[0.92] text-foreground sm:text-6xl lg:text-7xl xl:text-8xl">
            Descubre dónde será tu próximo lugar.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-xl">
            Explora Chile como territorio, no como una lista. Encuentra proyectos, baja hasta la parcela y decide con disponibilidad, contexto y contacto comercial en un solo recorrido.
          </p>

          <form onSubmit={submitSearch} className="mt-8 max-w-3xl" role="search">
            <label htmlFor="atlas-search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-foreground/65">
              ¿Qué lugar estás buscando?
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Sparkles className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" aria-hidden="true" />
                <Input
                  id="atlas-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Ej. 5.000 m², cerca de un lago, hasta $30 millones…"
                  aria-label="Describe el terreno que estás buscando"
                  className="h-14 rounded-xl border-border/70 bg-background/88 pl-11 text-base shadow-lg backdrop-blur-md"
                />
              </div>
              <Button type="submit" size="lg" className="h-14 rounded-xl px-7">
                Explorar Chile <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </form>

          <div className="mt-3 flex max-w-3xl flex-wrap gap-2" aria-label="Ejemplos de búsqueda">
            {EXAMPLE_SEARCHES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => selectExample(example)}
                className="rounded-full border border-border/60 bg-background/45 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {example}
              </button>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            <Button asChild variant="outline" className="border-border/70 bg-background/55 backdrop-blur-md">
              <a href="#atlas"><Compass className="mr-2 h-4 w-4" aria-hidden="true" />Viajar por el territorio <ArrowDown className="ml-2 h-4 w-4" /></a>
            </Button>
            <Button asChild variant="ghost" className="bg-background/25 backdrop-blur-sm">
              <Link to="/planes-loteos"><Building2 className="mr-2 h-4 w-4" aria-hidden="true" />¿Vendes terrenos? Opera tu proyecto</Link>
            </Button>
          </div>

          {stats?.totalProjects ? (
            <dl className="mt-10 flex max-w-2xl flex-wrap gap-x-8 gap-y-4 border-t border-border/60 pt-5">
              <div><dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Red activa</dt><dd className="mt-1 font-heading text-2xl font-bold">{stats.totalProjects} proyectos</dd></div>
              <div><dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Territorio trazado</dt><dd className="mt-1 font-heading text-2xl font-bold text-primary">{stats.totalLots} lotes</dd></div>
              <div><dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Viaje Atlas</dt><dd className="mt-1 text-sm font-medium">Chile → región → proyecto → parcela</dd></div>
            </dl>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
};

export default CartographicHero;
