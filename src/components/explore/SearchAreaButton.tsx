import { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
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

  useEffect(() => {
    if (!bounds || !lastSearchedBounds) {
      if (bounds) setVisible(true);
      return;
    }

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

  return (
    <AnimatePresence>
      {visible && bounds && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: -10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn('absolute top-3 left-1/2 -translate-x-1/2 z-20', className)}
        >
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            aria-busy={isSearching}
            size="sm"
            className={cn(
              'min-h-11 px-5 rounded-full shadow-md backdrop-blur-xl',
              'bg-primary/95 text-primary-foreground',
              'border border-primary/30 hover:bg-primary',
              'transition-all duration-300 gap-2 text-xs font-semibold',
              isSearching && 'opacity-80'
            )}
          >
            {isSearching ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Actualizando resultados…</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Buscar en esta área</span>
              </>
            )}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchAreaButton;
