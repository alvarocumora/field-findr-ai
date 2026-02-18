import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all saved searches with notifications enabled
    const { data: savedSearches, error: ssError } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("notifications_enabled", true);

    if (ssError) throw ssError;
    if (!savedSearches || savedSearches.length === 0) {
      return new Response(JSON.stringify({ message: "No saved searches to check", notified: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let notifiedCount = 0;

    for (const search of savedSearches) {
      const filters = search.filters as Record<string, unknown>;
      if (!filters) continue;

      // Build query for new listings matching filters (last 24h)
      let query = supabase
        .from("listings")
        .select("id, title, location, price, type")
        .eq("status", "active")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Apply filters
      if (filters.types && Array.isArray(filters.types) && filters.types.length > 0) {
        query = query.in("type", filters.types as string[]);
      }
      if (filters.regions && Array.isArray(filters.regions) && filters.regions.length > 0) {
        query = query.in("region", filters.regions as string[]);
      }
      if (filters.priceMin && typeof filters.priceMin === "number") {
        query = query.gte("price", filters.priceMin);
      }
      if (filters.priceMax && typeof filters.priceMax === "number") {
        query = query.lte("price", filters.priceMax);
      }
      if (filters.areaMin && typeof filters.areaMin === "number") {
        query = query.gte("area_m2", filters.areaMin);
      }
      if (filters.areaMax && typeof filters.areaMax === "number") {
        query = query.lte("area_m2", filters.areaMax);
      }

      const { data: matches, error: mError } = await query.limit(5);
      if (mError || !matches || matches.length === 0) continue;

      // Create notification for the user
      const titles = matches.slice(0, 3).map((m) => m.title).join(", ");
      const { error: nError } = await supabase.from("notifications").insert({
        user_id: search.user_id,
        type: "alert",
        title: `${matches.length} nueva${matches.length > 1 ? "s" : ""} propiedad${matches.length > 1 ? "es" : ""} coinciden con "${search.name}"`,
        message: `Se encontraron propiedades que coinciden con tu búsqueda guardada: ${titles}${matches.length > 3 ? ` y ${matches.length - 3} más` : ""}`,
        link: "/explorar",
        metadata: { saved_search_id: search.id, match_count: matches.length, listing_ids: matches.map((m) => m.id) },
      });

      if (!nError) notifiedCount++;
    }

    return new Response(
      JSON.stringify({ message: "Smart alerts processed", notified: notifiedCount, checked: savedSearches.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
