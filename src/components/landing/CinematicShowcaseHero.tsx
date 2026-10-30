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
            Una nueva forma de comprar tierra en Chile. Busca por ubicación y presupuesto, compara opciones y da el siguiente paso con el equipo del proyecto.
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

        <div className="relative min-w-0 overflow-hidden rounded-3xl bg-muted">
          <img src={landscape.url} alt="Paisaje rural de Licantén, Región del Maule" fetchPriority="high" className="h-64 w-full object-cover sm:h-96 lg:h-[560px]" />
          <div className="border-t bg-card p-5">
            <p className="font-editorial text-2xl">Imagina tu vida con más espacio.</p>
            <p className="mt-2 text-sm text-muted-foreground">Descubre ubicaciones, compara parcelas y encuentra tu próximo destino.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CinematicShowcaseHero;
