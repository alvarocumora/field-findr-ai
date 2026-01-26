import { Listing } from '@/hooks/useListings';
import ListingCard from './ListingCard';
import { Skeleton } from '@/components/ui/skeleton';

interface ListingGridProps {
  listings: Listing[];
  isLoading?: boolean;
  onHoverListing?: (listing: Listing | null) => void;
  emptyMessage?: string;
}

const ListingGrid = ({ 
  listings, 
  isLoading, 
  onHoverListing,
  emptyMessage = 'No se encontraron propiedades'
}: ListingGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/3] rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="glass rounded-2xl p-8 max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {emptyMessage}
          </h3>
          <p className="text-muted-foreground text-sm">
            Intenta ajustar tus filtros o buscar en otra ubicación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {listings.map((listing) => (
        <ListingCard 
          key={listing.id} 
          listing={listing} 
          onHover={onHoverListing}
        />
      ))}
    </div>
  );
};

export default ListingGrid;
