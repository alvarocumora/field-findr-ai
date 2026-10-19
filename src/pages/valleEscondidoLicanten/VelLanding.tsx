import '../huellelhue/huellelhue.css';
import VelHero from './sections/VelHero';
import VelFicha from './sections/VelFicha';
import VelEntorno from './sections/VelEntorno';
import VelGallery from './sections/VelGallery';
import VelMasterplan from './sections/VelMasterplan';
import MapErrorBoundary from '@/components/map/MapErrorBoundary';
import VelAiLotMatcher from './sections/VelAiLotMatcher';
import VelLotsGrid from './sections/VelLotsGrid';
import VelContacto from './sections/VelContacto';
import VelFooter from './sections/VelFooter';
import VelConversionBar from './components/VelConversionBar';
import VelCompareTray from './components/VelCompareTray';
import { VelStateProvider } from './state/VelContext';
import { VEL_PROJECT } from './data/project';
import { ProjectDownloadsBySlug } from '@/components/projects/ProjectDownloadsBySlug';
import { useSEO } from '@/hooks/useSEO';
import heroImg from '@/assets/valle-escondido-licanten/vel-valle.jpg';
import { VEL_CONTACT } from './data/commercial';

const canonicalUrl = 'https://ofertaterrenos.com/p/valle-escondido-licanten';

export default function VelLanding() {
  const description =
    `Valle Escondido Licantén: ${VEL_PROJECT.totalLots} parcelas rurales sobre ${VEL_PROJECT.totalAreaHa} hectáreas, a pocos minutos de Licantén, con acceso asfaltado y conexión hacia Lago Vichuquén. Plano interactivo, disponibilidad en vivo y reserva desde $${VEL_PROJECT.priceFromClp.toLocaleString('es-CL')}.`;

  const socialImage =
    typeof window !== 'undefined' ? new URL(heroImg, window.location.origin).href : heroImg;

  useSEO({
    title: 'Valle Escondido Licantén · Parcelas cerca de Licantén',
    description,
    image: socialImage,
    url: canonicalUrl,
    canonicalUrl,
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: VEL_PROJECT.name,
      description,
      url: canonicalUrl,
      image: socialImage,
      address: {
        '@type': 'PostalAddress',
        addressLocality: VEL_PROJECT.city,
        addressRegion: VEL_PROJECT.region,
        addressCountry: 'CL',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: VEL_PROJECT.center.lat,
        longitude: VEL_PROJECT.center.lng,
      },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'CLP',
        lowPrice: VEL_PROJECT.priceFromClp,
        highPrice: VEL_PROJECT.priceToClp,
        offerCount: VEL_PROJECT.availableLots,
        availability: 'https://schema.org/InStock',
      },
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Superficie total',
          value: VEL_PROJECT.totalAreaHa,
          unitText: 'ha',
        },
        {
          '@type': 'PropertyValue',
          name: 'Parcelas',
          value: VEL_PROJECT.totalLots,
        },
      ],
    },
  });

  return (
    <div
      className="hue-root hue-grain pb-20 md:pb-28"
      style={
        {
          ['--hue-amber' as string]: '#c9b06b',
          ['--hue-forest' as string]: '#101f16',
          ['--hue-forest-mid' as string]: '#1c3623',
        } as React.CSSProperties
      }
    >
      <VelStateProvider>
        <VelHero />
        <VelFicha />
        <VelEntorno />
        <VelGallery />
        <VelAiLotMatcher />
        {/* Sin WebGL, mapbox-gl lanza al inicializar — sin este boundary se
            perdía toda la landing (ficha, galería, contacto), no solo el
            masterplan (G03, docs/PLATFORM_EXPERIENCE_AUDIT_2026-10-14.md). */}
        <MapErrorBoundary>
          <VelMasterplan />
        </MapErrorBoundary>
        <VelLotsGrid />
        <div className="bg-background py-14">
          <div className="container max-w-5xl">
            <ProjectDownloadsBySlug slug="valle-escondido-licanten" fallbackContact={VEL_CONTACT} />
          </div>
        </div>
        <VelContacto />
        <VelFooter />
        <VelCompareTray />
        <VelConversionBar />
      </VelStateProvider>
    </div>
  );
}
