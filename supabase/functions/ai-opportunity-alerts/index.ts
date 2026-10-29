import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { listings } = await req.json();

    if (!listings || !Array.isArray(listings) || listings.length === 0) {
      return new Response(JSON.stringify({ opportunities: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send top 10 listings for analysis to keep token usage low
    const subset = listings.slice(0, 10).map((l) => ({
      id: l.id,
      title: l.title,
      price: l.price,
      area_m2: l.area_m2,
      location: l.location,
      region: l.region,
      type: l.type,
      legal_status: l.legal_status,
      subdivision_eligible: l.subdivision_eligible,
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `Eres un analista de oportunidades inmobiliarias en Chile. Analiza los terrenos y detecta oportunidades de inversión.
Responde SIEMPRE en JSON válido con esta estructura:
{
  "opportunities": [
    {
      "listing_id": "id del terreno",
      "type": "below_market" | "high_growth" | "subdivision" | "urgent",
      "title": "título corto de la oportunidad",
      "reason": "explicación breve de por qué es oportunidad",
      "confidence": número 0-100
    }
  ]
}
Máximo 5 oportunidades. Solo incluye las realmente relevantes.`,
          },
          {
            role: "user",
            content: `Analiza estos terrenos y detecta oportunidades:\n${JSON.stringify(subset)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch { /* fall through */ }

    return new Response(JSON.stringify({ opportunities: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Opportunity alerts error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
