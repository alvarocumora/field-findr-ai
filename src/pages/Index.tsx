import Layout from '@/components/Layout';
import HeroSection from '@/components/HeroSection';
import InteractiveMap from '@/components/InteractiveMap';
import PropertyGrid from '@/components/PropertyGrid';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Index = () => {
  // Featured properties data
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
    <Layout>
      {/* Hero Section */}
      <HeroSection />

      {/* Interactive Map Section */}
      <section className="py-8 md:py-12">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              Explorar en el mapa
            </h2>
            <Button variant="ghost" size="sm">
              Ver mapa completo
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <InteractiveMap className="h-[400px] md:h-[500px]" />
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-8 md:py-12 bg-muted/30">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              Propiedades destacadas
            </h2>
            <Button variant="ghost" size="sm">
              Ver todas
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <PropertyGrid properties={featuredProperties} />
        </div>
      </section>
    </Layout>
  );
};

export default Index;
