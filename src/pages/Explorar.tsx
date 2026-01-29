import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import ListingCard from '@/components/listings/ListingCard';
import EnhancedMap from '@/components/map/EnhancedMap';
import { useListings, Listing, getListingTypeLabel, formatPrice } from '@/hooks/useListings';
import { useMatchScore } from '@/hooks/useMatchScore';
import MatchScoreBadge from '@/components/matching/MatchScoreBadge';
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

  // Match scoring
  const { getMatchForListing, sortedByMatch } = useMatchScore(listings);

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
      case 'match':
        // Sort by match score
        result.sort((a, b) => {
          const matchA = getMatchForListing(a.id);
          const matchB = getMatchForListing(b.id);
          return (matchB?.score || 0) - (matchA?.score || 0);
        });
        break;
      default:
        // relevancia - featured first
        result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, [listings, searchQuery, selectedTags, sortBy, getMatchForListing]);

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
    <div className="space-y-8">
      {/* Property Types */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
          Tipo de Terreno
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {PROPERTY_TYPES.map(type => (
            <label 
              key={type.value} 
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                selectedTypes.includes(type.value) 
                  ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/20' 
                  : 'bg-muted/30 border-transparent hover:bg-muted/50'
              }`}
            >
              <Checkbox
                checked={selectedTypes.includes(type.value)}
                onCheckedChange={() => toggleType(type.value)}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className={`text-sm ${selectedTypes.includes(type.value) ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {type.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Regions */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent"></span>
          Región
        </h4>
        <div className="grid grid-cols-1 gap-1.5 max-h-56 overflow-y-auto pr-2 scrollbar-thin">
          {REGIONS.map(region => (
            <label 
              key={region} 
              className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                selectedRegions.includes(region) 
                  ? 'bg-accent/10 text-foreground' 
                  : 'hover:bg-muted/50 text-muted-foreground'
              }`}
            >
              <Checkbox
                checked={selectedRegions.includes(region)}
                onCheckedChange={() => toggleRegion(region)}
                className="h-4 w-4"
              />
              <span className="text-sm">{region}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          Precio (CLP)
        </h4>
        <div className="px-2 pt-2">
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
            className="py-4"
          />
          <div className="flex justify-between mt-2">
            <div className="px-3 py-1.5 rounded-lg bg-muted/50 text-xs font-medium text-foreground">
              {formatPrice(priceRange[0])}
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-muted/50 text-xs font-medium text-foreground">
              {formatPrice(priceRange[1])}
            </div>
          </div>
        </div>
      </div>

      {/* Area Range */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
          Superficie (m²)
        </h4>
        <div className="px-2 pt-2">
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
            className="py-4"
          />
          <div className="flex justify-between mt-2">
            <div className="px-3 py-1.5 rounded-lg bg-muted/50 text-xs font-medium text-foreground">
              {areaRange[0].toLocaleString()} m²
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-muted/50 text-xs font-medium text-foreground">
              {areaRange[1].toLocaleString()} m²
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500"></span>
          Características
        </h4>
        <div className="flex flex-wrap gap-2">
          {TAGS.map(tag => (
            <Badge
              key={tag.value}
              variant={selectedTags.includes(tag.value) ? 'default' : 'outline'}
              className={`cursor-pointer transition-all text-sm py-1.5 px-3 ${
                selectedTags.includes(tag.value) 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm' 
                  : 'hover:bg-muted border-border/50'
              }`}
              onClick={() => toggleTag(tag.value)}
            >
              {tag.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {activeFiltersCount > 0 && (
        <Button 
          variant="outline" 
          onClick={clearFilters} 
          className="w-full h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-4 w-4 mr-2" />
          Limpiar {activeFiltersCount} filtros
        </Button>
      )}
    </div>
  );

  return (
    <PublicLayout showFooter={false}>
      <div className="min-h-screen bg-background">
        {/* Search Header - Modern design */}
        <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30 shadow-sm">
          <div className="container px-4 py-3 md:py-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Input - Enhanced */}
              <div className="relative flex-1 group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/10 group-focus-within:bg-primary/20 transition-colors">
                  <Search className="h-4 w-4 text-primary" />
                </div>
                <Input
                  placeholder="Buscar ubicación, tipo de terreno..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 md:h-11 bg-muted/50 border-border/30 text-base rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                {/* Mobile Filters */}
                <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="lg:hidden h-12 md:h-11 px-4 rounded-xl border-border/30 bg-muted/50 hover:bg-muted touch-target flex-shrink-0 gap-2"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      <span>Filtros</span>
                      {activeFiltersCount > 0 && (
                        <Badge className="ml-1 bg-primary text-primary-foreground h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[90vw] max-w-[340px] bg-background/95 backdrop-blur-xl p-0 border-r border-border/30">
                    <SheetHeader className="p-5 border-b border-border/30 bg-muted/30">
                      <SheetTitle className="text-lg">Filtros de búsqueda</SheetTitle>
                    </SheetHeader>
                    <div className="p-5 overflow-y-auto max-h-[calc(100vh-80px)]">
                      <FiltersPanel />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort - Enhanced */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[150px] md:w-[170px] h-12 md:h-11 rounded-xl border-border/30 bg-muted/50 hover:bg-muted flex-shrink-0">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevancia">Relevancia</SelectItem>
                    <SelectItem value="match">Mejor Match</SelectItem>
                    <SelectItem value="precio_asc">Menor precio</SelectItem>
                    <SelectItem value="precio_desc">Mayor precio</SelectItem>
                    <SelectItem value="area_desc">Mayor superficie</SelectItem>
                    <SelectItem value="recientes">Más recientes</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle - Enhanced design */}
                <div className="hidden md:flex items-center rounded-xl p-1 bg-muted/50 border border-border/30 flex-shrink-0">
                  <Button
                    variant={view === 'split' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setView('split')}
                    title="Vista dividida"
                    className={`h-9 w-9 p-0 rounded-lg transition-all ${view === 'split' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={view === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setView('grid')}
                    title="Solo listado"
                    className={`h-9 w-9 p-0 rounded-lg transition-all ${view === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={view === 'map' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setView('map')}
                    title="Solo mapa"
                    className={`h-9 w-9 p-0 rounded-lg transition-all ${view === 'map' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}`}
                  >
                    <MapIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters Pills - Enhanced */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                {selectedTypes.map(type => (
                  <Badge 
                    key={type} 
                    variant="secondary" 
                    className="cursor-pointer bg-primary/10 text-primary border border-primary/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all flex-shrink-0 gap-1 pr-1.5"
                    onClick={() => toggleType(type)}
                  >
                    {getListingTypeLabel(type)}
                    <span className="ml-1 p-0.5 rounded-full hover:bg-destructive/20">
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))}
                {selectedRegions.map(region => (
                  <Badge 
                    key={region} 
                    variant="secondary" 
                    className="cursor-pointer bg-accent/10 text-accent-foreground border border-accent/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all flex-shrink-0 gap-1 pr-1.5"
                    onClick={() => toggleRegion(region)}
                  >
                    <MapPin className="h-3 w-3" />
                    {region}
                    <span className="ml-1 p-0.5 rounded-full hover:bg-destructive/20">
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))}
                {selectedTags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="cursor-pointer bg-muted text-muted-foreground border border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all flex-shrink-0 gap-1 pr-1.5"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    <span className="ml-1 p-0.5 rounded-full hover:bg-destructive/20">
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-destructive/80 hover:text-destructive hover:bg-destructive/10 h-7 px-3 rounded-full flex-shrink-0 text-xs font-medium"
                >
                  Limpiar todo
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex">
          {/* Desktop Filters Sidebar - Enhanced */}
          <aside className="hidden lg:block w-80 flex-shrink-0 border-r border-border/30 bg-muted/20 h-[calc(100vh-132px)] overflow-y-auto sticky top-[132px]">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Filtros</h3>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {activeFiltersCount} activos
                  </Badge>
                )}
              </div>
              <FiltersPanel />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 flex flex-col md:flex-row">
            {/* Grid Panel - shown in grid and split views */}
            {(view === 'grid' || view === 'split') && (
              <div className={`${view === 'split' ? 'md:w-1/2 md:border-r border-border/30' : 'w-full'} h-[calc(100vh-180px)] md:h-[calc(100vh-132px)] overflow-y-auto bg-background`}>
                <div className="p-4 md:p-6">
                  {/* Results Header - Enhanced */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      {isLoading ? (
                        <Skeleton className="h-8 w-40" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-foreground">{filteredListings.length}</p>
                            <p className="text-xs text-muted-foreground">propiedades encontradas</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Mobile View Toggle */}
                    <div className="flex md:hidden items-center rounded-lg p-1 bg-muted/50 border border-border/30">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setView('grid')}
                        className="h-8 w-8 p-0 rounded-md bg-primary text-primary-foreground"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setView('map')}
                        className="h-8 w-8 p-0 rounded-md"
                      >
                        <MapIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Grid */}
                  {isLoading ? (
                    <div className={`grid gap-5 ${view === 'split' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-3 animate-pulse">
                          <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skeleton-shimmer" />
                          </div>
                          <div className="space-y-2 px-1">
                            <Skeleton className="h-5 w-3/4 rounded-lg" />
                            <Skeleton className="h-4 w-1/2 rounded-lg" />
                            <Skeleton className="h-6 w-1/3 rounded-lg" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredListings.length === 0 ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                      <div className="text-center p-8 md:p-12 max-w-md mx-auto">
                        <div className="relative mb-6">
                          <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <MapPin className="h-10 w-10 text-primary" />
                          </div>
                          <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-3xl blur-xl -z-10" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          Sin resultados
                        </h3>
                        <p className="text-muted-foreground mb-6 leading-relaxed">
                          No encontramos propiedades con esos criterios. Intenta ajustar los filtros para ver más opciones.
                        </p>
                        <Button 
                          onClick={clearFilters} 
                          variant="default"
                          size="lg"
                          className="rounded-xl px-6 shadow-lg shadow-primary/20"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Limpiar filtros
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={`grid gap-5 ${view === 'split' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
                      {filteredListings.map(listing => (
                        <ListingCard 
                          key={listing.id} 
                          listing={listing}
                          onHover={setHoveredListing}
                          matchResult={getMatchForListing(listing.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Map Panel - conditionally rendered based on view */}
            {(view === 'map' || view === 'split') && (
              <div className={`${view === 'split' ? 'hidden md:block md:w-1/2' : 'w-full'} h-[calc(100vh-180px)] md:h-[calc(100vh-132px)] relative`}>
                <EnhancedMap 
                  listings={filteredListings}
                  hoveredListing={hoveredListing}
                  onListingHover={setHoveredListing}
                  onListingClick={(listing) => navigate(`/propiedad/${listing.id}`)}
                  className="w-full h-full"
                  key="enhanced-map" // Stable key to prevent unnecessary remounts
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
