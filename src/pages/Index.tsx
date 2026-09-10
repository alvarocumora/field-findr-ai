import { Link } from 'react-router-dom';
import PublicLayout from '@/components/layouts/PublicLayout';
import CartographicHero from '@/components/landing/CartographicHero';
import FloatingCTA from '@/components/landing/FloatingCTA';
import TrustBadges from '@/components/landing/TrustBadges';
import FeaturedListings from '@/components/landing/FeaturedListings';
import HowItWorksFlow from '@/components/landing/HowItWorksFlow';
import DecisionStackSection from '@/components/landing/DecisionStackSection';
import ProfessionalNetworkSection from '@/components/landing/ProfessionalNetworkSection';
import CTASection from '@/components/CTASection';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPinned } from 'lucide-react';
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
      <CartographicHero />

      <FeaturedListings />

      <section className="border-y border-border/50 bg-muted/20 py-12 md:py-16">
        <div className="container flex flex-col gap-6 px-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Explora Chile por proyecto</p>
            <h2 className="mt-3 font-heading text-3xl font-bold md:text-4xl">Una vista territorial para comparar antes de decidir.</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              Recorre proyectos, comunas y regiones desde el mapa. Filtra por ubicación, superficie y precio para encontrar alternativas comparables.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link to="/explorar?view=map"><MapPinned className="mr-2 h-4 w-4" />Abrir mapa nacional <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <HowItWorksFlow />
      <DecisionStackSection />
      <TrustBadges />
      <ProfessionalNetworkSection />
      <CTASection />
      <FloatingCTA />
    </PublicLayout>
  );
};

export default Index;
