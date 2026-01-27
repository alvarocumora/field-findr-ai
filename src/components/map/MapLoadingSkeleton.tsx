import { Skeleton } from '@/components/ui/skeleton';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapLoadingSkeletonProps {
  className?: string;
}

const MapLoadingSkeleton = ({ className }: MapLoadingSkeletonProps) => {
  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      <Skeleton className="w-full h-full" />
      
      {/* Animated loading indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Cargando mapa...
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapLoadingSkeleton;
