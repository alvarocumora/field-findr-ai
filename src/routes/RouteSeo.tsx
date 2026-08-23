import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { routeManifest } from "./routeManifest";

const SITE_URL = "https://ofertaterrenos.com";

const setMeta = (key: string, content: string) => {
  const selector = key.startsWith("og:") || key.startsWith("twitter:")
    ? `meta[property="${key}"]`
    : `meta[name="${key}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(key.startsWith("og:") || key.startsWith("twitter:") ? "property" : "name", key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const setCanonical = (href: string) => {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = href;
};

/**
 * SEO por defecto declarado en el manifiesto de rutas.
 * Se monta antes que las páginas, de modo que cualquier página con `useSEO`
 * propio sobrescribe estos valores sin conflicto.
 */
const RouteSeo = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const entry = routeManifest.find((r) => r.path === pathname && r.seo);
    if (!entry?.seo) return;

    const { title, description } = entry.seo;
    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title);
    setMeta("og:description", description);
    setMeta("og:type", "website");
    setMeta("og:url", `${SITE_URL}${pathname}`);
    setMeta("twitter:card", "summary_large_image");
    setCanonical(`${SITE_URL}${pathname}`);
  }, [pathname]);

  return null;
};

export default RouteSeo;
