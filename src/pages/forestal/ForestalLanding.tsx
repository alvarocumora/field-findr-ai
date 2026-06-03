import { useEffect } from 'react';
import { useSEO } from '@/hooks/useSEO';
import './forestal.css';

import FveNav from './sections/FveNav';
import FveHero from './sections/FveHero';
import FveProyecto from './sections/FveProyecto';
import FvePlanoMaestro from './sections/FvePlanoMaestro';
import FveUbicacion from './sections/FveUbicacion';
import FveInversion from './sections/FveInversion';
import FveProyecciones from './sections/FveProyecciones';
import FveDueDiligence from './sections/FveDueDiligence';
import FveUsoFondos from './sections/FveUsoFondos';
import FveCronograma from './sections/FveCronograma';
import FveDesarrollador from './sections/FveDesarrollador';
import FveProceso from './sections/FveProceso';
import FveFaqs from './sections/FveFaqs';
import FveContacto from './sections/FveContacto';
import FveFooter from './sections/FveFooter';

export default function ForestalLanding() {
  useSEO({
    title: 'Forestal Valle Escondido · Master Loteo La Palmilla — 177 parcelas DL 3.516 Hualañé',
    description:
      'Master Loteo La Palmilla — Caone (Hualañé, Maule). 177 parcelas Fase 1 con rol SII propio bajo DL 3.516, en programa de 600 lotes. Subdivisión SAG vigente, CIP municipal y dominio inscrito en CBR Licantén.',
    canonicalUrl: 'https://ofertaterrenos.com/forestal-valle-escondido',
    url: 'https://ofertaterrenos.com/forestal-valle-escondido',
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: 'Forestal Valle Escondido — Master Loteo La Palmilla',
      description:
        '177 parcelas Fase 1 (hijuelas 7, 8 y 10) bajo DL 3.516 en Hualañé. Programa total: 600 lotes. GDV Fase 1: CLP $ 2.303M.',
      url: 'https://ofertaterrenos.com/forestal-valle-escondido',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Hualañé',
        addressRegion: 'Región del Maule',
        addressCountry: 'CL',
      },
      geo: { '@type': 'GeoCoordinates', latitude: -35.0489, longitude: -71.9876 },
    },
  });

  // Subtle reveal on scroll
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-visible')),
      { threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="fve-theme min-h-screen">
      {/* Print-only dossier header */}
      <div className="fve-print-only fve-print-header">
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: 20, color: '#1F3D2B', margin: 0 }}>
          Forestal Valle Escondido — Dossier del Proyecto
        </p>
        <p style={{ fontSize: 11, color: '#555', margin: '4px 0 0 0' }}>
          Hualañé · Región del Maule · DL 3.516 · Forestal Valle Escondido SpA
        </p>
      </div>

      <FveNav />
      <FveHero />
      <FveProyecto />
      <FvePlanoMaestro />
      <FveUbicacion />
      <FveInversion />
      <FveProyecciones />
      <FveDueDiligence />
      <FveUsoFondos />
      <FveCronograma />
      <FveDesarrollador />
      <FveProceso />
      <FveFaqs />
      <FveContacto />
      <FveFooter />
    </div>
  );
}
