import PublicLayout from '@/components/layouts/PublicLayout';
import CartographicHero from '@/components/landing/CartographicHero';
import AtlasTerritorySection from '@/components/landing/AtlasTerritorySection';
import FloatingCTA from '@/components/landing/FloatingCTA';
import TrustBadges from '@/components/landing/TrustBadges';
import FeaturedListings from '@/components/landing/FeaturedListings';
import HowItWorksFlow from '@/components/landing/HowItWorksFlow';
import DecisionStackSection from '@/components/landing/DecisionStackSection';
import ProfessionalNetworkSection from '@/components/landing/ProfessionalNetworkSection';
import CTASection from '@/components/CTASection';
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
