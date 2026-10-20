import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, MapPin, Search, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { projectImages } from '@/lib/projectCovers';
import { projectLandingPath } from '@/lib/landing/paths';

interface ShowcaseProject {
  id: string;
  slug: string | null;
  name: string;
  city: string | null;
  region: string | null;
  image?: string;
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
        .select('id, slug, name, city, region, images, total_lots, available_lots, featured, created_at')
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(6);
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
          inventoryReady: !lotsError,
          total: lotsError ? null : list.length,
          available: lotsError ? null : avail.length,
          minPrice: !lotsError && prices.length ? Math.min(...prices) : undefined,
        };
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

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
    const t = window.setInterval(() => setIndex((i) => (i + 1) % withImage.length), 7000);
    return () => window.clearInterval(t);
  }, [reduced, withImage.length]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/explorar?q=${encodeURIComponent(q)}` : '/explorar');
  };

  return (
    <section className="relative bg-background" aria-labelledby="hero-title">
      <div className="container grid gap-10 px-4 pb-14 pt-10 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14 lg:pb-20">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="min-w-0"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">Rural Finder · Atlas de Chile</p>
          <h1 id="hero-title" className="mt-4 font-editorial text-4xl font-medium leading-[1.02] text-foreground sm:text-5xl lg:text-6xl">
            Encuentra tierra con <em className="text-primary">papeles claros</em> y precio publicado.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Parcelas, campos y terrenos industriales con información territorial, fichas de proyecto y opciones para coordinar visitas.
          </p>

          <form onSubmit={submit} role="search" className="mt-7 max-w-xl">
            <label htmlFor="hero-search" className="mb-2 block text-xs font-semibold text-foreground">Destino, comuna o proyecto</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="hero-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ej. Licantén, Hualañé, Región del Maule" className="h-12 rounded-xl bg-card pl-10 text-base rural-shadow" />
              </div>
              <Button type="submit" size="lg" className="h-12 rounded-xl px-6">
                Explorar terrenos <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap gap-2" aria-label="Filtros rápidos">
            {QUICK_FILTERS.map((f) => (
              <Link key={f.type} to={`/explorar?type=${f.type}`} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-ring">
                {f.label}
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />Consulta documentación e inventario por proyecto</span>
            <Link to="/planes-loteos" className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline">
              <Building2 className="h-4 w-4" aria-hidden="true" />¿Vendes terrenos? Publica tu proyecto
            </Link>
          </div>
        </motion.div>

        <div className="min-w-0">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted rural-shadow">
            <AnimatePresence mode="sync">
              {active?.image ? (
                <motion.img
                  key={active.id}
                  src={active.image}
                  alt={`Vista aérea de ${active.name}`}
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                />
              ) : (
                <div className="absolute inset-0 grid-topo opacity-40" aria-hidden="true" />
              )}
            </AnimatePresence>
            {active && (
              <Link to={projectLandingPath(active)} className="absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-between gap-3 rounded-xl border border-border bg-card/95 p-4 backdrop-blur focus-ring">
                <div className="min-w-0">
                  <p className="truncate font-editorial text-lg font-medium text-foreground">{active.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="h-3 w-3" aria-hidden="true" />{[active.city, active.region].filter(Boolean).join(', ') || 'Chile'}</p>
                </div>
                <dl className="flex gap-5 text-right">
                  <div><dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Disponibles</dt><dd className="rural-data text-sm font-semibold text-foreground">{active.inventoryReady ? `${active.available}/${active.total}` : 'Consultar'}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Desde</dt><dd className="rural-data text-sm font-semibold text-primary">{clp(active.minPrice)}</dd></div>
                </dl>
              </Link>
            )}
          </div>
          {isError && <p role="alert" className="mt-3 text-sm text-destructive">No pudimos cargar los proyectos destacados. Puedes explorar el mapa igualmente.</p>}
          {withImage.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Proyectos destacados">
              {withImage.map((p, i) => (
                <button key={p.id} type="button" role="tab" aria-selected={p.id === active?.id} onClick={() => setIndex(i)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-ring ${p.id === active?.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary'}`}>
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CinematicShowcaseHero;
