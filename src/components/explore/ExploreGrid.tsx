import { memo } from 'react';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import QuickPropertyCard from './QuickPropertyCard';
import { Listing } from '@/hooks/useListings';
import { cn } from '@/lib/utils';

interface ExploreGridProps {
  listings: Listing[];
  isLoading: boolean;
  hoveredListing: Listing | null;
  selectedListing: Listing | null;
  onHover: (listing: Listing | null) => void;
  onPreview: (listing: Listing) => void;
  className?: string;
}

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-border/30 overflow-hidden">
        <Skeleton className="aspect-[16/10] w-full" />
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
      <Search className="h-7 w-7 text-muted-foreground/50" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-1">No se encontraron terrenos</h3>
    <p className="text-sm text-muted-foreground max-w-sm">
      Intenta ajustar tus filtros o ampliar tu búsqueda para encontrar más resultados.
    </p>
  </div>
);

const ExploreGrid = memo(({
  listings,
  isLoading,
  hoveredListing,
  selectedListing,
  onHover,
  onPreview,
  className,
}: ExploreGridProps) => {
  if (isLoading) return <LoadingSkeleton />;
  if (listings.length === 0) return <EmptyState />;

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', className)}>
      {listings.map((listing, index) => (
        <div
          key={listing.id}
          className="animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${Math.min(index * 50, 400)}ms`, animationFillMode: 'both' }}
        >
          <QuickPropertyCard
            listing={listing}
            isHovered={hoveredListing?.id === listing.id}
            isSelected={selectedListing?.id === listing.id}
            onHover={onHover}
            onPreview={onPreview}
            layout="vertical"
          />
        </div>
      ))}
    </div>
  );
});

ExploreGrid.displayName = 'ExploreGrid';

export default ExploreGrid;
