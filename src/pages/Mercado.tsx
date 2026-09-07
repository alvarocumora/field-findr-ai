import PublicLayout from '@/components/layouts/PublicLayout';
import ValueProposition from '@/components/landing/ValueProposition';
import CategoryShowcase from '@/components/landing/CategoryShowcase';
import InvestmentShowcase from '@/components/landing/InvestmentShowcase';
import RegionStatsCards from '@/components/landing/RegionStatsCards';
import MarketInsights from '@/components/landing/MarketInsights';
import AgentCTA from '@/components/landing/AgentCTA';
import RealListingsSection from '@/components/RealListingsSection';
import CTASection from '@/components/CTASection';

/**
 * Contenido analítico y editorial que antes saturaba la portada.
 * La portada vende; esta página informa.
 */
const Mercado = () => {
  return (
    <PublicLayout showFooter={true}>
      <section className="container px-4 pt-12 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Mercado de terrenos</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Precios de referencia por región, categorías de terreno, oportunidades de inversión y
          publicaciones de otros portales, en un solo lugar.
        </p>
      </section>

      <RegionStatsCards />
      <MarketInsights />
      <CategoryShowcase />
      <InvestmentShowcase />
      <RealListingsSection limit={16} />
      <ValueProposition />
      <AgentCTA />
      <CTASection />
    </PublicLayout>
  );
};

export default Mercado;
