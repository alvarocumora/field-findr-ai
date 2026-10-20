import PublicLayout from '@/components/layouts/PublicLayout';
import CinematicShowcaseHero from '@/components/landing/CinematicShowcaseHero';
import InsigniaShowcase from '@/components/landing/InsigniaShowcase';
import AtlasTerritorySection from '@/components/landing/AtlasTerritorySection';
import { EcosystemStandard, HybridCTA } from '@/components/landing/StandardAndPartner';
import { useSEO } from '@/hooks/useSEO';

const Index = () => {
  useSEO({
    title: 'OfertaTerrenos | Explora parcelas, campos y proyectos rurales',
    description: 'Explora parcelas, campos y loteos en Chile. Consulta información territorial, mapas y precios publicados; agenda visitas y revisa la disponibilidad de cada proyecto.',
    image: 'https://ofertaterrenos.com/og-oferta-terrenos.png',
    url: 'https://ofertaterrenos.com/',
    canonicalUrl: 'https://ofertaterrenos.com/',
  });

  return (
    <div className="theme-rural">
      <PublicLayout showFooter={true} showAssistant={false}>
        <CinematicShowcaseHero />
        <AtlasTerritorySection />
        <InsigniaShowcase />
        <EcosystemStandard />
        <HybridCTA />
      </PublicLayout>
    </div>
  );
};

export default Index;
