import { Link } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import CartographicHero from '@/components/landing/CartographicHero';
import FloatingCTA from '@/components/landing/FloatingCTA';
import TrustBadges from '@/components/landing/TrustBadges';
import FeaturedListings from '@/components/landing/FeaturedListings';
import HowItWorksFlow from '@/components/landing/HowItWorksFlow';
import CTASection from '@/components/CTASection';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';

const Index = () => {
  useSEO({
    title: 'Proyectos de terrenos y loteos en Chile',
    description: 'Explora proyectos completos, planos, lotes disponibles y recorridos. Agenda una visita o inicia tu reserva en Ofertaterrenos.',
    image: 'https://ofertaterrenos.com/og-oferta-terrenos.png',
    url: 'https://ofertaterrenos.com/',
    canonicalUrl: 'https://ofertaterrenos.com/',
  });

  return (
    <PublicLayout showFooter={true}>
      {/* 1 · Mapa + búsqueda + proyectos */}
      <CartographicHero />

      {/* 2 · Proyectos destacados */}
      <FeaturedListings />

      {/* 3 · Evidencia y confianza */}
      <TrustBadges />

      {/* 4 · Cómo comprar en 3 pasos */}
      <HowItWorksFlow />

      {/* 5 · Experiencia del proyecto */}
      <section className="border-y border-border/50 bg-muted/20 py-16 md:py-24">
        <div className="container px-4 flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
          <div className="flex items-start gap-3">
            <BarChart3 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase text-primary">Plano, recorrido y ficha</p>
              <h2 className="mt-2 text-2xl font-heading font-bold md:text-4xl">Conoce el proyecto antes de visitarlo.</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Revisa polígonos, disponibilidad, fotografías, documentos y recorridos desde cada proyecto.
              </p>
            </div>
          </div>
          <Button asChild className="shrink-0">
            <Link to="/explorar">
              Explorar proyectos <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* 7 · Llamada final */}
      <CTASection />

      <FloatingCTA />
    </PublicLayout>
  );
};

export default Index;
