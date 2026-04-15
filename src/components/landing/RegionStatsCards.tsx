import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, TrendingUp, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const formatPrice = (price: number) => {
  if (price >= 1_000_000_000) return `$${(price / 1_000_000_000).toFixed(1)}B`;
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(0)}M`;
  return `$${price.toLocaleString('es-CL')}`;
};

interface RegionStat {
  region: string;
  count: number;
  avgPrice: number;
  minPrice: number;
}

const RegionStatsCards = () => {
  const { data: regions = [] } = useQuery<RegionStat[]>({
    queryKey: ['region-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('listings')
        .select('region, price')
        .eq('status', 'active')
        .not('region', 'is', null);

      if (!data || data.length === 0) return [];

      const map: Record<string, { count: number; totalPrice: number; minPrice: number }> = {};
      data.forEach(l => {
        const r = l.region || 'Otra';
        if (!map[r]) map[r] = { count: 0, totalPrice: 0, minPrice: Infinity };
        map[r].count++;
        map[r].totalPrice += l.price;
        map[r].minPrice = Math.min(map[r].minPrice, l.price);
      });

      return Object.entries(map)
        .map(([region, stats]) => ({
          region,
          count: stats.count,
          avgPrice: Math.round(stats.totalPrice / stats.count),
          minPrice: stats.minPrice,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
    },
    staleTime: 5 * 60 * 1000,
  });

  if (regions.length === 0) return null;

  return (
    <section className="py-16 md:py-20 border-t border-border/20">
      <div className="container px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
              Mercado por región
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Explora oportunidades en todo Chile
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {regions.map(r => (
            <Link
              key={r.region}
              to={`/explorar?region=${encodeURIComponent(r.region)}`}
              className="group p-4 rounded-2xl border border-border/40 bg-card/50 hover:border-primary/40 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground truncate">
                  {r.region}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Propiedades</span>
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {r.count}
                  </Badge>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground">Desde</span>
                  <p className="text-sm font-bold text-primary">
                    {formatPrice(r.minPrice)}
                  </p>
                </div>
              </div>
              <span className="mt-3 text-[10px] font-medium text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Explorar <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RegionStatsCards;
