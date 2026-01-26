import { Link } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import CTASection from '@/components/CTASection';
import ListingGrid from '@/components/listings/ListingGrid';
import { useFeaturedListings } from '@/hooks/useListings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, MapPin, Building2, TreePine, Factory, Mountain, Waves, Landmark } from 'lucide-react';

const CATEGORIES = [
  { name: 'Parcelas Rurales', icon: TreePine, href: '/explorar?type=parcela_rural', color: 'from-green-500/20 to-green-600/20' },
  { name: 'Sitios Industriales', icon: Factory, href: '/explorar?type=sitio_industrial', color: 'from-orange-500/20 to-orange-600/20' },
  { name: 'Campos Agrícolas', icon: Landmark, href: '/explorar?type=campo_agricola', color: 'from-yellow-500/20 to-yellow-600/20' },
  { name: 'Terrenos Urbanos', icon: Building2, href: '/explorar?type=terreno_urbano', color: 'from-blue-500/20 to-blue-600/20' },
  { name: 'Terrenos Costeros', icon: Waves, href: '/explorar?type=terreno_costero', color: 'from-cyan-500/20 to-cyan-600/20' },
  { name: 'Terrenos de Montaña', icon: Mountain, href: '/explorar?type=terreno_montana', color: 'from-purple-500/20 to-purple-600/20' },
];

const Index = () => {
  const { data: featuredListings = [], isLoading } = useFeaturedListings(8);

  return (
    <PublicLayout showFooter={false}>
      {/* Hero Section */}
      <HeroSection />

      {/* Categories Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="container relative z-10 px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="glass border-primary/30 text-primary mb-4">
              Explora por categoría
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Encuentra tu <span className="gradient-text">terreno ideal</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Descubre oportunidades únicas en todo Chile, desde parcelas rurales hasta sitios industriales
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((category) => (
              <Link
                key={category.name}
                to={category.href}
                className="group"
              >
                <div className={`
                  relative p-6 rounded-2xl glass border border-white/10 
                  hover:border-primary/30 transition-all duration-300
                  card-hover text-center
                `}>
                  <div className={`
                    w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center
                    bg-gradient-to-br ${category.color}
                    group-hover:scale-110 transition-transform duration-300
                  `}>
                    <category.icon className="h-7 w-7 text-foreground" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* Featured Properties */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="container relative z-10 px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-12">
            <div>
              <Badge variant="outline" className="glass border-primary/30 text-primary mb-4">
                Propiedades destacadas
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Seleccionadas por <span className="gradient-text">nuestra IA</span>
              </h2>
              <p className="text-muted-foreground">
                Las mejores oportunidades según potencial de valorización y calidad
              </p>
            </div>
            <Button variant="outline" asChild className="glass border-white/10 hover:border-primary/50">
              <Link to="/explorar">
                Ver todas
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          <ListingGrid 
            listings={featuredListings} 
            isLoading={isLoading}
            emptyMessage="Cargando propiedades destacadas..."
          />
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* CTA Section */}
      <CTASection />
    </PublicLayout>
  );
};

export default Index;
