import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Step 1: Use AI to extract search filters from natural language
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Eres un asistente de búsqueda de terrenos en Chile y LATAM. Extrae filtros de búsqueda del texto del usuario.
Responde SOLO con el JSON de la herramienta, sin texto adicional.`
          },
          { role: "user", content: query }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_search_filters",
            description: "Extract search filters from natural language query about land/property search",
            parameters: {
              type: "object",
              properties: {
                search_terms: { type: "string", description: "Key search terms for text search" },
                region: { type: "string", description: "Region in Chile if mentioned (e.g. Los Lagos, Araucanía)" },
                city: { type: "string", description: "City if mentioned (e.g. Pucón, Temuco)" },
                property_type: { type: "string", description: "Type: Parcela, Terreno Agrícola, Campo, Sitio, etc." },
                max_price: { type: "number", description: "Maximum price in CLP" },
                min_price: { type: "number", description: "Minimum price in CLP" },
                min_area_m2: { type: "number", description: "Minimum area in square meters" },
                max_area_m2: { type: "number", description: "Maximum area in square meters" },
                features: { type: "array", items: { type: "string" }, description: "Desired features: bosque, río, vista al mar, etc." },
                explanation: { type: "string", description: "Brief natural language explanation of what you understood, in Spanish" }
              },
              required: ["search_terms", "explanation"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_search_filters" } }
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes, intenta en unos segundos" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let filters: any = {};

    if (toolCall?.function?.arguments) {
      filters = JSON.parse(toolCall.function.arguments);
    }

    // Step 2: Query listings with extracted filters
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let dbQuery = supabase
      .from("listings")
      .select("id, title, location, price, area_m2, type, region, city, description")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(10);

    if (filters.max_price) dbQuery = dbQuery.lte("price", filters.max_price);
    if (filters.min_price) dbQuery = dbQuery.gte("price", filters.min_price);
    if (filters.min_area_m2) dbQuery = dbQuery.gte("area_m2", filters.min_area_m2);
    if (filters.max_area_m2) dbQuery = dbQuery.lte("area_m2", filters.max_area_m2);
    if (filters.region) dbQuery = dbQuery.ilike("region", `%${filters.region}%`);
    if (filters.city) dbQuery = dbQuery.or(`city.ilike.%${filters.city}%,location.ilike.%${filters.city}%`);
    if (filters.property_type) dbQuery = dbQuery.ilike("type", `%${filters.property_type}%`);

    const { data: listings, error: dbError } = await dbQuery;

    if (dbError) {
      console.error("DB error:", dbError);
      throw new Error("Error querying listings");
    }

    return new Response(JSON.stringify({
      results: listings || [],
      explanation: filters.explanation || `Busqué terrenos con tus criterios y encontré ${listings?.length || 0} resultados.`,
      filters_used: filters,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("ai-natural-search error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
