import PublicLayout from '@/components/layouts/PublicLayout';
import CartographicHero from '@/components/landing/CartographicHero';
import OpportunityHubSection from '@/components/landing/OpportunityHubSection';
import FeaturedListings from '@/components/landing/FeaturedListings';
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
    <PublicLayout showFooter={true} showAssistant={false}>
      <CartographicHero />
      <OpportunityHubSection />
      <AtlasTerritorySection />
      <FeaturedListings />
      <DecisionStackSection />
      <ProfessionalNetworkSection />
      <CTASection />
    </PublicLayout>
  );
};

export default Index;
