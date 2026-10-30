import PublicLayout from "@/components/layouts/PublicLayout";
import CinematicShowcaseHero from "@/components/landing/CinematicShowcaseHero";
import FluidProjectDock from "@/components/landing/FluidProjectDock";
import BuyerRequestSection from "@/components/landing/BuyerRequestSection";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingCreditDialog from "@/components/landing/LandingCreditDialog";
import { useSEO } from "@/hooks/useSEO";

const Index = () => {
  useSEO({
    title: "OfertaTerrenos | Explora parcelas, campos y proyectos rurales",
    description:
      "Explora parcelas, campos y loteos en Chile. Consulta información territorial, mapas y precios publicados; agenda visitas y revisa la disponibilidad de cada proyecto.",
    image: "https://ofertaterrenos.com/og-oferta-terrenos.jpg",
    url: "https://ofertaterrenos.com/",
    canonicalUrl: "https://ofertaterrenos.com/",
  });

  return (
    <div className="theme-rural">
      <PublicLayout showAssistant={false} footer={<LandingFooter />}>
        <CinematicShowcaseHero />
        <FluidProjectDock />
        <BuyerRequestSection />
        <LandingCreditDialog />
      </PublicLayout>
    </div>
  );
};

export default Index;
