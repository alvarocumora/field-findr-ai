import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Layers } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useIncludeLoteoLots } from '@/hooks/useIncludeLoteoLots';


interface ProjectRow {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  images: string[] | null;
  total_lots: number | null;
  available_lots: number | null;
}

/**
 * Horizontal rail of active projects (loteos) rendered above the explorer list.
 * Individual lots are hidden from the explorer feed — projects surface here as
 * a single card that links to the project detail page (master plan + lots).
 */
export default function ProjectsRail() {
  const navigate = useNavigate();
  const { include, setInclude } = useIncludeLoteoLots();

  const { data: projects = [] } = useQuery({
    queryKey: ['explorer-projects-rail'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id,name,city,region,images,total_lots,available_lots')
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as ProjectRow[];
    },
    staleTime: 60_000,
  });

  if (projects.length === 0) return null;

  return (
    <div className="border-b border-border/30 bg-background/60 px-3 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <Layers className="h-3.5 w-3.5" />
          Loteos y proyectos
        </div>
        <span className="text-[10px] text-muted-foreground/70">
          {projects.length} activo{projects.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {projects.map((p) => {
          const cover = p.images?.[0];
          return (
            <button
              key={p.id}
              onClick={() => navigate(`/proyecto/${p.id}`)}
              className="group flex-shrink-0 w-[220px] rounded-lg border border-border/40 bg-card hover:border-primary/60 hover:shadow-md transition-all text-left overflow-hidden"
            >
              <div className="relative h-[100px] bg-muted overflow-hidden">
                {cover ? (
                  <img
                    src={cover}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Layers className="h-8 w-8 opacity-40" />
                  </div>
                )}
                {typeof p.available_lots === 'number' && (
                  <span className="absolute top-1.5 right-1.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-medium px-2 py-0.5">
                    {p.available_lots} disponibles
                  </span>
                )}
              </div>
              <div className="p-2">
                <div className="text-sm font-semibold truncate">{p.name}</div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">
                    {[p.city, p.region].filter(Boolean).join(', ') || 'Sin ubicación'}
                  </span>
                </div>
                {typeof p.total_lots === 'number' && (
                  <div className="text-[10px] text-muted-foreground/80 mt-0.5">
                    {p.total_lots} lotes en total
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <label className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-card/50 px-3 py-2 cursor-pointer">
        <span className="text-[11px] leading-tight text-muted-foreground">
          Ver también <strong className="text-foreground font-medium">parcelas individuales</strong> de loteos en el listado
        </span>
        <Switch
          checked={include}
          onCheckedChange={setInclude}
          aria-label="Incluir parcelas individuales de loteos"
        />
      </label>
    </div>
  );
}
