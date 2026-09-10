import PublicLayout from '@/components/layouts/PublicLayout';
import CartographicHero from '@/components/landing/CartographicHero';
import FloatingCTA from '@/components/landing/FloatingCTA';
import TrustBadges from '@/components/landing/TrustBadges';
import FeaturedListings from '@/components/landing/FeaturedListings';
import HowItWorksFlow from '@/components/landing/HowItWorksFlow';
import DecisionStackSection from '@/components/landing/DecisionStackSection';
import ProfessionalNetworkSection from '@/components/landing/ProfessionalNetworkSection';
import AtlasTerritorySection from '@/components/landing/AtlasTerritorySection';
import CTASection from '@/components/CTASection';
import { useSEO } from '@/hooks/useSEO';

const Index = () => {
  useSEO({
    title: 'OfertaTerrenos Atlas | Explora proyectos y terrenos en Chile',
    description: 'Explora Chile por región, proyecto y parcela. Revisa inventario, precios y disponibilidad, conoce el terreno y agenda una visita o inicia una reserva en OfertaTerrenos.',
    image: 'https://ofertaterrenos.com/og-oferta-terrenos.png',
    url: 'https://ofertaterrenos.com/',
    canonicalUrl: 'https://ofertaterrenos.com/',
  });

  return (
    <PublicLayout showFooter={true}>
      <CartographicHero />
      <AtlasTerritorySection />
      <FeaturedListings />
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
