import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type RequestType = "analyze-investment" | "due-diligence" | "market-comparison" | "roi-projection";

interface PropertyData {
  id: string;
  title: string;
  price: number;
  area_m2?: number;
  area_ha?: number;
  location: string;
  region?: string;
  type: string;
  zoning?: string;
  legal_status?: string;
  utilities?: Record<string, boolean>;
  subdivision_eligible?: boolean;
  tags?: string[];
}

interface InvestmentRequest {
  type: RequestType;
  property: PropertyData;
  userProfile?: {
    budget_min?: number;
    budget_max?: number;
    investment_goal?: string;
    risk_tolerance?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body: InvestmentRequest = await req.json();
    const { type, property, userProfile } = body;

    let systemPrompt = "";
    let userMessage = "";

    const propertyContext = `
Propiedad: ${property.title}
Precio: $${property.price.toLocaleString("es-CL")} CLP
Superficie: ${property.area_m2 ? `${property.area_m2} m²` : property.area_ha ? `${property.area_ha} ha` : "No especificada"}
Ubicación: ${property.location}${property.region ? `, ${property.region}` : ""}
Tipo: ${property.type}
Zonificación: ${property.zoning || "No especificada"}
Estado Legal: ${property.legal_status || "No verificado"}
Subdivisión Elegible: ${property.subdivision_eligible ? "Sí" : "No"}
Servicios: ${property.utilities ? Object.entries(property.utilities).filter(([_, v]) => v).map(([k]) => k).join(", ") || "No especificados" : "No especificados"}
Tags: ${property.tags?.join(", ") || "Ninguno"}`;

    switch (type) {
      case "analyze-investment":
        systemPrompt = `Eres un experto analista de inversiones inmobiliarias en Chile, especializado en terrenos y parcelas.
Tu objetivo es proporcionar un análisis de inversión detallado y profesional.

IMPORTANTE: Responde SIEMPRE en formato JSON válido con esta estructura exacta:
{
  "investmentScore": número entre 0 y 100,
  "scoreBreakdown": {
    "ubicacion": { "score": número 0-100, "peso": 0.25, "comentario": "texto" },
    "precio": { "score": número 0-100, "peso": 0.20, "comentario": "texto" },
    "potencial": { "score": número 0-100, "peso": 0.20, "comentario": "texto" },
    "legalidad": { "score": número 0-100, "peso": 0.15, "comentario": "texto" },
    "infraestructura": { "score": número 0-100, "peso": 0.10, "comentario": "texto" },
    "liquidez": { "score": número 0-100, "peso": 0.10, "comentario": "texto" }
  },
  "riskLevel": "bajo" | "medio" | "alto",
  "riskFactors": ["factor1", "factor2", ...],
  "opportunities": ["oportunidad1", "oportunidad2", ...],
  "plusvaliaProjection": {
    "year1": porcentaje,
    "year3": porcentaje,
    "year5": porcentaje,
    "year10": porcentaje
  },
  "recommendation": "texto breve con recomendación",
  "idealBuyerProfile": "texto describiendo el comprador ideal"
}`;
        
        userMessage = `Analiza esta propiedad como inversión:
${propertyContext}

${userProfile ? `
Perfil del inversor:
- Presupuesto: $${userProfile.budget_min?.toLocaleString("es-CL") || 0} - $${userProfile.budget_max?.toLocaleString("es-CL") || "Sin límite"}
- Objetivo: ${userProfile.investment_goal || "No especificado"}
- Tolerancia al riesgo: ${userProfile.risk_tolerance || "Moderada"}
` : ""}

Proporciona un análisis completo de inversión.`;
        break;

      case "due-diligence":
        systemPrompt = `Eres un experto en due diligence inmobiliario en Chile, especializado en la verificación legal y técnica de terrenos.

IMPORTANTE: Responde SIEMPRE en formato JSON válido con esta estructura exacta:
{
  "checklist": [
    {
      "category": "Legal" | "Técnico" | "Financiero" | "Ambiental" | "Urbanístico",
      "item": "nombre del documento o verificación",
      "description": "descripción breve",
      "priority": "crítico" | "importante" | "recomendado",
      "estimatedCost": número o null,
      "estimatedTime": "texto con tiempo estimado",
      "whereToGet": "dónde obtener este documento",
      "redFlags": ["posibles alertas a buscar"]
    }
  ],
  "legalStatus": {
    "currentStatus": "texto",
    "concerns": ["preocupación1", ...],
    "recommendations": ["recomendación1", ...]
  },
  "estimatedTotalCost": número,
  "estimatedTotalTime": "texto",
  "criticalAlerts": ["alerta1", ...],
  "nextSteps": ["paso1", "paso2", ...]
}`;
        
        userMessage = `Genera un checklist completo de due diligence para:
${propertyContext}

Incluye todos los documentos y verificaciones necesarias para una compra segura en Chile.`;
        break;

      case "market-comparison":
        systemPrompt = `Eres un experto en análisis de mercado inmobiliario en Chile.

IMPORTANTE: Responde SIEMPRE en formato JSON válido con esta estructura:
{
  "pricePerSqm": número,
  "marketAverage": número,
  "pricePosition": "por debajo" | "en promedio" | "por encima",
  "percentageDiff": número (positivo = más caro, negativo = más barato),
  "comparableProperties": número estimado en la zona,
  "marketTrend": "alcista" | "estable" | "bajista",
  "demandLevel": "alta" | "media" | "baja",
  "timeToSell": "texto con estimación",
  "negotiationRoom": número (porcentaje estimado de negociación),
  "seasonalFactors": "texto",
  "competitiveAdvantages": ["ventaja1", ...],
  "competitiveDisadvantages": ["desventaja1", ...]
}`;
        
        userMessage = `Analiza el posicionamiento de mercado de:
${propertyContext}`;
        break;

      case "roi-projection":
        systemPrompt = `Eres un experto en proyecciones financieras de inversiones inmobiliarias en Chile.

IMPORTANTE: Responde SIEMPRE en formato JSON válido con esta estructura:
{
  "scenarios": {
    "conservador": {
      "roi5Years": porcentaje,
      "roi10Years": porcentaje,
      "assumptions": ["supuesto1", ...]
    },
    "moderado": {
      "roi5Years": porcentaje,
      "roi10Years": porcentaje,
      "assumptions": ["supuesto1", ...]
    },
    "optimista": {
      "roi5Years": porcentaje,
      "roi10Years": porcentaje,
      "assumptions": ["supuesto1", ...]
    }
  },
  "breakEvenPoint": "texto",
  "cashFlowAnalysis": {
    "holdingCosts": número anual estimado,
    "potentialIncome": número o null si no aplica,
    "netCashFlow": número
  },
  "exitStrategies": [
    {
      "strategy": "nombre",
      "description": "texto",
      "expectedReturn": porcentaje,
      "timeframe": "texto",
      "risk": "bajo" | "medio" | "alto"
    }
  ],
  "recommendation": "texto"
}`;
        
        userMessage = `Proyecta el ROI para:
${propertyContext}

${userProfile ? `Horizonte de inversión del cliente: ${userProfile.investment_goal || "5-10 años"}` : ""}`;
        break;

      default:
        throw new Error(`Unknown request type: ${type}`);
    }

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
          { role: "user", content: userMessage }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Intenta más tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos agotados. Contacta al administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Parse JSON from response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
    }

    // Return raw content if JSON parsing fails
    return new Response(JSON.stringify({ content, raw: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("AI investment copilot error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
