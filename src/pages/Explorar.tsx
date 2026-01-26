import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import ListingCard from '@/components/listings/ListingCard';
import ExploreMap from '@/components/map/ExploreMap';
import { useListings, Listing, getListingTypeLabel, formatPrice } from '@/hooks/useListings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Grid3X3, 
  Map as MapIcon,
  X,
  LayoutGrid
} from 'lucide-react';

const PROPERTY_TYPES = [
  { value: 'parcela_rural', label: 'Parcela Rural' },
  { value: 'sitio_industrial', label: 'Sitio Industrial' },
  { value: 'campo_agricola', label: 'Campo Agrícola' },
  { value: 'terreno_urbano', label: 'Terreno Urbano' },
  { value: 'terreno_costero', label: 'Terreno Costero' },
  { value: 'terreno_montana', label: 'Terreno de Montaña' },
  { value: 'inversion', label: 'Inversión' },
];

const REGIONS = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana', "O'Higgins", 'Maule', 'Ñuble', 'Biobío',
  'Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'
];

const TAGS = [
  { value: 'agua', label: 'Agua' },
  { value: 'luz', label: 'Luz' },
  { value: 'camino', label: 'Camino' },
  { value: 'riego', label: 'Riego' },
  { value: 'bosque', label: 'Bosque' },
  { value: 'lago', label: 'Lago' },
  { value: 'playa', label: 'Playa' },
];

