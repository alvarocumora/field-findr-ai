import PublicLayout from '@/components/layouts/PublicLayout';
import CinematicShowcaseHero from '@/components/landing/CinematicShowcaseHero';
import FluidProjectDock from '@/components/landing/FluidProjectDock';
import AtlasTerritorySection from '@/components/landing/AtlasTerritorySection';
import { EcosystemStandard, HybridCTA } from '@/components/landing/StandardAndPartner';
import { useSEO } from '@/hooks/useSEO';
import LicantenOfferHero from '@/components/landing/LicantenOfferHero';
import { EasyCreditSimulator } from '@/components/fintech/EasyCreditSimulator';
import { LICANTEN_PROMO_PRICE } from '@/lib/easyCredit';
import { useSearchParams } from 'react-router-dom';

const Index = () => {
  const [searchParams] = useSearchParams();
  const requestedPrice = Number(searchParams.get('creditPrice'));
  const creditPrice = Number.isFinite(requestedPrice) && requestedPrice > 0 && requestedPrice <= 1_000_000_000 ? requestedPrice : LICANTEN_PROMO_PRICE;
  useSEO({
    title: 'OfertaTerrenos | Explora parcelas, campos y proyectos rurales',
    description: 'Explora parcelas, campos y loteos en Chile. Consulta información territorial, mapas y precios publicados; agenda visitas y revisa la disponibilidad de cada proyecto.',
    image: 'https://ofertaterrenos.com/og-oferta-terrenos.jpg',
    url: 'https://ofertaterrenos.com/',
    canonicalUrl: 'https://ofertaterrenos.com/',
  });

  return (
    <div className="theme-rural">
      <PublicLayout showFooter={true} showAssistant={false}>
        <CinematicShowcaseHero />
        <LicantenOfferHero />
        <EasyCreditSimulator key={creditPrice} defaultPrice={creditPrice} lotId={searchParams.get('creditLot')} />
        <FluidProjectDock />
        <AtlasTerritorySection />
        <EcosystemStandard />
        <HybridCTA />
      </PublicLayout>
    </div>
  );
};

export default Index;
