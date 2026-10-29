import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PropertyCard from './PropertyCard';
import { Grid, List } from 'lucide-react';

interface PropertyGridProps {
  properties: (ComponentProps<typeof PropertyCard>['property'] & { daysPosted: number })[];
  loading?: boolean;
}

const PropertyGrid = ({ properties, loading = false }: PropertyGridProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('featured');

  const sortOptions = [
    { value: 'featured', label: 'Destacadas' },
    { value: 'price-low', label: 'Menor precio' },
    { value: 'price-high', label: 'Mayor precio' },
    { value: 'newest', label: 'Más recientes' },
  ];

  const getSortedProperties = () => {
    const sorted = [...properties];
    
    switch (sortBy) {
      case 'featured':
        return sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      case 'price-low':
        return sorted.sort((a, b) => parseFloat(a.price.replace(/[^\d]/g, '')) - parseFloat(b.price.replace(/[^\d]/g, '')));
      case 'price-high':
        return sorted.sort((a, b) => parseFloat(b.price.replace(/[^\d]/g, '')) - parseFloat(a.price.replace(/[^\d]/g, '')));
      case 'newest':
        return sorted.sort((a, b) => a.daysPosted - b.daysPosted);
      default:
        return sorted;
    }
  };

  const sortedProperties = getSortedProperties();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-80 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {properties.length} propiedades
        </p>

        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-none h-9 w-9 p-0"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none h-9 w-9 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Property Cards */}
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
          : 'space-y-4'
      }>
        {sortedProperties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            variant={viewMode === 'list' ? 'compact' : 'default'}
          />
        ))}
      </div>

      {/* Load More */}
      {properties.length > 0 && (
        <div className="text-center pt-4">
          <Button variant="outline">
            Cargar más
          </Button>
        </div>
      )}

      {/* Empty State */}
      {properties.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron propiedades</p>
        </div>
      )}
    </div>
  );
};

export default PropertyGrid;
