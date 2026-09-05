import { useEffect } from 'react';
import '../huellelhue/huellelhue.css';
import PaHero from './sections/PaHero';
import PaFicha from './sections/PaFicha';
import PaMasterplan from './sections/PaMasterplan';
import PaTour3D from './sections/PaTour3D';
import PaEcosystem from './sections/PaEcosystem';
import PaComparables from './sections/PaComparables';
import PaContact from './sections/PaContact';
import PaFooter from './sections/PaFooter';
import { ProjectDownloadsBySlug } from '@/components/projects/ProjectDownloadsBySlug';

export default function PlayaAlvaroLanding() {
  useEffect(() => {
    const el = document.createElement('div');
    el.className = 'hue-cursor-glow';
    document.body.appendChild(el);
    const move = (e: MouseEvent) => {
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    };
    window.addEventListener('mousemove', move);

    document.title = 'Playa Álvaro — 87 lotes frente al Pacífico · OFERTA TERRENOS';
    const meta = document.createElement('meta');
    meta.name = 'description';
    meta.content =
      'Playa Álvaro · 400 hectáreas costeras subdivididas en 87 lotes DL 3.516, con frente al Pacífico, miradores y áreas comunes. Plataforma inmobiliaria interactiva.';
    document.head.appendChild(meta);

    return () => {
      window.removeEventListener('mousemove', move);
      el.remove();
      meta.remove();
    };
  }, []);

  return (
    <div
      className="hue-root hue-grain"
      style={
        {
          // Coastal palette override (azul océano + arena)
          ['--hue-amber' as any]: '#5cc4d6',
          ['--hue-forest' as any]: '#0a2540',
          ['--hue-forest-mid' as any]: '#0e3a5f',
        } as React.CSSProperties
      }
    >
      <PaHero />
      <PaFicha />
      <PaMasterplan />
      <PaTour3D />
      <PaEcosystem />
      <PaComparables />
      <div className="bg-background py-14">
        <div className="container max-w-5xl">
          <ProjectDownloadsBySlug slug="playa-alvaro" />
        </div>
      </div>
      <PaContact />
      <PaFooter />
    </div>
  );
}
