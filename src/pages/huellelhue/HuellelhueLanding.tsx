import { useEffect } from 'react';
import './huellelhue.css';
import HueHero from './sections/HueHero';
import HueFicha from './sections/HueFicha';
import HueLines from './sections/HueLines';
import HueMasterplan from './sections/HueMasterplan';
import HueEcosystem from './sections/HueEcosystem';
import HueArchitecture from './sections/HueArchitecture';
import HueConservation from './sections/HueConservation';
import HueContact from './sections/HueContact';
import HueFooter from './sections/HueFooter';

export default function HuellelhueLanding() {
  // Cinematic cursor glow
  useEffect(() => {
    const el = document.createElement('div');
    el.className = 'hue-cursor-glow';
    document.body.appendChild(el);
    const move = (e: MouseEvent) => {
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    };
    window.addEventListener('mousemove', move);

    // SEO
    document.title = 'Huellelhue — Reserva Bosque & Mar · Patagonia Reserve';
    const meta = document.createElement('meta');
    meta.name = 'description';
    meta.content =
      'Huellelhue · 420 hectáreas de selva valdiviana costera con 1,7 km de frente Pacífico. Reserva privada de bosque y mar en Río Negro, Región de Los Lagos. Por Patagonia Reserve.';
    document.head.appendChild(meta);

    return () => {
      window.removeEventListener('mousemove', move);
      el.remove();
      meta.remove();
    };
  }, []);

  return (
    <div className="hue-root hue-grain">
      <HueHero />
      <HueFicha />
      <HueLines />
      <HueMasterplan />
      <HueEcosystem />
      <HueArchitecture />
      <HueConservation />
      <HueContact />
      <HueFooter />
    </div>
  );
}
