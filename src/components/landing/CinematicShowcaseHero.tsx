import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { projectImages } from '@/lib/projectCovers';
import landscape from '@/assets/valle-escondido-licanten/drone/vel-dron-2.jpg.asset.json';

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

const CinematicShowcaseHero = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: projects = [], isError, isLoading, refetch, isFetching } = useShowcaseProjects();
  const active = projects.find((project) => project.id === selectedId) ?? projects[0];
  const projectHref = active ? (active.slug ? `/p/${encodeURIComponent(active.slug)}` : `/proyecto/${encodeURIComponent(active.id)}`) : null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (type) params.set('type', type);
    if (budget) { params.set('currency', 'CLP'); params.set('clpMax', budget); }
    navigate(`/explorar${params.size ? `?${params}` : ''}`);
  };

  return (
    <section className="bg-background py-8 sm:py-12 lg:py-16" aria-labelledby="hero-title">
      <div className="container grid gap-6 px-4 lg:grid-cols-2 lg:items-center lg:gap-10">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Parcelas y loteos en venta</p>
          <h1 id="hero-title" className="mt-3 max-w-xl font-editorial text-4xl font-medium leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
            Tu próxima parcela <span className="text-primary">está aquí.</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
            Elige dónde comprar, descubre proyectos y encuentra una parcela para vivir, descansar o invertir.
          </p>

          <form onSubmit={submit} role="search" aria-label="Buscar terrenos en venta" className="mt-6 space-y-4 rounded-2xl border bg-card p-4 rural-shadow sm:p-5">
            <div>
              <label htmlFor="hero-search" className="mb-2 block text-sm font-medium">¿Dónde quieres comprar?</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="hero-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Comuna, región o proyecto" className="h-12 rounded-lg bg-background pl-10 text-base" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <label htmlFor="hero-type" className="mb-2 block text-sm font-medium">Tipo de terreno</label>
                <select id="hero-type" value={type} onChange={(event) => setType(event.target.value)} className="h-12 w-full min-w-0 rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Todos</option>
                  {QUICK_FILTERS.map((filter) => <option key={filter.type} value={filter.type}>{filter.label}</option>)}
                </select>
              </div>
              <div className="min-w-0">
                <label htmlFor="hero-budget" className="mb-2 block text-sm font-medium">Presupuesto CLP</label>
                <select id="hero-budget" value={budget} onChange={(event) => setBudget(event.target.value)} className="h-12 w-full min-w-0 rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Sin límite</option>
                  <option value="20000000">Hasta $20 millones</option>
                  <option value="40000000">Hasta $40 millones</option>
                  <option value="80000000">Hasta $80 millones</option>
                  <option value="150000000">Hasta $150 millones</option>
                </select>
              </div>
            </div>
            <Button type="submit" size="lg" className="h-12 w-full rounded-lg text-base"><Search className="mr-2 h-4 w-4" aria-hidden="true" />Buscar parcelas y terrenos</Button>
          </form>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <a href="#proyectos-en-venta" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline focus-ring">Ver proyectos en venta<ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
            <Link to="/planes-loteos" className="inline-flex min-h-11 items-center gap-1 text-muted-foreground underline-offset-4 hover:underline focus-ring"><Building2 className="h-4 w-4" aria-hidden="true" />Quiero vender un terreno</Link>
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="relative overflow-hidden rounded-2xl border bg-muted">
            {active && !active.image ? <div className="grid h-56 place-items-center bg-muted p-6 text-center text-muted-foreground sm:h-80 lg:h-[440px]">Imágenes del proyecto por confirmar</div> : <img src={active?.image || landscape.url} alt={active ? `Vista de ${active.name}` : 'Paisaje de Valle Escondido, Licantén'} fetchPriority="high" className="h-56 w-full object-cover sm:h-80 lg:h-[440px]" />}
            <p className="absolute left-4 top-4 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-foreground">{active ? 'Proyecto en venta' : 'Descubre parcelas en Chile'}</p>
            {active && projectHref ? (
              <div className="border-t bg-card p-4 sm:p-5">
                <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" aria-hidden="true" />{[active.city, active.region].filter(Boolean).join(', ') || 'Chile'}</p>
                <h2 className="mt-1 font-editorial text-2xl font-medium">{active.name}</h2>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                  <div><p className="text-xs text-muted-foreground">{active.minPrice ? 'Parcelas desde' : 'Precio'}</p><p className="text-xl font-semibold text-primary">{clp(active.minPrice)}</p><p className="mt-1 text-xs text-muted-foreground">{active.inventoryReady ? `${active.available} lotes disponibles` : 'Consulta disponibilidad'}</p></div>
                  <Button asChild className="min-h-11"><Link to={projectHref}>Ver parcelas y precios<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button>
                </div>
              </div>
            ) : <p className="bg-card px-4 py-3 text-sm text-muted-foreground">Valle Escondido · Licantén. Revisa los proyectos y sus opciones de compra.</p>}
          </div>
          {projects.length > 1 && <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Elegir proyecto en venta">
            {projects.map((project) => <button key={project.id} type="button" aria-pressed={active?.id === project.id} onClick={() => setSelectedId(project.id)} className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm focus-ring ${active?.id === project.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-foreground hover:border-primary'}`}>{project.name}</button>)}
          </div>}
          {isLoading && <p role="status" className="text-sm text-muted-foreground">Cargando precios y proyectos…</p>}
          {isError && <div role="alert" className="space-y-2 text-sm"><p>No pudimos cargar los proyectos. Puedes seguir buscando terrenos.</p><Button type="button" variant="outline" size="sm" disabled={isFetching} onClick={() => void refetch()}>Reintentar proyectos</Button></div>}
        </div>
      </div>
    </section>
  );
};

export default CinematicShowcaseHero;
