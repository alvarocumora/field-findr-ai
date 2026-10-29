import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = claims.claims.sub as string;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: corsHeaders });
    }

    // Gather agent data
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [leadsRes, reservationsRes, projectsRes] = await Promise.all([
      serviceClient.from("leads").select("id, first_name, lead_score, status, next_follow_up").eq("user_id", userId).limit(20),
      serviceClient.from("reservations").select("id, status, expires_at, buyer_name").limit(20),
      serviceClient.from("projects").select("name, total_lots, sold_lots, available_lots").eq("user_id", userId).eq("status", "active"),
    ]);

    const context = {
      hotLeads: (leadsRes.data || []).filter((l) => (l.lead_score || 0) >= 50),
      pendingReservations: (reservationsRes.data || []).filter((r) => r.status === "pending_payment"),
      projects: projectsRes.data || [],
    };

    const prompt = `Eres un asistente ejecutivo de un agente inmobiliario en Chile. Genera un briefing matutino breve y accionable en español con estos datos:

- ${context.hotLeads.length} leads calientes (score ≥50)
- ${context.pendingReservations.length} reservas pendientes de pago
- ${context.projects.length} proyectos activos
- Proyectos: ${context.projects.map((p) => `${p.name}: ${p.sold_lots || 0}/${p.total_lots || 0} vendidos`).join(', ')}

Genera un resumen de máximo 4 bullet points con acciones concretas para hoy. Sé conciso y motivador.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Eres un asistente ejecutivo inmobiliario. Responde siempre en español, breve y accionable." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      // Fallback to structured briefing without AI
      return new Response(
        JSON.stringify({
          briefing: `Tienes ${context.hotLeads.length} leads calientes, ${context.pendingReservations.length} reservas pendientes y ${context.projects.length} proyectos activos.`,
          source: "data",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const briefingText = aiData.choices?.[0]?.message?.content || "No se pudo generar el briefing.";

    return new Response(
      JSON.stringify({ briefing: briefingText, source: "ai" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("agent-briefing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
