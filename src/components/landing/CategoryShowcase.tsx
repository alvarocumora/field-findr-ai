import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  TreePine, Factory, Wheat, Mountain, Building2,
  Truck, Zap, Gem, TrendingUp, ArrowUpRight,
} from 'lucide-react';

type Cat = {
  type: string;
  label: string;
  icon: typeof TreePine;
  gradient: string;
  accent: string;
  tagline: string;
};

const FEATURED: Cat[] = [
  {
    type: 'parcela',
    label: 'Parcelas de Agrado',
    icon: TreePine,
    gradient: 'from-emerald-500/40 via-emerald-500/10 to-transparent',
    accent: 'text-emerald-400',
    tagline: 'DL 3.516 · desde 5.000 m² · rol SII propio',
  },
  {
    type: 'inversion',
    label: 'Oportunidades de Inversión',
    icon: TrendingUp,
    gradient: 'from-primary/40 via-primary/10 to-transparent',
    accent: 'text-primary',
    tagline: 'Análisis IA · ROI proyectado · deal-flow curado',
  },
];

const REST: Cat[] = [
  { type: 'terreno_rural', label: 'Terrenos Rurales', icon: Mountain, gradient: 'from-amber-500/30 to-transparent', accent: 'text-amber-400', tagline: '' },
  { type: 'campo', label: 'Campos Agrícolas', icon: Wheat, gradient: 'from-lime-500/30 to-transparent', accent: 'text-lime-400', tagline: '' },
  { type: 'fundo', label: 'Fundos', icon: TreePine, gradient: 'from-green-600/30 to-transparent', accent: 'text-green-400', tagline: '' },
  { type: 'industrial', label: 'Sitios Industriales', icon: Factory, gradient: 'from-slate-500/30 to-transparent', accent: 'text-slate-300', tagline: '' },
  { type: 'urbano', label: 'Paños Urbanos', icon: Building2, gradient: 'from-blue-500/30 to-transparent', accent: 'text-blue-400', tagline: '' },
  { type: 'logistico', label: 'Logísticos', icon: Truck, gradient: 'from-orange-500/30 to-transparent', accent: 'text-orange-400', tagline: '' },
  { type: 'energetico', label: 'Energéticos', icon: Zap, gradient: 'from-yellow-500/30 to-transparent', accent: 'text-yellow-400', tagline: '' },
  { type: 'minero', label: 'Potencial Minero', icon: Gem, gradient: 'from-purple-500/30 to-transparent', accent: 'text-purple-400', tagline: '' },
];

const CategoryShowcase = () => {
  const { data: counts = {} } = useQuery({
    queryKey: ['category-counts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('listings')
        .select('type')
        .eq('status', 'active');
      const map: Record<string, number> = {};
      data?.forEach((l) => { map[l.type] = (map[l.type] || 0) + 1; });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  const countLabel = (n: number) =>
    n > 0 ? `${n} disponibles` : 'Explorar catálogo';

  return (
    <section className="py-16 md:py-24">
      <div className="container px-4">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary mb-3">
            Categorías especializadas
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            El terreno ideal, por tipo de activo
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-xl mx-auto">
            De parcelas de agrado a proyectos energéticos: filtros específicos para cada tipo de suelo.
          </p>
        </div>

        {/* Featured — 2 big cards */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-5 mb-4 md:mb-5">
          {FEATURED.map((cat) => {
            const c = counts[cat.type] || 0;
            const Icon = cat.icon;
            return (
              <Link
                key={cat.type}
                to={`/explorar?type=${cat.type}`}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/70 p-8 min-h-[220px] flex flex-col justify-between transition-all duration-500 hover:border-primary/50 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="absolute -right-8 -bottom-8 opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500">
                  <Icon className={`h-40 w-40 ${cat.accent}`} strokeWidth={1} />
                </div>
                <div className="relative">
                  <Icon className={`h-8 w-8 ${cat.accent} mb-4`} />
                  <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground leading-tight">
                    {cat.label}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                    {cat.tagline}
                  </p>
                </div>
                <div className="relative flex items-center justify-between mt-6">
                  <span className={`text-xs font-mono uppercase tracking-[0.2em] ${cat.accent}`}>
                    {countLabel(c)}
                  </span>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Rest — compact 4×2 grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          {REST.map((cat) => {
            const c = counts[cat.type] || 0;
            const Icon = cat.icon;
            return (
              <Link
                key={cat.type}
                to={`/explorar?type=${cat.type}`}
                className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/50 p-5 min-h-[130px] flex flex-col justify-between transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative flex items-start justify-between">
                  <Icon className={`h-6 w-6 ${cat.accent} opacity-80 group-hover:opacity-100 transition-opacity`} />
                  {c > 0 && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {c}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="text-sm font-semibold text-foreground leading-tight block">
                    {cat.label}
                  </span>
                  <span className={`text-[10px] font-mono uppercase tracking-[0.15em] mt-1 block ${c > 0 ? cat.accent : 'text-muted-foreground/60'}`}>
                    {c > 0 ? 'Ver ahora' : 'Explorar'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;
