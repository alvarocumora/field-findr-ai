import { Card } from '@/components/ui/card';
import { Ruler, MapPin, Mountain, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapStatusBadgeProps {
  listingsCount: number;
  drawnArea?: number | null;
  mapMode?: 'streets' | 'satellite' | '3d';
  activeLayersCount?: number;
  className?: string;
}

const MapStatusBadge = ({
  listingsCount,
  drawnArea,
  mapMode,
  activeLayersCount = 0,
  className,
}: MapStatusBadgeProps) => {
  return (
    <Card
      className={cn(
        'px-4 py-2.5 bg-background/90 backdrop-blur-xl border border-border/50 shadow-lg shadow-black/5',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Listings Count */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <MapPin className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{listingsCount}</span>
            <span className="text-[10px] text-muted-foreground leading-none">propiedades</span>
          </div>
        </div>

        {/* Drawn Area */}
        {drawnArea !== null && drawnArea !== undefined && (
          <>
            <div className="w-px h-8 bg-border/50" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-accent/10">
                <Ruler className="h-3.5 w-3.5 text-accent-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-primary">
                  {drawnArea >= 10000
                    ? `${(drawnArea / 10000).toFixed(2)} ha`
                    : `${drawnArea.toFixed(0)} m²`}
                </span>
                <span className="text-[10px] text-muted-foreground leading-none">área dibujada</span>
              </div>
            </div>
          </>
        )}

        {/* Map Mode Indicator */}
        {mapMode === '3d' && (
          <>
            <div className="w-px h-8 bg-border/50" />
            <div className="flex items-center gap-1.5">
              <Mountain className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">3D</span>
            </div>
          </>
        )}

        {/* Active Layers */}
        {activeLayersCount > 0 && (
          <>
            <div className="w-px h-8 bg-border/50" />
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                {activeLayersCount} capas
              </span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default MapStatusBadge;
