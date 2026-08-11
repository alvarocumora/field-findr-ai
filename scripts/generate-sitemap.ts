/**
 * Genera public/sitemap.xml a partir del manifiesto único de rutas
 * (src/routes/routeManifest.tsx). Corre en predev y prebuild.
 *
 * Sólo entran rutas públicas estáticas e indexables. Las rutas dinámicas
 * (propiedades, proyectos, regiones…) las publica el sitemap dinámico
 * servido por la función `sitemap` del backend.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://ofertaterrenos.com";

const MANIFEST = resolve("src/routes/routeManifest.tsx");

/** Prioridades por ruta; el resto usa el valor por defecto. */
const PRIORITY: Record<string, string> = {
  "/": "1.0",
  "/explorar": "0.9",
  "/oportunidades": "0.8",
  "/blog": "0.8",
};

const CHANGEFREQ: Record<string, string> = {
  "/": "daily",
  "/explorar": "daily",
  "/oportunidades": "daily",
  "/blog": "weekly",
};

function extractPublicPaths(source: string): string[] {
  const paths: string[] = [];
  // pub("id", "/path", <El />, { indexable: false })
  const re = /pub\(\s*"[^"]+"\s*,\s*"([^"]+)"[^\n]*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const [line, path] = [m[0], m[1]];
    if (/indexable:\s*false/.test(line)) continue;
    if (path.includes(":") || path.includes("*")) continue; // dinámicas
    paths.push(path);
  }
  return [...new Set(paths)];
}

function generateSitemap(paths: string[]) {
  const urls = paths.map((path) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${path === "/" ? "/" : path}</loc>`,
      CHANGEFREQ[path] ? `    <changefreq>${CHANGEFREQ[path]}</changefreq>` : `    <changefreq>monthly</changefreq>`,
      `    <priority>${PRIORITY[path] ?? "0.6"}</priority>`,
      `  </url>`,
    ].join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

const source = readFileSync(MANIFEST, "utf8");
const paths = extractPublicPaths(source);
writeFileSync(resolve("public/sitemap.xml"), generateSitemap(paths));
console.log(`sitemap.xml written (${paths.length} entries)`);
