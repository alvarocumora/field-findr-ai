import { useEffect } from 'react';
import { projectCanonicalUrl } from '@/lib/landing/paths';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  canonicalUrl?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const setMetaTag = (property: string, content: string) => {
  let element = document.querySelector(`meta[property="${property}"]`) || 
                document.querySelector(`meta[name="${property}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    if (property.startsWith('og:') || property.startsWith('twitter:')) {
      element.setAttribute('property', property);
    } else {
      element.setAttribute('name', property);
    }
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const setCanonical = (url: string) => {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
};

const JSON_LD_ID = 'seo-json-ld';

const setJsonLd = (data: Record<string, unknown> | Record<string, unknown>[]) => {
  let script = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = JSON_LD_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
};

const removeJsonLd = () => {
  document.getElementById(JSON_LD_ID)?.remove();
};

export const useSEO = ({ title, description, image, url, type = 'website', canonicalUrl, jsonLd }: SEOProps) => {
  // Serialize jsonLd so an inline object/array passed by the caller doesn't
  // create a new reference every render (which would re-run the effect and
  // rewrite the DOM on each render).
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : '';
  useEffect(() => {
    const prevTitle = document.title;
    const suffix = ' | Ofertaterrenos.com';
    
    document.title = title + suffix;

    if (description) {
      setMetaTag('description', description);
      setMetaTag('og:description', description);
      setMetaTag('twitter:description', description);
    }

    setMetaTag('og:title', title);
    setMetaTag('twitter:title', title);
    setMetaTag('og:type', type);

    const socialImage = image || 'https://ofertaterrenos.com/og-oferta-terrenos.jpg';
    setMetaTag('og:image', socialImage);
    setMetaTag('twitter:image', socialImage);

    if (url) {
      setMetaTag('og:url', url);
    }

    if (canonicalUrl) {
      setCanonical(canonicalUrl);
    }

    if (jsonLdKey) {
      setJsonLd(JSON.parse(jsonLdKey));
    }

    return () => {
      document.title = prevTitle;
      removeJsonLd();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, image, url, type, canonicalUrl, jsonLdKey]);
};

// Helper to build RealEstateListing JSON-LD
export const buildPropertyJsonLd = (listing: {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  currency?: string | null;
  location: string;
  region?: string | null;
  city?: string | null;
  country?: string | null;
  area_m2?: number | null;
  images?: string[] | null;
  lat?: number | null;
  lng?: number | null;
  type?: string;
}) => {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.title,
    description: listing.description || `${listing.title} en ${listing.location}`,
    url: `https://ofertaterrenos.com/propiedad/${listing.id}`,
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: listing.currency || 'CLP',
      availability: 'https://schema.org/InStock',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: listing.city || listing.location,
      addressRegion: listing.region || '',
      addressCountry: listing.country || 'CL',
    },
  };

  if (listing.area_m2) {
    jsonLd.floorSize = {
      '@type': 'QuantitativeValue',
      value: listing.area_m2,
      unitCode: 'MTK',
    };
  }

  if (listing.lat && listing.lng) {
    jsonLd.geo = {
      '@type': 'GeoCoordinates',
      latitude: listing.lat,
      longitude: listing.lng,
    };
  }

  if (listing.images?.length) {
    jsonLd.image = listing.images.slice(0, 5);
  }

  return jsonLd;
};

// Helper to build Project JSON-LD
export const buildProjectJsonLd = (project: {
  id: string;
  slug?: string | null;
  name: string;
  description?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  images?: string[] | null;
  total_lots?: number | null;
  available_lots?: number | null;
}) => {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: project.name,
    description: project.description || `Proyecto ${project.name} en ${project.city}, ${project.region}`,
    url: projectCanonicalUrl(project),
    address: {
      '@type': 'PostalAddress',
      addressLocality: project.city || '',
      addressRegion: project.region || '',
      addressCountry: project.country || 'CL',
    },
  };

  if (project.latitude && project.longitude) {
    jsonLd.geo = {
      '@type': 'GeoCoordinates',
      latitude: project.latitude,
      longitude: project.longitude,
    };
  }

  if (project.images?.length) {
    jsonLd.image = project.images.slice(0, 5);
  }

  if (project.total_lots) {
    jsonLd.additionalProperty = {
      '@type': 'PropertyValue',
      name: 'Lotes disponibles',
      value: `${project.available_lots || 0} de ${project.total_lots}`,
    };
  }

  return jsonLd;
};
