import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  TreePine, Factory, Wheat, Mountain, Building2, MapPin,
  Truck, Zap, Gem, TrendingUp,
} from 'lucide-react';

const CATEGORIES = [
  { type: 'parcela', label: 'Parcelas de Agrado', icon: TreePine, color: 'from-emerald-500/20 to-emerald-500/5' },
  { type: 'terreno_rural', label: 'Terrenos Rurales', icon: Mountain, color: 'from-amber-500/20 to-amber-500/5' },
  { type: 'campo', label: 'Campos Agrícolas', icon: Wheat, color: 'from-lime-500/20 to-lime-500/5' },
  { type: 'fundo', label: 'Fundos', icon: TreePine, color: 'from-green-600/20 to-green-600/5' },
  { type: 'industrial', label: 'Sitios Industriales', icon: Factory, color: 'from-slate-500/20 to-slate-500/5' },
  { type: 'urbano', label: 'Paños Urbanos', icon: Building2, color: 'from-blue-500/20 to-blue-500/5' },
  { type: 'logistico', label: 'Terrenos Logísticos', icon: Truck, color: 'from-orange-500/20 to-orange-500/5' },
  { type: 'energetico', label: 'Proyectos Energéticos', icon: Zap, color: 'from-yellow-500/20 to-yellow-500/5' },
  { type: 'minero', label: 'Potencial Minero', icon: Gem, color: 'from-purple-500/20 to-purple-500/5' },
  { type: 'inversion', label: 'Oportunidades', icon: TrendingUp, color: 'from-primary/20 to-primary/5' },
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
      data?.forEach(l => { map[l.type] = (map[l.type] || 0) + 1; });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="py-16 md:py-20">
      <div className="container px-4">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">
            Categorías especializadas
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Encuentra el terreno ideal por tipo de activo
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {CATEGORIES.map(cat => {
            const count = counts[cat.type] || 0;
            return (
              <Link
                key={cat.type}
                to={`/explorar?type=${cat.type}`}
                className="group relative p-4 md:p-5 rounded-2xl border border-border/40 bg-card/50 hover:border-primary/40 hover:shadow-lg transition-all duration-300"
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative flex flex-col items-center text-center gap-2.5">
                  <cat.icon className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs md:text-sm font-medium text-foreground leading-tight">
                    {cat.label}
                  </span>
                  {count > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {count} disponibles
                    </span>
                  )}
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
