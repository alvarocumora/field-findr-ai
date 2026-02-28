import { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface SearchAreaButtonProps {
  bounds?: MapBounds | null;
  onSearchArea: (bounds: MapBounds) => void;
  isSearching?: boolean;
  className?: string;
}

const SearchAreaButton = ({
  bounds,
  onSearchArea,
  isSearching = false,
  className,
}: SearchAreaButtonProps) => {
  const [visible, setVisible] = useState(false);
  const [lastSearchedBounds, setLastSearchedBounds] = useState<MapBounds | null>(null);

  // Show button when bounds change significantly
  useEffect(() => {
    if (!bounds || !lastSearchedBounds) {
      if (bounds) setVisible(true);
      return;
    }

    // Calculate if viewport has moved significantly (>20% of previous view)
    const latDiff = Math.abs(bounds.north - bounds.south);
    const lngDiff = Math.abs(bounds.east - bounds.west);
    const threshold = 0.2;

    const latMoved = Math.abs(bounds.north - lastSearchedBounds.north) > latDiff * threshold ||
                     Math.abs(bounds.south - lastSearchedBounds.south) > latDiff * threshold;
    const lngMoved = Math.abs(bounds.east - lastSearchedBounds.east) > lngDiff * threshold ||
                     Math.abs(bounds.west - lastSearchedBounds.west) > lngDiff * threshold;

    setVisible(latMoved || lngMoved);
  }, [bounds, lastSearchedBounds]);

  const handleSearch = () => {
    if (!bounds) return;
    onSearchArea(bounds);
    setLastSearchedBounds(bounds);
    setVisible(false);
  };

  if (!visible || !bounds) return null;

  return (
    <div className={cn('absolute top-3 left-1/2 -translate-x-1/2 z-30', className)}>
      <Button
        onClick={handleSearch}
        disabled={isSearching}
        size="sm"
        className={cn(
          'h-9 px-4 rounded-full shadow-lg',
          'bg-background/95 backdrop-blur-xl text-foreground',
          'border border-border/50 hover:bg-background hover:border-primary/50',
          'transition-all duration-300 gap-2 text-xs font-medium',
          isSearching && 'opacity-80'
        )}
      >
        {isSearching ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Buscando...</span>
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            <span>Buscar en esta área</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default SearchAreaButton;
