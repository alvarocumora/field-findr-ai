import { useEffect } from 'react';
import '../huellelhue/huellelhue.css';
import EpHero from './sections/EpHero';
import EpFicha from './sections/EpFicha';
import EpAmenities from './sections/EpAmenities';
import EpGallery from './sections/EpGallery';
import EpMasterplan from './sections/EpMasterplan';
import EpLotsGrid from './sections/EpLotsGrid';
import EpContact from './sections/EpContact';
import EpFooter from './sections/EpFooter';

export default function ExploraParkLanding() {
  useEffect(() => {
    const glow = document.createElement('div');
    glow.className = 'hue-cursor-glow';
    document.body.appendChild(glow);
    const move = (e: MouseEvent) => {
      glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    };
    window.addEventListener('mousemove', move);

    const prevTitle = document.title;
    document.title = 'Explora Park — 437 parcelas en Hualañé · OFERTA TERRENOS';
    const meta = document.createElement('meta');
    meta.name = 'description';
    meta.content =
      'Explora Park · 218 hectáreas subdivididas en 437 parcelas de ~5.000 m² en Hualañé, Región del Maule. Masterplan interactivo, filtros por estado y ficha pública por lote.';
    document.head.appendChild(meta);

    return () => {
      window.removeEventListener('mousemove', move);
      glow.remove();
      meta.remove();
      document.title = prevTitle;
    };
  }, []);

  return (
    <div
      className="hue-root hue-grain"
      style={
        {
          // Valle / campo palette (verdes tierra + trigo)
          ['--hue-amber' as any]: '#c9b06b',
          ['--hue-forest' as any]: '#122318',
          ['--hue-forest-mid' as any]: '#1e3a24',
        } as React.CSSProperties
      }
    >
      <EpHero />
      <EpFicha />
      <EpAmenities />
      <EpGallery />
      <EpMasterplan />
      <EpLotsGrid />
      <EpContact />
      <EpFooter />
    </div>
  );
}
