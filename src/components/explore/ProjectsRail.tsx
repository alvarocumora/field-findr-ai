import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Layers, Map as MapIcon, ArrowRight } from 'lucide-react';
import { formatPriceShort } from '@/hooks/useListings';
import { Switch } from '@/components/ui/switch';
import { useIncludeLoteoLots } from '@/hooks/useIncludeLoteoLots';
import { projectImages } from '@/lib/projectCovers';


interface ProjectRow {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  images: string[] | null;
  total_lots: number | null;
  available_lots: number | null;
  total_area: number | null;
}

interface LotStat { minPrice: number | null; minArea: number | null; maxArea: number | null; }

const fmtSurface = (m2: number) =>
  m2 >= 10000 ? `${(m2 / 10000).toLocaleString('es-CL', { maximumFractionDigits: 2 })} ha` : `${Math.round(m2).toLocaleString('es-CL')} m²`;

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
        .select('id,name,city,region,images,total_lots,available_lots,total_area')
        .eq('status', 'active')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as ProjectRow[];
    },
    staleTime: 60_000,
  });

  const ids = projects.map((p) => p.id);
  const { data: stats = {} } = useQuery({
    queryKey: ['explorer-projects-rail-stats', ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      // Use the same public, PII-free inventory contract as ProjectDetail.
      // Direct lots reads are not granted to anonymous visitors.
      const inventories = await Promise.all(ids.map(async (projectId) => {
        const { data, error } = await supabase.rpc('get_public_lots', { p_project_id: projectId });
        if (error) throw error;
        return (data ?? []).map(lot => ({ ...lot, project_id: projectId }));
      }));
      const out: Record<string, LotStat> = {};
      for (const l of inventories.flat()) {
        const s = (out[l.project_id] ??= { minPrice: null, minArea: null, maxArea: null });
        if (l.status === 'available' && l.price != null && l.price > 0) s.minPrice = s.minPrice == null ? l.price : Math.min(s.minPrice, l.price);
        if (l.area > 0) {
          s.minArea = s.minArea == null ? l.area : Math.min(s.minArea, l.area);
          s.maxArea = s.maxArea == null ? l.area : Math.max(s.maxArea, l.area);
        }
      }
      return out;
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
          const cover = projectImages(p)[0];
          const st = (stats as Record<string, LotStat>)[p.id];
          const avail = p.available_lots ?? 0;
          const total = p.total_lots ?? 0;
          const pct = total > 0 ? Math.round((avail / total) * 100) : 0;
          const low = avail > 0 && avail < 5;
          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/proyecto/${p.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/proyecto/${p.id}`)}
              className="group flex-shrink-0 w-[240px] cursor-pointer rounded-lg border border-border/40 bg-card hover:border-primary/60 hover:shadow-md transition-all text-left overflow-hidden"
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
                  <span className={`absolute top-1.5 right-1.5 rounded-full text-[10px] font-medium px-2 py-0.5 ${avail === 0 ? 'bg-muted text-muted-foreground' : low ? 'bg-amber-500/90 text-background' : 'bg-emerald-500/90 text-background'}`}>
                    {avail === 0 ? 'Agotado' : low ? `Últimas ${avail}` : `${avail} disponibles`}
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
                {st?.minPrice != null && (
                  <div className="mt-1 text-sm font-bold text-primary">Desde {formatPriceShort(st.minPrice)}</div>
                )}
                {st?.minArea != null && st.maxArea != null && (
                  <div className="text-[10px] text-muted-foreground">
                    Parcelas de {fmtSurface(st.minArea)}{st.maxArea > st.minArea ? ` a ${fmtSurface(st.maxArea)}` : ''}
                  </div>
                )}
                {total > 0 && (
                  <div className="mt-1.5">
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div className={`h-full ${low ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground/80">{avail} de {total} disponibles</div>
                  </div>
                )}
                <div className="mt-2 flex gap-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/proyecto/${p.id}/experiencia`); }}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-border/60 px-2 py-1 text-[11px] font-medium hover:border-primary/60"
                  >
                    <MapIcon className="h-3 w-3" /> Masterplan
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/proyecto/${p.id}`); }}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground"
                  >
                    Ver parcelas <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
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
