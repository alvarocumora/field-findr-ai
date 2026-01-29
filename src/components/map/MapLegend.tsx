import { cn } from '@/lib/utils';
import { Mountain, Layers } from 'lucide-react';

interface StatusConfig {
  color: string;
  label: string;
}

interface MapLegendProps {
  statusConfig?: Record<string, StatusConfig>;
  mapMode?: 'streets' | 'satellite' | '3d';
  activeLayersCount?: number;
  listingsCount?: number;
  className?: string;
  compact?: boolean;
}

const defaultStatusConfig: Record<string, StatusConfig> = {
  active: { color: '#10b981', label: 'Disponible' },
  reserved: { color: '#f59e0b', label: 'Reservado' },
  sold: { color: '#ef4444', label: 'Vendido' },
};

const MapLegend = ({
  statusConfig = defaultStatusConfig,
  mapMode,
  activeLayersCount = 0,
  listingsCount,
  className,
  compact = false,
}: MapLegendProps) => {
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-xl bg-background/90 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5',
          className
        )}
      >
        {Object.entries(statusConfig).map(([key, { color, label }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full ring-2 ring-white/20"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 p-4 rounded-xl bg-background/90 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5',
        className
      )}
    >
      {/* Status Legend */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Estado
        </h4>
        <div className="flex flex-wrap gap-3">
          {Object.entries(statusConfig).map(([key, { color, label }]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="relative">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-20"
                  style={{ backgroundColor: color }}
                />
              </div>
              <span className="text-xs text-foreground/80">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        {mapMode === '3d' && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mountain className="h-3 w-3 text-primary" />
            <span>Terreno 3D</span>
          </div>
        )}
        {activeLayersCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers className="h-3 w-3 text-primary" />
            <span>{activeLayersCount} capas</span>
          </div>
        )}
        {listingsCount !== undefined && (
          <div className="text-xs font-medium text-foreground">
            {listingsCount} propiedades
          </div>
        )}
      </div>
    </div>
  );
};

export default MapLegend;
