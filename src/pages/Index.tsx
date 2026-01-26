import { Link, useNavigate } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import ListingGrid from '@/components/listings/ListingGrid';
import { useFeaturedListings } from '@/hooks/useListings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowRight, 
  Search, 
  Sparkles, 
  TreePine, 
  Factory, 
  Building2, 
  Waves, 
  Mountain, 
  Landmark 
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
  const { data: featuredListings = [], isLoading } = useFeaturedListings(8);

  const handleSearch = () => {
    navigate(`/explorar${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  return (
    <PublicLayout showFooter={false}>
      {/* Compact Hero */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        
        <div className="container relative z-10 px-4">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-primary font-medium">IA integrada</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Encuentra el <span className="gradient-text-hero">terreno ideal</span>
            </h1>
            
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Más de 15,000 terrenos en Chile con análisis de valorización y verificación documental
            </p>

            {/* Search Bar */}
            <div className="glass-strong rounded-2xl p-2 mb-6">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por ubicación, tipo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-12 h-12 bg-transparent border-0 focus-visible:ring-0"
                  />
                </div>
                <Button 
                  onClick={handleSearch}
                  className="h-12 px-6 btn-glow"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>

            {/* Quick Category Filters */}
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.type}
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/explorar?type=${cat.type}`)}
                  className="rounded-full glass border-white/10 hover:border-primary/50"
                >
                  <cat.icon className="h-4 w-4 mr-1.5" />
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="relative py-12 md:py-16">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge variant="outline" className="glass border-primary/30 text-primary mb-2">
                Destacados
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Propiedades seleccionadas
              </h2>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/explorar">
                Ver todas
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>

          <ListingGrid 
            listings={featuredListings} 
            isLoading={isLoading}
            emptyMessage="Cargando propiedades..."
          />
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
