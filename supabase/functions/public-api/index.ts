import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Path: /public-api/<resource>[/<id>][/<sub>]
    const resource = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
    
    // Parse query params
    const params = Object.fromEntries(url.searchParams);

    // Determine route from search params or path
    const endpoint = params.endpoint || resource;

    if (req.method === "GET") {
      // GET /public-api?endpoint=listings
      if (endpoint === "listings") {
        let query = supabase
          .from("listings")
          .select("id, title, type, price, currency, location, region, city, country, area_m2, area_ha, lat, lng, images, tags, zoning, created_at")
          .eq("status", "active");

        if (params.type) query = query.eq("type", params.type);
        if (params.country) query = query.eq("country", params.country);
        if (params.region) query = query.eq("region", params.region);
        if (params.city) query = query.eq("city", params.city);
        if (params.min_price) query = query.gte("price", Number(params.min_price));
        if (params.max_price) query = query.lte("price", Number(params.max_price));
        if (params.min_area) query = query.gte("area_m2", Number(params.min_area));
        if (params.max_area) query = query.lte("area_m2", Number(params.max_area));
        
        const limit = Math.min(Number(params.limit) || 20, 100);
        const offset = Number(params.offset) || 0;
        query = query.range(offset, offset + limit - 1).order("created_at", { ascending: false });

        const { data, error, count } = await query;
        if (error) throw error;

        return new Response(JSON.stringify({ data, meta: { limit, offset, total: count } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET /public-api?endpoint=projects
      if (endpoint === "projects") {
        const { data, error } = await supabase
          .from("projects")
          .select("id, name, description, location, city, region, country, total_lots, available_lots, reserved_lots, sold_lots, total_area, latitude, longitude, images, status, created_at")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(Number(params.limit) || 20);

        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET /public-api?endpoint=lots&project_id=xxx
      if (endpoint === "lots" && params.project_id) {
        const { data, error } = await supabase
          .from("lots")
          .select("id, lot_number, name, area, price, price_per_sqm, status, latitude, longitude, features")
          .eq("project_id", params.project_id)
          .order("lot_number", { ascending: true });

        if (error) throw error;

        // Only expose available status details
        const sanitized = (data || []).map(lot => ({
          ...lot,
          status: lot.status === "available" ? "available" : "unavailable",
        }));

        return new Response(JSON.stringify({ data: sanitized }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET /public-api?endpoint=stats
      if (endpoint === "stats") {
        const [listings, projects, lots] = await Promise.all([
          supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("lots").select("id, status"),
        ]);

        const lotsData = lots.data || [];
        return new Response(JSON.stringify({
          active_listings: listings.count || 0,
          active_projects: projects.count || 0,
          total_lots: lotsData.length,
          available_lots: lotsData.filter(l => l.status === "available").length,
          reserved_lots: lotsData.filter(l => l.status === "reserved").length,
          sold_lots: lotsData.filter(l => l.status === "sold").length,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        endpoints: [
          "GET ?endpoint=listings&type=&country=&region=&min_price=&max_price=&limit=&offset=",
          "GET ?endpoint=projects&limit=",
          "GET ?endpoint=lots&project_id=",
          "GET ?endpoint=stats",
        ],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
