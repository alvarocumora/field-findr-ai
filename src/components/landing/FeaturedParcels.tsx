import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { listingCoverUrl } from '@/lib/staticMapImage';
import { cn } from '@/lib/utils';

type Filter = 'recent' | 'cheap' | 'large';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'recent', label: 'Recién publicadas' },
  { id: 'cheap', label: 'Menos de $25M' },
  { id: 'large', label: '1 ha o más' },
];

const formatArea = (m2?: number | null) => {
  if (!m2) return null;
  return m2 >= 10000
    ? `${(m2 / 10000).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`
    : `${Math.round(m2).toLocaleString('es-CL')} m²`;
};

const FeaturedParcels = () => {
  const [filter, setFilter] = useState<Filter>('recent');
  const { token } = useMapboxToken();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['landing-featured-parcels', filter],
    queryFn: async () => {
      let q = supabase
        .from('listings')
        .select('id, title, price, area_m2, city, region, images, lat, lng')
        .eq('status', 'active')
        .gt('price', 0);
      if (filter === 'cheap') q = q.lt('price', 25000000).order('price', { ascending: true });
      else if (filter === 'large') q = q.gte('area_m2', 10000).order('price', { ascending: true });
      else q = q.order('created_at', { ascending: false });
      const { data, error } = await q.limit(8);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="border-t border-border/50 py-14 md:py-20" aria-labelledby="parcels-title">
      <div className="container px-4">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Parcelas destacadas</p>
            <h2 id="parcels-title" className="mt-3 font-heading text-3xl font-bold md:text-4xl">Terrenos listos para elegir.</h2>
          </div>
          <Button asChild variant="outline" className="hidden shrink-0 md:inline-flex">
            <Link to="/explorar">Ver todas <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar parcelas">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                filter === f.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
          {isLoading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 w-64 shrink-0 animate-pulse rounded-md bg-muted md:w-auto" />
          ))}
          {!isLoading && items.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay parcelas con este filtro por ahora.</p>
          )}
          {items.map((l) => {
            const cover = listingCoverUrl(l.images as string[] | null, l.lat, l.lng, token);
            const area = formatArea(l.area_m2);
            return (
              <Link
                key={l.id}
                to={`/propiedad/${l.id}`}
                className="group w-64 shrink-0 snap-start overflow-hidden rounded-md border border-border/60 bg-card transition-colors hover:border-primary/60 md:w-auto"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {cover ? (
                    <img src={cover} alt={l.title ?? 'Parcela'} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  ) : (
                    <div className="h-full w-full grid-topo" aria-hidden="true" />
                  )}
                  {area && (
                    <span className="absolute left-2 top-2 rounded bg-background/85 px-2 py-0.5 text-xs font-semibold text-foreground">{area}</span>
                  )}
                </div>
                <div className="p-3.5">
                  <p className="font-heading text-base font-bold text-foreground">${Number(l.price).toLocaleString('es-CL')}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-foreground/90">{l.title}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 text-primary" aria-hidden="true" />
                    {[l.city, l.region].filter(Boolean).join(', ') || 'Chile'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedParcels;
