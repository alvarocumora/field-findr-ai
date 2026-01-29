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
  MapPin,
  TrendingUp,
  Shield,
  Zap
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

const STATS = [
  { value: '15K+', label: 'Terrenos', icon: MapPin },
  { value: '98%', label: 'Precisión IA', icon: Zap },
  { value: '$2.5B', label: 'En ventas', icon: TrendingUp },
  { value: '100%', label: 'Verificados', icon: Shield },
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
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        
        <div className="container relative z-10 px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            {/* AI Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm mb-6 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-muted-foreground">Potenciado por</span>
              <span className="text-primary font-semibold">Inteligencia Artificial</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight animate-fade-in-up stagger-1">
              Encuentra tu{' '}
              <span className="gradient-text-hero">terreno ideal</span>
            </h1>
            
            <p className="text-muted-foreground text-base sm:text-lg md:text-xl mb-8 max-w-2xl mx-auto animate-fade-in-up stagger-2">
              Terrenos verificados en todo Chile con análisis inteligente de inversión
            </p>

            {/* Search Bar */}
            <div className="glass-strong rounded-2xl p-2 max-w-2xl mx-auto shadow-glow animate-fade-in-up stagger-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar ubicación, tipo de terreno..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-12 h-12 sm:h-14 bg-transparent border-0 focus-visible:ring-0 text-base"
                  />
                </div>
                <Button 
                  onClick={handleSearch} 
                  size="lg" 
                  className="h-12 sm:h-14 px-6 sm:px-8 btn-glow animate-pulse-glow"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-6 animate-fade-in-up stagger-4">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.type}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/explorar?type=${cat.type}`)}
                  className="h-10 px-4 text-sm rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300"
                >
                  <cat.icon className="h-4 w-4 mr-2" />
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats - Mobile optimized */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto animate-fade-in-up stagger-5">
            {STATS.map((stat) => (
              <div 
                key={stat.label}
                className="glass rounded-xl p-4 md:p-6 text-center card-hover border-gradient"
              >
                <stat.icon className="h-5 w-5 md:h-6 md:w-6 text-primary mx-auto mb-2" />
                <div className="text-xl md:text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="pb-16">
        <div className="container px-4">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Properties Grid */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-primary/30 text-primary text-sm px-3 py-1">
                    <Sparkles className="h-3 w-3 mr-1.5" />
                    Destacados
                  </Badge>
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    {featuredListings.length} propiedades
                  </span>
                </div>
                <Button variant="ghost" size="sm" asChild className="group">
                  <Link to="/explorar">
                    Ver todas
                    <ArrowRight className="h-4 w-4 ml-1.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-[4/3] rounded-xl" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                  {featuredListings.slice(0, 4).map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}

              {featuredListings.length > 4 && (
                <div className="mt-4 md:mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
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
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Ubicaciones</span>
                </div>
                <MiniMap 
                  listings={featuredListings} 
                  className="h-[350px] sm:h-[400px] lg:h-[520px] rounded-xl shadow-soft"
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
