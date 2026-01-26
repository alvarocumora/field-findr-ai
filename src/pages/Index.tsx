import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import ListingCard from '@/components/listings/ListingCard';
import MiniMap from '@/components/map/MiniMap';
import { useFeaturedListings } from '@/hooks/useListings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowRight, 
  Search, 
  Sparkles, 
  TreePine, 
  Factory, 
  Building2, 
  Waves, 
  Mountain, 
  Landmark,
  MapPin
} from 'lucide-react';
import { useState } from 'react';

const CATEGORIES = [
  { name: 'Parcelas', icon: TreePine, type: 'parcela_rural' },
  { name: 'Industrial', icon: Factory, type: 'sitio_industrial' },
  { name: 'Agrícola', icon: Landmark, type: 'campo_agricola' },
  { name: 'Urbano', icon: Building2, type: 'terreno_urbano' },
  { name: 'Costero', icon: Waves, type: 'terreno_costero' },
  { name: 'Montaña', icon: Mountain, type: 'terreno_montana' },
];

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { data: featuredListings = [], isLoading } = useFeaturedListings(6);

  const handleSearch = () => {
    navigate(`/explorar${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  return (
    <PublicLayout showFooter={false}>
      {/* Hero with Search */}
      <section className="relative py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="orb orb-1" />
        
        <div className="container relative z-10 px-4">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-primary font-medium">12 propiedades con análisis IA</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
              Encuentra tu <span className="gradient-text-hero">terreno ideal</span>
            </h1>
            
            <p className="text-muted-foreground text-sm md:text-base mb-6">
              Terrenos verificados en todo Chile
            </p>

            {/* Search Bar */}
            <div className="glass-strong rounded-xl p-1.5 max-w-xl mx-auto">
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar ubicación, tipo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 h-10 bg-transparent border-0 focus-visible:ring-0 text-sm"
                  />
                </div>
                <Button onClick={handleSearch} size="sm" className="h-10 px-4">
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Buscar
                </Button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap justify-center gap-1.5 mt-4">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.type}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/explorar?type=${cat.type}`)}
                  className="h-8 text-xs rounded-full hover:bg-primary/10 hover:text-primary"
                >
                  <cat.icon className="h-3.5 w-3.5 mr-1" />
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Grid + Map */}
      <section className="pb-12">
        <div className="container px-4">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Properties Grid */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-primary/30 text-primary text-xs">
                    Destacados
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {featuredListings.length} propiedades
                  </span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/explorar">
                    Ver todas
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-[4/3] rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {featuredListings.slice(0, 4).map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}

              {featuredListings.length > 4 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {featuredListings.slice(4, 6).map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </div>

            {/* Mini Map */}
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Ubicaciones</span>
                </div>
                <MiniMap 
                  listings={featuredListings} 
                  className="h-[400px] lg:h-[500px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
