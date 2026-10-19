import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Compass, MapPin, Orbit, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { projectImages } from '@/lib/projectCovers';

interface ShowcaseProject {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  image?: string;
  total: number;
  available: number;
  minPrice?: number;
}

const clp = (v?: number) => (v ? `$${v.toLocaleString('es-CL')}` : 'Consultar');

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
        const { data: lots } = await supabase.rpc('get_public_lots', { p_project_id: p.id });
        const list = (lots ?? []) as Array<{ price: number | null; status: string | null }>;
        const avail = list.filter((l) => l.status === 'available');
        const prices = avail.map((l) => Number(l.price)).filter((n) => Number.isFinite(n) && n > 0);
        return {
          id: p.id, name: p.name, city: p.city, region: p.region,
          image: projectImages(p)[0],
          total: list.length || Number(p.total_lots ?? 0),
          available: list.length ? avail.length : Number(p.available_lots ?? 0),
          minPrice: prices.length ? Math.min(...prices) : undefined,
        };
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

const CinematicShowcaseHero = () => {
  const reduced = useReducedMotion();
  const { data: projects = [] } = useShowcaseProjects();
  const withImage = projects.filter((p) => p.image);
  const [index, setIndex] = useState(0);
  const active = withImage[index % Math.max(withImage.length, 1)];

  useEffect(() => {
    if (reduced || withImage.length < 2) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % withImage.length), 7000);
    return () => window.clearInterval(t);
  }, [reduced, withImage.length]);

  return (
    <section className="relative isolate min-h-[88svh] overflow-hidden bg-background" aria-labelledby="hero-title">
      <AnimatePresence mode="sync">
        {active?.image && (
          <motion.img
            key={active.id}
            src={active.image}
            alt={`Vista aérea de ${active.name}`}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
            initial={reduced ? false : { opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/55 to-background/20" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background/90 via-background/30 to-transparent" />
      <div className="brand-aurora absolute inset-0 -z-10" aria-hidden="true" />

      <div className="container flex min-h-[88svh] flex-col justify-end px-4 pb-10 pt-24 md:pb-16">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <span className="brand-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]">
            <Orbit className="h-3.5 w-3.5" aria-hidden="true" /> Tour 360 · Masterplan · Reserva online
          </span>
          <h1 id="hero-title" className="mt-5 font-heading text-4xl font-bold leading-[0.95] text-foreground sm:text-6xl lg:text-7xl">
            El territorio chileno, <span className="gradient-text-hero">loteado con precisión.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-foreground/80 md:text-lg">
            Vuela sobre cada proyecto, elige tu parcela sobre la imagen real y resérvala con folio oficial.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="brand-gradient-btn h-12 rounded-full border-0 px-7 text-base font-semibold">
              <Link to={active ? `/proyecto/${active.id}?tab=tour360` : '/explorar'}>
                Entrar al tour 360 <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-border/60 bg-background/40 px-7 backdrop-blur-md">
              <Link to="/explorar"><Compass className="mr-2 h-4 w-4" />Ver mapa de parcelas</Link>
            </Button>
          </div>
        </motion.div>

        {withImage.length > 0 && (
          <div className="mt-10 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Proyectos insignia">
              {withImage.map((p, i) => {
                const on = p.id === active?.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setIndex(i)}
                    className={`group relative shrink-0 overflow-hidden rounded-2xl border text-left backdrop-blur-md transition-all ${on ? 'brand-ring w-64 border-transparent bg-background/70' : 'w-44 border-border/50 bg-background/40 hover:bg-background/60'}`}
                  >
                    <div className="p-3">
                      <p className="truncate font-heading text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />{[p.city, p.region].filter(Boolean).join(', ') || 'Chile'}
                      </p>
                    </div>
                    {on && <span className="brand-bar absolute inset-x-0 bottom-0 h-0.5" />}
                  </button>
                );
              })}
            </div>
            {active && (
              <dl className="flex gap-6 rounded-2xl border border-border/50 bg-background/55 px-5 py-3 backdrop-blur-md">
                <div><dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Disponibles</dt><dd className="font-heading text-xl font-bold text-foreground">{active.available} de {active.total}</dd></div>
                <div><dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Desde</dt><dd className="font-heading text-xl font-bold gradient-text">{clp(active.minPrice)}</dd></div>
                <div className="hidden sm:block"><dt className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Respaldo</dt><dd className="flex items-center gap-1 pt-1 text-sm font-medium text-foreground"><ShieldCheck className="h-4 w-4 text-primary" />Rol propio</dd></div>
              </dl>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default CinematicShowcaseHero;
