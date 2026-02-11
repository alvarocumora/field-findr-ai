import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { project, lots } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const available = lots.filter((l: any) => l.status === "available").length;
    const reserved = lots.filter((l: any) => l.status === "reserved").length;
    const sold = lots.filter((l: any) => l.status === "sold").length;
    const areas = lots.map((l: any) => l.area).filter(Boolean);
    const prices = lots.map((l: any) => l.price).filter(Boolean);
    const withPolygon = lots.filter((l: any) => l.hasPolygon).length;

    const systemPrompt = `Eres un experto en desarrollo inmobiliario y loteos en Chile y Latinoamérica. Analiza los datos del proyecto y genera recomendaciones profesionales en español. Usa formato Markdown con secciones claras. Sé específico y accionable.`;

    const userPrompt = `Analiza este proyecto de loteo y genera recomendaciones:

**Proyecto:** ${project.name}
**Ubicación:** ${project.city}, ${project.region}
**Área total:** ${project.total_area || "No especificada"} m²
**Coordenadas:** ${project.latitude}, ${project.longitude}

**Resumen de Lotes (${lots.length} total):**
- Disponibles: ${available}
- Reservados: ${reserved}
- Vendidos: ${sold}
- Con polígono geoespacial: ${withPolygon}

**Áreas:** ${areas.length > 0 ? `Min: ${Math.min(...areas)} m², Max: ${Math.max(...areas)} m², Promedio: ${Math.round(areas.reduce((a: number, b: number) => a + b, 0) / areas.length)} m²` : "Sin datos"}
**Precios:** ${prices.length > 0 ? `Min: $${Math.min(...prices).toLocaleString()}, Max: $${Math.max(...prices).toLocaleString()}, Promedio: $${Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length).toLocaleString()}` : "Sin datos"}

**Detalle por lote:**
${lots.map((l: any) => `- Lote ${l.lot_number}: ${l.area}m², $${l.price?.toLocaleString() || "S/P"}, ${l.status}`).join("\n")}

Genera un análisis con estas secciones:
1. **Resumen Ejecutivo** - Estado general del proyecto
2. **Análisis de Precios** - ¿Los precios son competitivos? ¿Hay oportunidades de ajuste?
3. **Distribución de Lotes** - ¿La distribución de áreas es óptima?
4. **Recomendaciones de Infraestructura** - Accesos, áreas verdes, servicios
5. **Estrategia de Venta** - Qué lotes priorizar, descuentos, paquetes
6. **Riesgos y Oportunidades** - Factores a considerar`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido, intenta más tarde." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-masterplan-analyzer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
