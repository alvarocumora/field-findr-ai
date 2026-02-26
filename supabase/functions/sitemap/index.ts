import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = "https://ofertaterrenos.com";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const [listings, projects] = await Promise.all([
      supabase
        .from("listings")
        .select("id, updated_at, region, city, country")
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(1000),
      supabase
        .from("projects")
        .select("id, updated_at, region, city")
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(500),
    ]);

    const listingsData = listings.data || [];
    const projectsData = projects.data || [];

    // Collect unique regions for regional landing pages
    const regions = new Set<string>();
    listingsData.forEach((l) => { if (l.region) regions.add(l.region); });

    const now = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${SITE_URL}/explorar</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${SITE_URL}/pricing</loc><lastmod>${now}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>${SITE_URL}/tools</loc><lastmod>${now}</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>
`;

    // Regional landing pages
    for (const region of regions) {
      const slug = region
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      xml += `  <url><loc>${SITE_URL}/region/${slug}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>\n`;
    }

    // Property pages
    for (const listing of listingsData) {
      const lastmod = listing.updated_at?.split("T")[0] || now;
      xml += `  <url><loc>${SITE_URL}/propiedad/${listing.id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
    }

    // Project pages
    for (const project of projectsData) {
      const lastmod = project.updated_at?.split("T")[0] || now;
      xml += `  <url><loc>${SITE_URL}/proyecto/${project.id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(`<!-- Error: ${msg} -->`, {
      status: 500,
      headers: { "Content-Type": "application/xml" },
    });
  }
});
