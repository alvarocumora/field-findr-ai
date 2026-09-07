import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import CartographicHero from '@/components/landing/CartographicHero';
import FloatingCTA from '@/components/landing/FloatingCTA';
import TestimonialMarquee from '@/components/landing/TestimonialMarquee';
import TrustBadges from '@/components/landing/TrustBadges';
import FeaturedListings from '@/components/landing/FeaturedListings';
import HowItWorksFlow from '@/components/landing/HowItWorksFlow';
import ConversationalSearch from '@/components/explore/ConversationalSearch';
import CTASection from '@/components/CTASection';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3 } from 'lucide-react';

// Recorrido inmersivo del proyecto estrella: pesado, se carga bajo demanda.
const ScrollytellingSection = lazy(() => import('@/components/landing/ScrollytellingSection'));

const Index = () => {
  return (
    <PublicLayout showFooter={true}>
      {/* 1 · Portada + buscador */}
      <CartographicHero />

      <section className="container px-4 -mt-8 relative z-10">
        <div className="max-w-3xl mx-auto">
          <ConversationalSearch className="bg-card rounded-2xl shadow-xl p-6 border" />
        </div>
      </section>

      {/* 2 · Proyectos destacados */}
      <FeaturedListings />

      {/* 3 · Cómo comprar en 3 pasos */}
      <HowItWorksFlow />

      {/* 4 · Recorrido del proyecto estrella */}
      <Suspense fallback={null}>
        <ScrollytellingSection />
      </Suspense>

      {/* 5 · Confianza */}
      <TrustBadges />

      {/* 6 · Testimonios */}
      <TestimonialMarquee />

      {/* Puerta al contenido analítico que salió de la portada */}
      <section className="container px-4 py-10">
        <div className="rounded-2xl border bg-muted/30 p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-start gap-3">
            <BarChart3 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold">¿Quieres los números del mercado?</h2>
              <p className="text-sm text-muted-foreground">
                Precios por región, plusvalía, oportunidades de inversión y portales comparados.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link to="/mercado">
              Ver mercado de terrenos <ArrowRight className="ml-2 h-4 w-4" />
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
