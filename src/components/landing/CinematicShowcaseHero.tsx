import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, MapPin, Search, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { projectImages } from '@/lib/projectCovers';
import GlobeHeroBackdrop from './GlobeHeroBackdrop';

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
    <section className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden bg-background" aria-labelledby="hero-title">
      <GlobeHeroBackdrop />
      <div className="container relative z-10 grid gap-8 px-4 pb-12 pt-12 md:pt-16 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-12 lg:pb-20">
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

          {isError && <p role="alert" className="mt-3 text-sm text-destructive">No pudimos cargar los proyectos destacados. Puedes explorar el mapa igualmente.</p>}

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <a href="#atlas" className="inline-flex min-h-11 items-center gap-1.5 text-primary underline-offset-4 hover:underline focus-ring"><MapPin className="h-4 w-4" aria-hidden="true" />Explorar Chile por región</a>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />Consulta documentación e inventario por proyecto</span>
            <Link to="/planes-loteos" className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline">
              <Building2 className="h-4 w-4" aria-hidden="true" />¿Vendes terrenos? Publica tu proyecto
            </Link>
          </div>
        </motion.div>

        {/* The planet is the visual anchor. Keep the featured project as a compact
            glass card so it does not hide the globe, including on wide monitors. */}
        <div className="relative hidden min-h-[470px] min-w-0 flex-col items-end justify-end gap-3 lg:flex">
          {active && (
            <Link
              to={`/proyecto/${encodeURIComponent(active.id)}`}
              className="group w-full max-w-[340px] rounded-2xl border border-border/70 bg-card/85 p-4 text-card-foreground shadow-2xl backdrop-blur-xl transition-colors hover:border-primary focus-ring"
            >
              <div className="flex items-center gap-3">
                {active.image && (
                  <img src={active.image} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" loading="lazy" />
                )}
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">Proyecto destacado</p>
                  <p className="mt-1 truncate font-editorial text-lg font-medium text-foreground">{active.name}</p>
                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {[active.city, active.region].filter(Boolean).join(', ') || 'Chile'}
                  </p>
                </div>
              </div>
              <dl className="mt-3 flex justify-between gap-4 border-t border-border pt-3">
                <div><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Disponibles</dt><dd className="rural-data mt-1 text-sm font-semibold">{active.inventoryReady ? `${active.available}/${active.total}` : 'Consultar'}</dd></div>
                <div className="text-right"><dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Desde</dt><dd className="rural-data mt-1 text-sm font-semibold text-primary">{clp(active.minPrice)}</dd></div>
              </dl>
            </Link>
          )}
          {withImage.length > 1 && (
            <div className="flex max-w-[340px] flex-wrap justify-end gap-2" aria-label="Cambiar proyecto destacado">
              {withImage.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  aria-label={`Mostrar ${p.name}`}
                  aria-pressed={p.id === active?.id}
                  onClick={() => setIndex(i)}
                  className={`h-2.5 w-2.5 rounded-full border border-border transition-colors focus-ring ${p.id === active?.id ? 'bg-primary' : 'bg-card/80 hover:bg-primary/60'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CinematicShowcaseHero;
