import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RequestType = "chat" | "predict-price" | "search" | "generate-content";

interface AIRequest {
  type: RequestType;
  messages?: Array<{ role: string; content: string }>;
  propertyData?: {
    area: number;
    location: string;
    features?: string[];
    type?: string;
  };
  searchQuery?: string;
  contentType?: "description" | "marketing" | "features";
  propertyInfo?: {
    title: string;
    area: string;
    location: string;
    features: string[];
    price?: number;
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

    const body: AIRequest = await req.json();
    const { type } = body;

    let systemPrompt = "";
    let userMessage = "";

    switch (type) {
      case "chat":
        systemPrompt = `Eres un asistente de ventas experto en bienes raíces y loteos en Chile. 
Tu rol es ayudar a los clientes a encontrar el terreno perfecto para sus necesidades.
Conoces sobre:
- Tipos de terrenos (agrícola, industrial, residencial, parcelas de agrado)
- Regulaciones de uso de suelo en Chile
- Procesos de compraventa de terrenos
- Derechos de agua y servidumbres
- Financiamiento y créditos hipotecarios
- Zonas y precios de mercado

Responde de manera amable, profesional y en español. Sé conciso pero informativo.`;
        
        if (!body.messages?.length) {
          throw new Error("Messages are required for chat");
        }
        break;

      case "predict-price":
        systemPrompt = `Eres un experto tasador de terrenos en Chile. Analiza las características del terreno y proporciona una estimación de precio basada en el mercado actual.
        
Considera factores como:
- Ubicación y accesibilidad
- Superficie del terreno
- Tipo de uso de suelo
- Servicios disponibles (agua, luz, alcantarillado)
- Plusvalía de la zona
- Condiciones topográficas

Responde en JSON con este formato:
{
  "estimatedPrice": número,
  "pricePerSqm": número,
  "confidence": "alta" | "media" | "baja",
  "factors": [
    { "factor": "nombre", "impact": "positivo" | "negativo", "weight": número }
  ],
  "marketAnalysis": "texto corto",
  "recommendation": "texto corto"
}`;
        
        if (!body.propertyData) {
          throw new Error("Property data is required for price prediction");
        }
        userMessage = `Analiza este terreno y estima su precio:
Superficie: ${body.propertyData.area} m²
Ubicación: ${body.propertyData.location}
Tipo: ${body.propertyData.type || "No especificado"}
Características: ${body.propertyData.features?.join(", ") || "No especificadas"}`;
        break;

      case "search":
        systemPrompt = `Eres un motor de búsqueda inteligente para propiedades y terrenos. 
Analiza la consulta del usuario y extrae los criterios de búsqueda relevantes.

Responde en JSON con este formato:
{
  "intent": "comprar" | "arrendar" | "invertir" | "información",
  "propertyType": ["agrícola", "industrial", "residencial", "parcela", "comercial"] | null,
  "location": string | null,
  "priceRange": { "min": number | null, "max": number | null },
  "areaRange": { "min": number | null, "max": number | null },
  "features": string[],
  "keywords": string[],
  "suggestion": "texto de respuesta amigable para el usuario"
}`;
        
        if (!body.searchQuery) {
          throw new Error("Search query is required");
        }
        userMessage = body.searchQuery;
        break;

      case "generate-content":
        const contentPrompts = {
          description: `Genera una descripción atractiva y profesional para esta propiedad. 
La descripción debe ser persuasiva, destacar los puntos fuertes y crear urgencia.
Usa un tono profesional pero cercano. Máximo 200 palabras.`,
          marketing: `Crea contenido de marketing para esta propiedad incluyendo:
- Título llamativo
- 3 puntos clave de venta (bullets)
- Call-to-action
- Hashtags relevantes para redes sociales`,
          features: `Analiza la propiedad y genera una lista detallada de características y beneficios.
Incluye características que podrían no estar mencionadas pero son típicas de este tipo de propiedad.`
        };

        systemPrompt = `Eres un experto en marketing inmobiliario especializado en terrenos y loteos en Chile.
${contentPrompts[body.contentType || "description"]}`;

        if (!body.propertyInfo) {
          throw new Error("Property info is required for content generation");
        }
        userMessage = `Propiedad: ${body.propertyInfo.title}
Ubicación: ${body.propertyInfo.location}
Superficie: ${body.propertyInfo.area}
${body.propertyInfo.price ? `Precio: $${body.propertyInfo.price.toLocaleString("es-CL")}` : ""}
Características: ${body.propertyInfo.features.join(", ")}`;
        break;

      default:
        throw new Error(`Unknown request type: ${type}`);
    }

    const messages = type === "chat" 
      ? [{ role: "system", content: systemPrompt }, ...body.messages!]
      : [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: type === "chat",
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

    if (type === "chat") {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // For structured responses, try to parse JSON
    if (type === "predict-price" || type === "search") {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch {
        // Return as text if JSON parsing fails
      }
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("AI assistant error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