const Explorar = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<'grid' | 'map' | 'split'>('split');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevancia');
  const [hoveredListing, setHoveredListing] = useState<Listing | null>(null);
  
  // Filters state
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000000]);
  const [areaRange, setAreaRange] = useState<[number, number]>([0, 1000000]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const { data: listings = [], isLoading } = useListings({
    type: selectedTypes.length > 0 ? selectedTypes : undefined,
    region: selectedRegions.length > 0 ? selectedRegions : undefined,
    priceMin: priceRange[0] > 0 ? priceRange[0] : undefined,
    priceMax: priceRange[1] < 5000000000 ? priceRange[1] : undefined,
    areaMin: areaRange[0] > 0 ? areaRange[0] : undefined,
    areaMax: areaRange[1] < 1000000 ? areaRange[1] : undefined,
  });

  // Filter by search query and tags locally
  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        l => l.title.toLowerCase().includes(query) ||
             l.location.toLowerCase().includes(query) ||
             l.region?.toLowerCase().includes(query) ||
             l.city?.toLowerCase().includes(query)
      );
    }

    // Tags filter
    if (selectedTags.length > 0) {
      result = result.filter(l => 
        selectedTags.some(tag => l.tags.includes(tag))
      );
    }

    // Sort
    switch (sortBy) {
      case 'precio_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'precio_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'area_desc':
        result.sort((a, b) => (b.area_m2 || 0) - (a.area_m2 || 0));
        break;
      case 'recientes':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        // relevancia - featured first
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, [listings, searchQuery, selectedTags, sortBy]);

  const activeFiltersCount = selectedTypes.length + selectedRegions.length + selectedTags.length +
    (priceRange[0] > 0 || priceRange[1] < 5000000000 ? 1 : 0) +
    (areaRange[0] > 0 || areaRange[1] < 1000000 ? 1 : 0);

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedRegions([]);
    setSelectedTags([]);
    setPriceRange([0, 5000000000]);
    setAreaRange([0, 1000000]);
    setSearchQuery('');
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleRegion = (region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const FiltersPanel = () => (
    <div className="space-y-6">
      {/* Property Types */}
      <div>
        <h4 className="font-medium text-foreground mb-3">Tipo de Terreno</h4>
        <div className="space-y-2">
          {PROPERTY_TYPES.map(type => (
            <label key={type.value} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedTypes.includes(type.value)}
                onCheckedChange={() => toggleType(type.value)}
              />
              <span className="text-sm text-muted-foreground">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Regions */}
      <div>
        <h4 className="font-medium text-foreground mb-3">Región</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {REGIONS.map(region => (
            <label key={region} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedRegions.includes(region)}
                onCheckedChange={() => toggleRegion(region)}
              />
              <span className="text-sm text-muted-foreground">{region}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-medium text-foreground mb-3">Precio (CLP)</h4>
        <div className="space-y-4">
          <Slider
            value={[Math.log10(priceRange[0] + 1), Math.log10(priceRange[1])]}
            min={0}
            max={10}
            step={0.1}
            onValueChange={([min, max]) => {
              setPriceRange([
                Math.round(Math.pow(10, min) - 1),
                Math.round(Math.pow(10, max))
              ]);
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
        </div>
      </div>

      {/* Area Range */}
      <div>
        <h4 className="font-medium text-foreground mb-3">Superficie (m²)</h4>
        <div className="space-y-4">
          <Slider
            value={[Math.log10(areaRange[0] + 1), Math.log10(areaRange[1])]}
            min={0}
            max={6}
            step={0.1}
            onValueChange={([min, max]) => {
              setAreaRange([
                Math.round(Math.pow(10, min) - 1),
                Math.round(Math.pow(10, max))
              ]);
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{areaRange[0].toLocaleString()} m²</span>
            <span>{areaRange[1].toLocaleString()} m²</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <h4 className="font-medium text-foreground mb-3">Características</h4>
        <div className="flex flex-wrap gap-2">
          {TAGS.map(tag => (
            <Badge
              key={tag.value}
              variant={selectedTags.includes(tag.value) ? 'default' : 'outline'}
              className="cursor-pointer transition-colors"
              onClick={() => toggleTag(tag.value)}
            >
              {tag.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button variant="ghost" onClick={clearFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Limpiar filtros ({activeFiltersCount})
        </Button>
      )}
    </div>
  );

  return (
    <PublicLayout showFooter={false}>
      <div className="min-h-screen">
        {/* Search Header */}
        <div className="sticky top-16 z-30 glass border-b border-white/10">
          <div className="container px-4 py-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ubicación, tipo o palabra clave..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass border-white/10"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {/* Mobile Filters */}
                <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden glass border-white/10">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filtros
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 glass">
                    <SheetHeader>
                      <SheetTitle>Filtros</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)]">
                      <FiltersPanel />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] glass border-white/10">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevancia">Relevancia</SelectItem>
                    <SelectItem value="precio_asc">Menor precio</SelectItem>
                    <SelectItem value="precio_desc">Mayor precio</SelectItem>
                    <SelectItem value="area_desc">Mayor superficie</SelectItem>
                    <SelectItem value="recientes">Más recientes</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="hidden md:flex items-center border border-white/10 rounded-lg p-1 glass">
                  <Button
                    variant={view === 'split' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setView('split')}
                    title="Vista dividida"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={view === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setView('grid')}
                    title="Solo grilla"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={view === 'map' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setView('map')}
                    title="Solo mapa"
                  >
                    <MapIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters Pills */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {selectedTypes.map(type => (
                  <Badge 
                    key={type} 
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => toggleType(type)}
                  >
                    {getListingTypeLabel(type)}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
                {selectedRegions.map(region => (
                  <Badge 
                    key={region} 
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => toggleRegion(region)}
                  >
                    {region}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
                {selectedTags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0 border-r border-white/10 p-6 h-[calc(100vh-132px)] overflow-y-auto sticky top-[132px]">
            <FiltersPanel />
          </aside>

          {/* Results */}
          <div className="flex-1 flex">
            {/* Grid Panel - shown in grid and split views */}
            {(view === 'grid' || view === 'split') && (
              <div className={`${view === 'split' ? 'w-1/2 border-r border-white/10' : 'w-full'} h-[calc(100vh-132px)] overflow-y-auto`}>
                <div className="p-6">
                  {/* Results Count */}
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-muted-foreground">
                      {isLoading ? (
                        <Skeleton className="h-5 w-32" />
                      ) : (
                        <>{filteredListings.length} propiedades encontradas</>
                      )}
                    </p>
                  </div>

                  {/* Grid */}
                  {isLoading ? (
                    <div className={`grid gap-4 ${view === 'split' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-3">
                          <Skeleton className="aspect-[4/3] rounded-lg" />
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : filteredListings.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="glass rounded-2xl p-8 max-w-md mx-auto">
                        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          No se encontraron propiedades
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Intenta ajustar tus filtros o buscar en otra ubicación.
                        </p>
                        <Button onClick={clearFilters} variant="outline">
                          Limpiar filtros
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={`grid gap-4 ${view === 'split' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
                      {filteredListings.map(listing => (
                        <ListingCard 
                          key={listing.id} 
                          listing={listing}
                          onHover={setHoveredListing}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Map Panel - shown in map and split views */}
            {(view === 'map' || view === 'split') && (
              <div className={`${view === 'split' ? 'w-1/2' : 'w-full'} h-[calc(100vh-132px)] relative`}>
                <ExploreMap 
                  listings={filteredListings}
                  hoveredListing={hoveredListing}
                  onListingHover={setHoveredListing}
                  onListingClick={(listing) => navigate(`/propiedad/${listing.id}`)}
                  className="w-full h-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Explorar;
