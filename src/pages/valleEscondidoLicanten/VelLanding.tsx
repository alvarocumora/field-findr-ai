import { useEffect } from 'react';
import '../huellelhue/huellelhue.css';
import VelHero from './sections/VelHero';
import VelFicha from './sections/VelFicha';
import VelEntorno from './sections/VelEntorno';
import VelGallery from './sections/VelGallery';
import VelMasterplan from './sections/VelMasterplan';
import VelLotsGrid from './sections/VelLotsGrid';
import VelContacto from './sections/VelContacto';
import VelFooter from './sections/VelFooter';
import { VelStateProvider } from './state/VelContext';
import { VEL_PROJECT } from './data/project';
import { ProjectDownloadsBySlug } from '@/components/projects/ProjectDownloadsBySlug';

export default function VelLanding() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `Valle Escondido Licantén — ${VEL_PROJECT.totalLots} parcelas · OFERTA TERRENOS`;
    const meta = document.createElement('meta');
    meta.name = 'description';
    meta.content = `Valle Escondido Licantén · ${VEL_PROJECT.totalAreaHa} hectáreas subdivididas en ${VEL_PROJECT.totalLots} parcelas en Licantén, Región del Maule. Plano interactivo, ficha por parcela y reserva en línea desde $${VEL_PROJECT.priceFromClp.toLocaleString('es-CL')}.`;
    document.head.appendChild(meta);
    return () => {
      meta.remove();
      document.title = prevTitle;
    };
  }, []);

  return (
    <div
      className="hue-root hue-grain"
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
        <VelMasterplan />
        <VelLotsGrid />
        <div className="bg-background py-14">
          <div className="container max-w-5xl">
            <ProjectDownloadsBySlug slug="valle-escondido-licanten" />
          </div>
        </div>
        <VelContacto />
        <VelFooter />
      </VelStateProvider>
    </div>
  );
}
