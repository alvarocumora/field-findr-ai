import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import CTASection from '@/components/CTASection';
import FooterSection from '@/components/FooterSection';
import InteractiveMap from '@/components/InteractiveMap';
import PropertyGrid from '@/components/PropertyGrid';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin } from 'lucide-react';

const Index = () => {
  const featuredProperties = [
    {
      id: 1,
      title: 'Terreno Agrícola Premium en Casablanca',
      location: 'Casablanca, Valparaíso',
      price: '$185.000.000',
      pricePerHectare: '$3.700.000',
      area: '50 hectáreas',
      type: 'Agrícola',
      images: [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800'
      ],
      features: ['Riego tecnificado', 'Certificación orgánica'],
      agent: { name: 'María González', phone: '912345678', rating: 4.8, verified: true },
      views: 1247,
      daysPosted: 3,
      featured: true,
      isNew: true,
      waterRights: true,
      legalStatus: 'Saneado',
      aiScore: 92
    },
    {
      id: 2,
      title: 'Sitio Industrial en Quilicura',
      location: 'Quilicura, Santiago',
      price: '$290.000.000',
      pricePerHectare: '$14.500.000',
      area: '20 hectáreas',
      type: 'Industrial',
      images: [
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800'
      ],
      features: ['Zona franca', 'Electricidad trifásica'],
      agent: { name: 'Carlos Mendoza', phone: '987654321', rating: 4.9, verified: true },
      views: 892,
      daysPosted: 7,
      featured: true,
      isNew: false,
      waterRights: false,
      legalStatus: 'Saneado',
      aiScore: 88
    },
    {
      id: 3,
      title: 'Campo Ganadero en Temuco',
      location: 'Temuco, Araucanía',
      price: '$420.000.000',
      pricePerHectare: '$2.800.000',
      area: '150 hectáreas',
      type: 'Ganadero',
      images: [
        'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=800'
      ],
      features: ['Praderas naturales', 'Casa patronal'],
      agent: { name: 'Ana Sepúlveda', phone: '956789123', rating: 4.7, verified: true },
      views: 756,
      daysPosted: 12,
      featured: false,
      isNew: false,
      waterRights: true,
      legalStatus: 'Saneado',
      aiScore: 85
    },
    {
      id: 4,
      title: 'Parcela de Agrado en Pirque',
      location: 'Pirque, Santiago',
      price: '$125.000.000',
      pricePerHectare: '$12.500.000',
      area: '10 hectáreas',
      type: 'Parcela',
      images: [
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800'
      ],
      features: ['Vista cordillera', 'Pozo profundo'],
      agent: { name: 'Jorge Ruiz', phone: '923456789', rating: 4.6, verified: true },
      views: 234,
      daysPosted: 1,
      featured: false,
      isNew: true,
      waterRights: true,
      legalStatus: 'Saneado',
      aiScore: 79
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Noise overlay for texture */}
      <div className="noise-overlay" />
      
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Interactive Map Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="container relative z-10 px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-sm text-muted-foreground mb-4">
                <MapPin className="h-4 w-4 text-primary" />
                Mapa interactivo
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Explora en tiempo real
              </h2>
            </div>
            <Button variant="outline" className="glass border-white/10 hover:border-primary/50">
              Ver mapa completo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <div className="glass rounded-2xl p-2 border-gradient">
            <InteractiveMap className="h-[500px] md:h-[600px] rounded-xl overflow-hidden" />
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="relative py-24 overflow-hidden bg-muted/5">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="container relative z-10 px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Propiedades <span className="gradient-text">destacadas</span>
              </h2>
              <p className="text-muted-foreground">
                Seleccionadas por nuestra IA según potencial de valorización
              </p>
            </div>
            <Button variant="outline" className="glass border-white/10 hover:border-primary/50">
              Ver todas
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <PropertyGrid properties={featuredProperties} />
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <FooterSection />
    </div>
  );
};

export default Index;
