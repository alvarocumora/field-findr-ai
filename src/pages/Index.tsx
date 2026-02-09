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
  Play
} from 'lucide-react';
import { useState } from 'react';
import HeroStats from '@/components/landing/HeroStats';
import HowItWorks from '@/components/landing/HowItWorks';
import FeaturedProjects from '@/components/landing/FeaturedProjects';
import TrustBadges from '@/components/landing/TrustBadges';
import FloatingCTA from '@/components/landing/FloatingCTA';

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
    <PublicLayout showFooter={true}>
      {/* Hero Section */}
      <section className="relative py-16 md:py-28 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        
        <div className="container relative z-10 px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            {/* AI Badge with live pulse */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full glass border border-primary/20 text-sm mb-8 animate-fade-in">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              <span className="text-muted-foreground">Potenciado por</span>
              <span className="text-primary font-semibold">Inteligencia Artificial</span>
            </div>

            {/* Headline - Bigger and bolder */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.1] animate-fade-in-up stagger-1">
              Descubre tu{' '}
              <span className="gradient-text-hero block sm:inline">terreno ideal</span>
            </h1>
            
            <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-2xl mx-auto animate-fade-in-up stagger-2">
              La plataforma #1 en Chile para inversión en terrenos con análisis predictivo y datos verificados
            </p>

            {/* Search Bar - Enhanced */}
            <div className="glass-strong rounded-2xl p-2 max-w-2xl mx-auto shadow-2xl border border-primary/10 animate-fade-in-up stagger-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por ubicación, tipo, características..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-12 h-14 bg-transparent border-0 focus-visible:ring-0 text-base"
                  />
                </div>
                <Button 
                  onClick={handleSearch} 
                  size="lg" 
                  className="h-14 px-8 btn-glow animate-pulse-glow"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Buscar con IA
                </Button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-8 animate-fade-in-up stagger-4">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.type}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/explorar?type=${cat.type}`)}
                  className="h-10 px-4 text-sm rounded-full glass hover:bg-primary/10 hover:text-primary transition-all duration-300 border border-transparent hover:border-primary/20"
                >
                  <cat.icon className="h-4 w-4 mr-2" />
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats with animated counters */}
          <div className="animate-fade-in-up stagger-5">
            <HeroStats />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Featured Projects Section */}
      <FeaturedProjects />

      {/* Featured Properties Section */}
      <section className="py-16 md:py-20">
        <div className="container px-4">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Properties Grid */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="border-primary/30 text-primary text-sm px-3 py-1">
                    <Sparkles className="h-3 w-3 mr-1.5" />
                    Terrenos Destacados
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
                  <span className="text-sm font-medium text-foreground">Ubicaciones en Chile</span>
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

      {/* Trust Badges */}
      <TrustBadges />

      {/* Floating CTA */}
      <FloatingCTA />
    </PublicLayout>
  );
};

export default Index;
