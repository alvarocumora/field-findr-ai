import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
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

export const useSEO = ({ title, description, image, url, type = 'website' }: SEOProps) => {
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

    if (image) {
      setMetaTag('og:image', image);
      setMetaTag('twitter:image', image);
    }

    if (url) {
      setMetaTag('og:url', url);
    }

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, image, url, type]);
};
