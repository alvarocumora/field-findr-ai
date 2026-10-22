import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, MapPin, Search, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { projectImages } from '@/lib/projectCovers';
import HeroTerrainGlobe from '@/components/landing/HeroTerrainGlobe';

interface ShowcaseProject {
  id: string;
  slug: string | null;
  name: string;
  city: string | null;
  region: string | null;
  image?: string;
  lat: number | null;
  lng: number | null;
  total: number | null;
  available: number | null;
  inventoryReady: boolean;
  minPrice?: number;
}

const clp = (v?: number) => (v ? `$${v.toLocaleString('es-CL')} CLP` : 'Consultar');

/** Quick filters map to real listing `type` values used by /explorar. */
export const QUICK_FILTERS = [
  { label: 'Parcelas', type: 'parcela_rural' },
  { label: 'Campos', type: 'campo_agricola' },
  { label: 'Industrial', type: 'sitio_industrial' },
] as const;

export const useShowcaseProjects = () =>
  useQuery({
    queryKey: ['landing-showcase-projects'],
    queryFn: async (): Promise<ShowcaseProject[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, slug, name, city, region, images, latitude, longitude, total_lots, available_lots, featured, created_at')
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return Promise.all((data ?? []).map(async (p) => {
        const { data: lots, error: lotsError } = await supabase.rpc('get_public_lots', { p_project_id: p.id });
        // Do not present stale project counters as live inventory after an RPC failure.
        const list = (lots ?? []) as Array<{ price: number | null; status: string | null }>;
        const avail = list.filter((l) => l.status === 'available');
        const prices = avail.map((l) => Number(l.price)).filter((n) => Number.isFinite(n) && n > 0);
        return {
          id: p.id, slug: p.slug, name: p.name, city: p.city, region: p.region,
          image: projectImages(p)[0],
          lat: p.latitude ?? null, lng: p.longitude ?? null,
          inventoryReady: !lotsError,
          total: lotsError ? null : list.length,
          available: lotsError ? null : avail.length,
          minPrice: !lotsError && prices.length ? Math.min(...prices) : undefined,
        };
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

const ProjectSummary = ({ active }: { active: ShowcaseProject }) => (
  <>
    <div className="min-w-0">
      <p className="truncate font-editorial text-base font-medium text-foreground sm:text-lg">{active.name}</p>
      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="h-3 w-3" aria-hidden="true" />{[active.city, active.region].filter(Boolean).join(', ') || 'Chile'}</p>
    </div>
    <dl className="flex shrink-0 gap-3 text-right sm:gap-4">
      <div><dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Disponibles</dt><dd className="rural-data text-sm font-semibold text-foreground">{active.inventoryReady ? `${active.available}/${active.total}` : 'Consultar'}</dd></div>
      <div><dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Desde</dt><dd className="rural-data text-sm font-semibold text-primary">{clp(active.minPrice)}</dd></div>
    </dl>
  </>
);

const CinematicShowcaseHero = () => {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { data: projects = [], isError } = useShowcaseProjects();
  const withImage = projects.filter((p) => p.image);
  const [index, setIndex] = useState(0);
  const active = withImage[index % Math.max(withImage.length, 1)];

  useEffect(() => {
    if (reduced || withImage.length < 2) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % withImage.length), 11000);
    return () => window.clearInterval(t);
  }, [reduced, withImage.length]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/explorar?q=${encodeURIComponent(q)}` : '/explorar');
  };

  const projectHref = active ? (active.slug ? `/p/${encodeURIComponent(active.slug)}` : `/proyecto/${encodeURIComponent(active.id)}`) : '/explorar';

  return (
    <section className="relative isolate overflow-hidden bg-background" aria-labelledby="hero-title">
      {/* Full-bleed living globe */}
      <div className="relative h-[62svh] min-h-[380px] w-full lg:absolute lg:inset-0 lg:h-full">
        <HeroTerrainGlobe
          projects={withImage.map((p) => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng }))}
          activeId={active?.id}
          reducedMotion={!!reduced}
          onSelect={(id) => { const i = withImage.findIndex((p) => p.id === id); if (i >= 0) setIndex(i); }}
          fallback={
            <AnimatePresence mode="sync">
              {active?.image ? (
                <motion.img key={active.id} src={active.image} alt={`Vista aérea de ${active.name}`}
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={reduced ? false : { opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 1.4 }} />
              ) : (
                <div className="absolute inset-0 grid-topo opacity-40" aria-hidden="true" />
              )}
            </AnimatePresence>
          }
        />
        {/* Paper vignette so the world melts into the page */}
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-background/70 via-transparent to-background lg:bg-gradient-to-r lg:from-background lg:via-background/40 lg:to-transparent" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-24 bg-gradient-to-t from-background to-transparent" aria-hidden="true" />

        {active && (
          <Link to={projectHref} className="absolute bottom-4 right-4 z-10 hidden w-[340px] items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 p-4 backdrop-blur-md rural-shadow focus-ring lg:flex">
            <ProjectSummary active={active} />
          </Link>
        )}
      </div>

      <div className="container relative z-10 px-4 pb-10 lg:flex lg:min-h-[min(92svh,860px)] lg:flex-col lg:justify-center lg:py-20">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="-mt-16 min-w-0 rounded-2xl border border-border bg-card/85 p-5 backdrop-blur-md rural-shadow sm:p-7 lg:mt-0 lg:max-w-xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Rural Finder · Atlas de Chile</p>
          <h1 id="hero-title" className="mt-3 font-editorial text-[2rem] font-medium leading-[1.05] text-foreground sm:text-5xl">
            Encuentra tierra con <em className="text-primary">papeles claros</em> y precio publicado.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:mt-4 sm:text-base">
            Recorre el territorio en 3D, entra a cada proyecto y revisa lotes, tour 360 y documentos.
          </p>

          <form onSubmit={submit} role="search" className="mt-5">
            <label htmlFor="hero-search" className="sr-only">Destino, comuna o proyecto</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="hero-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ej. Licantén, Hualañé, Maule" className="h-12 rounded-xl bg-background pl-10 text-base" />
              </div>
              <Button type="submit" size="lg" className="h-12 rounded-xl px-6">
                Explorar terrenos <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtros rápidos">
            {QUICK_FILTERS.map((f) => (
              <Link key={f.type} to={`/explorar?type=${f.type}`} className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-ring">
                {f.label}
              </Link>
            ))}
          </div>

          {withImage.length > 1 && (
            <div className="mt-5 flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist" aria-label="Proyectos destacados">
              {withImage.map((p, i) => (
                <button key={p.id} type="button" role="tab" aria-selected={p.id === active?.id} onClick={() => setIndex(i)}
                  className={`min-h-10 shrink-0 snap-start rounded-full border px-4 py-2 text-xs font-medium transition-colors focus-ring ${p.id === active?.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:border-primary'}`}>
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {active && (
            <Link to={projectHref} className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3 focus-ring lg:hidden">
              <ProjectSummary active={active} />
            </Link>
          )}
          {isError && <p role="alert" className="mt-3 text-sm text-destructive">No pudimos cargar los proyectos destacados. Puedes explorar el mapa igualmente.</p>}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <a href="#atlas" className="inline-flex min-h-11 items-center gap-1.5 text-primary underline-offset-4 hover:underline focus-ring"><MapPin className="h-4 w-4" aria-hidden="true" />Explorar Chile por región</a>
            <span className="hidden items-center gap-1.5 sm:inline-flex"><ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />Documentación por proyecto</span>
            <Link to="/planes-loteos" className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline">
              <Building2 className="h-4 w-4" aria-hidden="true" />¿Vendes terrenos?
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CinematicShowcaseHero;
