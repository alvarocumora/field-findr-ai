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
import FveDesarrollador from './sections/FveDesarrollador';
import FveProceso from './sections/FveProceso';
import FveFaqs from './sections/FveFaqs';
import FveContacto from './sections/FveContacto';
import FveFooter from './sections/FveFooter';

export default function ForestalLanding() {
  useSEO({
    title: 'Forestal Valle Escondido — Parcelas DL 3.516 Hualañé Maule',
    description:
      'Parcelación rural bajo DL 3.516 en Hualañé, Región del Maule. Parcelas desde 5.000 m² con roles SII individuales, escrituras inscribibles y derechos de agua DGA.',
    canonicalUrl: 'https://ofertaterrenos.com/forestal-valle-escondido',
    url: 'https://ofertaterrenos.com/forestal-valle-escondido',
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: 'Forestal Valle Escondido',
      description: 'Parcelación rural bajo DL 3.516 en Hualañé, Región del Maule. 15 parcelas desde 5.000 m².',
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
      <FveDesarrollador />
      <FveProceso />
      <FveFaqs />
      <FveContacto />
      <FveFooter />
    </div>
  );
}
