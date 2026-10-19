import PublicLayout from '@/components/layouts/PublicLayout';
import CinematicShowcaseHero from '@/components/landing/CinematicShowcaseHero';
import InsigniaShowcase from '@/components/landing/InsigniaShowcase';
import { EcosystemStandard, HybridCTA } from '@/components/landing/StandardAndPartner';
import { useSEO } from '@/hooks/useSEO';

const Index = () => {
  useSEO({
    title: 'OfertaTerrenos | Parcelas y loteos con tour 360 y reserva online',
    description: 'Recorre proyectos de parcelas en Chile con tour 360 de dron, masterplan, precios y disponibilidad en vivo. Agenda tu visita o reserva en línea.',
    image: 'https://ofertaterrenos.com/og-oferta-terrenos.png',
    url: 'https://ofertaterrenos.com/',
    canonicalUrl: 'https://ofertaterrenos.com/',
  });

  return (
    <div className="theme-rural">
    <PublicLayout showFooter={true} showAssistant={false}>
      <CinematicShowcaseHero />
      <InsigniaShowcase />
      <EcosystemStandard />
      <HybridCTA />
    </PublicLayout>
    </div>
  );
};

export default Index;
