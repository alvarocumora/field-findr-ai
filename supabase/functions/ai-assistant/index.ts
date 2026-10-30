import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type RequestType = "chat" | "predict-price" | "search" | "generate-content" | "generate-listing" | "generate-brochure" | "generate-social-copy";

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
  listingData?: {
    title: string;
    type: string;
    area_ha: string;
    location: string;
    region: string;
    city?: string;
    tags: string[];
    utilities: { water: boolean; electricity: string; road_access: string };
    subdivision_eligible: boolean;
    price?: string;
    currency?: string;
  };
  projectData?: {
    name: string;
    description?: string;
    location: string;
    region: string;
    city?: string;
    totalLots: number;
    availableLots: number;
    priceMin?: number;
    priceMax?: number;
    areaMin?: number;
    areaMax?: number;
    conditions?: {
      min_down_payment_pct?: number;
      max_term_months?: number;
      interest_rate?: number;
      payment_methods?: string[];
      includes_urbanization?: boolean;
      delivery_date?: string;
    };
    features?: string[];
  };
  socialCopyData?: {
    projectName: string;
    location?: string | null;
    region?: string | null;
    priceFrom?: number | null;
    availableLots?: number | null;
    highlights?: string[];
    brokerName?: string | null;
  };
}

async function getListingsContext(supabaseUrl: string, supabaseKey: string, userQuery: string): Promise<string> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: listings, error } = await supabase
      .from("listings")
      .select("id, title, price, currency, area_m2, area_ha, location, region, city, type, tags, legal_status, subdivision_eligible, featured")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !listings?.length) return "";

    const totalListings = listings.length;
    const regions = [...new Set(listings.map(l => l.region).filter(Boolean))];
    const types = [...new Set(listings.map(l => l.type))];
    const priceRange = {
      min: Math.min(...listings.map(l => l.price)),
      max: Math.max(...listings.map(l => l.price)),
    };
    const avgPricePerM2 = listings
      .filter(l => l.area_m2 && l.area_m2 > 0)
      .reduce((sum, l) => sum + l.price / l.area_m2!, 0) / 
      listings.filter(l => l.area_m2 && l.area_m2 > 0).length;

    const queryLower = userQuery.toLowerCase();
    const relevantListings = listings
      .filter(l => {
        const searchText = `${l.title} ${l.location} ${l.region} ${l.city} ${l.type} ${l.tags?.join(" ")}`.toLowerCase();
        return queryLower.split(" ").some(word => word.length > 2 && searchText.includes(word));
      })
      .slice(0, 5);

    let context = `\n\n--- DATOS REALES DE LA PLATAFORMA ---
Total propiedades activas: ${totalListings}
Regiones con propiedades: ${regions.join(", ")}
Tipos disponibles: ${types.join(", ")}
Rango de precios: $${priceRange.min.toLocaleString()} - $${priceRange.max.toLocaleString()} CLP
Precio promedio por m²: $${Math.round(avgPricePerM2).toLocaleString()} CLP`;

    if (relevantListings.length > 0) {
      context += `\n\nPropiedades relevantes a la consulta:`;
      relevantListings.forEach((l, i) => {
        const pricePerM2 = l.area_m2 ? Math.round(l.price / l.area_m2) : null;
        context += `\n${i + 1}. "${l.title}" - ${l.location}, ${l.region}
   Precio: $${l.price.toLocaleString()} ${l.currency || "CLP"}${pricePerM2 ? ` ($${pricePerM2.toLocaleString()}/m²)` : ""}
   Superficie: ${l.area_ha ? l.area_ha + " há" : l.area_m2 + " m²"}
   Tipo: ${l.type} | Estado legal: ${l.legal_status}${l.subdivision_eligible ? " | Apto subdivisión" : ""}
   Tags: ${l.tags?.join(", ") || "N/A"}`;
      });
    }

    const cheapest = listings
      .filter(l => l.area_m2 && l.area_m2 > 0)
      .sort((a, b) => (a.price / a.area_m2!) - (b.price / b.area_m2!))
      .slice(0, 3);

    if (cheapest.length > 0) {
      context += `\n\nMejor relación precio/m²:`;
      cheapest.forEach((l, i) => {
        context += `\n${i + 1}. "${l.title}" en ${l.region} - $${Math.round(l.price / l.area_m2!).toLocaleString()}/m²`;
      });
    }

    return context;
  } catch (e) {
    console.error("Error fetching listings context:", e);
    return "";
  }
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
      case "chat": {
        if (!body.messages?.length) {
          throw new Error("Messages are required for chat");
        }

        const lastUserMsg = [...body.messages].reverse().find(m => m.role === "user")?.content || "";
        
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
        const dbContext = await getListingsContext(supabaseUrl, supabaseKey, lastUserMsg);

        systemPrompt = `Eres el Asesor de Inversión IA de Ofertaterrenos.com, la plataforma líder de terrenos en LATAM.

ROL: Eres un asesor inmobiliario experto con acceso a datos reales de propiedades en la plataforma. Puedes buscar, comparar y recomendar terrenos basándote en datos actualizados.

CAPACIDADES:
- Buscar y recomendar propiedades reales de la plataforma basándote en criterios del usuario
- Comparar terrenos lado a lado (precio/m², ubicación, servicios, potencial)
- Analizar ROI y proyección de plusvalía por zona
- Asesorar en due diligence legal y técnico (títulos, servidumbres, agua, subdivisión)
- Estimar precios justos basándote en comparables de mercado
- Explicar regulaciones por país (Chile, Argentina, Perú, Colombia, México)

EXPERTISE TÉCNICO:
- Zonificación y uso de suelo
- Derechos de agua y servidumbres
- Subdivisión de terrenos y regulaciones MINVU/municipales
- Financiamiento: créditos hipotecarios, leasing
- Impuestos: contribuciones, IVA, ganancias de capital
- Análisis de mercado por zona y tipo de terreno

ESTILO:
- Profesional pero cercano, como un asesor de confianza
- Usa datos concretos cuando estén disponibles
- Estructura respuestas con bullets y números
- Siempre menciona riesgos y sugiere due diligence
- Cuando recomiendes propiedades, incluye el nombre, ubicación y precio
- Responde siempre en español
${dbContext}`;
        break;
      }

      case "predict-price":
        systemPrompt = `Eres un experto tasador de terrenos en Chile y LATAM. Analiza las características del terreno y proporciona una estimación de precio basada en el mercado actual.

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
        
        if (!body.propertyData) throw new Error("Property data is required");
        userMessage = `Analiza este terreno y estima su precio:
Superficie: ${body.propertyData.area} m²
Ubicación: ${body.propertyData.location}
Tipo: ${body.propertyData.type || "No especificado"}
Características: ${body.propertyData.features?.join(", ") || "No especificadas"}`;
        break;

      case "search":
        systemPrompt = `Analiza la consulta y extrae criterios de búsqueda. Responde en JSON:
{
  "intent": "comprar" | "arrendar" | "invertir" | "información",
  "propertyType": ["agrícola", "industrial", "residencial", "parcela", "comercial"] | null,
  "location": string | null,
  "priceRange": { "min": number | null, "max": number | null },
  "areaRange": { "min": number | null, "max": number | null },
  "features": string[],
  "keywords": string[],
  "suggestion": "texto de respuesta amigable"
}`;
        if (!body.searchQuery) throw new Error("Search query is required");
        userMessage = body.searchQuery;
        break;

      case "generate-content": {
        const contentPrompts: Record<string, string> = {
          description: `Genera una descripción atractiva y profesional para esta propiedad. Persuasiva, destaca puntos fuertes, máximo 200 palabras.`,
          marketing: `Crea contenido de marketing: título llamativo, 3 puntos clave, call-to-action, hashtags.`,
          features: `Genera lista detallada de características y beneficios, incluyendo típicas del tipo.`,
        };

        systemPrompt = `Eres un experto en marketing inmobiliario de terrenos en LATAM.\n${contentPrompts[body.contentType || "description"]}`;

        if (!body.propertyInfo) throw new Error("Property info is required");
        userMessage = `Propiedad: ${body.propertyInfo.title}
Ubicación: ${body.propertyInfo.location}
Superficie: ${body.propertyInfo.area}
${body.propertyInfo.price ? `Precio: $${body.propertyInfo.price.toLocaleString("es-CL")}` : ""}
Características: ${body.propertyInfo.features.join(", ")}`;
        break;
      }

      case "generate-listing": {
        if (!body.listingData) throw new Error("Listing data is required");
        const ld = body.listingData;

        systemPrompt = `Eres un experto en marketing inmobiliario especializado en terrenos. Genera una ficha profesional para un terreno que se va a publicar.

Responde en JSON con este formato exacto:
{
  "description": "Descripción profesional de 150-200 palabras, persuasiva y detallada",
  "highlights": ["highlight 1", "highlight 2", "highlight 3", "highlight 4", "highlight 5"],
  "suggested_tags": ["tag1", "tag2", "tag3"]
}

La descripción debe:
- Ser atractiva y profesional
- Mencionar la ubicación y sus ventajas
- Destacar servicios disponibles
- Incluir potencial de inversión
- Usar lenguaje persuasivo pero honesto`;

        const services = [];
        if (ld.utilities.water) services.push("Agua");
        if (ld.utilities.electricity) services.push(`Electricidad: ${ld.utilities.electricity}`);
        if (ld.utilities.road_access) services.push(`Acceso: ${ld.utilities.road_access}`);

        userMessage = `Genera ficha para:
Título: ${ld.title}
Tipo: ${ld.type}
Superficie: ${ld.area_ha} hectáreas
Ubicación: ${ld.location}, ${ld.city || ""}, ${ld.region}
Servicios: ${services.join(", ") || "No especificados"}
Características: ${ld.tags.join(", ") || "Ninguna seleccionada"}
${ld.subdivision_eligible ? "Apto para subdivisión" : ""}
${ld.price ? `Precio: $${parseInt(ld.price).toLocaleString()} ${ld.currency || "CLP"}` : ""}`;
        break;
      }

      case "generate-brochure": {
        if (!body.projectData) throw new Error("Project data is required for brochure generation");
        const pd = body.projectData;

        systemPrompt = `Actúa como un Director de Marketing Inmobiliario experto en el mercado de parcelas en Chile. Tu objetivo es generar el contenido completo para un brochure PDF de ventas de alta conversión.

REGLAS:
- Tono profesional, aspiracional y transparente
- Evita el lenguaje de ventas agresivo
- Enfócate en la oportunidad patrimonial y la libertad de vivir en el campo
- Usa datos reales proporcionados, no inventes números
- Responde SIEMPRE en español de Chile`;

        const condText = pd.conditions ? `
Condiciones comerciales:
- Pie mínimo: ${pd.conditions.min_down_payment_pct ?? 'No definido'}%
- Plazo máximo: ${pd.conditions.max_term_months ?? 'No definido'} meses
- Tasa: ${pd.conditions.interest_rate ?? 'No definida'}%
- Métodos de pago: ${pd.conditions.payment_methods?.join(', ') ?? 'No definidos'}
- Urbanización incluida: ${pd.conditions.includes_urbanization ? 'Sí' : 'No'}
- Fecha entrega: ${pd.conditions.delivery_date ?? 'No definida'}` : '';

        userMessage = `Genera contenido de brochure para este proyecto inmobiliario:

Nombre: ${pd.name}
Descripción: ${pd.description || 'No disponible'}
Ubicación: ${[pd.city, pd.region].filter(Boolean).join(', ')}
Total de lotes: ${pd.totalLots}
Lotes disponibles: ${pd.availableLots}
Rango de precios: ${pd.priceMin ? `$${pd.priceMin.toLocaleString()}` : 'N/A'} - ${pd.priceMax ? `$${pd.priceMax.toLocaleString()}` : 'N/A'}
Superficies: ${pd.areaMin ? `${pd.areaMin.toLocaleString()} m²` : 'N/A'} - ${pd.areaMax ? `${pd.areaMax.toLocaleString()} m²` : 'N/A'}
${condText}
${pd.features?.length ? `Características: ${pd.features.join(', ')}` : ''}

Genera el contenido estructurado para el brochure.`;
        break;
      }

      case "generate-social-copy": {
        if (!body.socialCopyData) throw new Error("Social copy data is required");
        const sc = body.socialCopyData;

        systemPrompt = `Eres un experto en marketing inmobiliario para redes sociales, especializado en parcelas y loteos rurales en Chile.

REGLAS:
- Usa solo los datos entregados; nunca inventes precios, cantidades de parcelas ni condiciones que no te dieron.
- Tono cercano y profesional, sin exagerar ni prometer plusvalía garantizada.
- Responde siempre en español de Chile.
- Cada copy invita a escribir o visitar el link, pero no escribas tú ninguna URL: el link real se agrega después.`;

        userMessage = `Genera copy de redes sociales para este proyecto:
Nombre: ${sc.projectName}
Ubicación: ${[sc.location, sc.region].filter(Boolean).join(', ') || 'No especificada'}
${sc.priceFrom ? `Precio desde: $${sc.priceFrom.toLocaleString('es-CL')} CLP` : 'Precio: consultar'}
${sc.availableLots != null ? `Parcelas disponibles: ${sc.availableLots}` : ''}
${sc.highlights?.length ? `Destacados: ${sc.highlights.join(', ')}` : ''}
${sc.brokerName ? `Lo comparte: ${sc.brokerName} (puedes mencionarlo brevemente, por ejemplo invitando a escribirle a él/ella)` : ''}`;
        break;
      }

      default:
        throw new Error(`Unknown request type: ${type}`);
    }

    const messages = type === "chat"
      ? [{ role: "system", content: systemPrompt }, ...body.messages!]
      : [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ];

    const useStream = type === "chat";
    const aiBody: Record<string, unknown> = {
      model: "google/gemini-3-flash-preview",
      messages,
      stream: useStream,
    };

    if (type === "generate-listing") {
      aiBody.stream = false;
    }

    // Use tool calling for brochure generation
    if (type === "generate-brochure") {
      aiBody.stream = false;
      aiBody.tools = [
        {
          type: "function",
          function: {
            name: "generate_brochure_content",
            description: "Generate structured marketing content for a real estate project brochure PDF",
            parameters: {
              type: "object",
              properties: {
                headline: {
                  type: "string",
                  description: "Titular magnético que mezcle inversión inteligente y estilo de vida rural. Máximo 15 palabras."
                },
                elevatorPitch: {
                  type: "string",
                  description: "Párrafo de 4 líneas explicando por qué este sector es una joya oculta de inversión."
                },
                pillars: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Título del pilar (ej: Naturaleza, Ubicación, Seguridad Jurídica)" },
                      text: { type: "string", description: "Texto descriptivo del pilar, 2-3 oraciones persuasivas." }
                    },
                    required: ["title", "text"]
                  },
                  description: "3 pilares de valor del proyecto"
                },
                investmentProjection: {
                  type: "string",
                  description: "Nota breve sobre plusvalía de la zona y potencial de reventa. 2-3 oraciones."
                },
                technicalSpecs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string" },
                      value: { type: "string" }
                    },
                    required: ["label", "value"]
                  },
                  description: "Especificaciones técnicas: m², tipo de terreno, acceso, servicios"
                },
                ctaVisit: {
                  type: "string",
                  description: "Frase CTA potente para agendar visita por WhatsApp"
                },
                ctaMasterPlan: {
                  type: "string",
                  description: "Frase CTA para solicitar el Master Plan 3D"
                }
              },
              required: ["headline", "elevatorPitch", "pillars", "investmentProjection", "technicalSpecs", "ctaVisit", "ctaMasterPlan"]
            }
          }
        }
      ];
      aiBody.tool_choice = { type: "function", function: { name: "generate_brochure_content" } };
    }

    // Use tool calling for social copy so each platform always comes back
    // as its own field instead of one undifferentiated text blob to parse.
    if (type === "generate-social-copy") {
      aiBody.stream = false;
      aiBody.tools = [
        {
          type: "function",
          function: {
            name: "generate_social_copy",
            description: "Generate platform-specific social media copy to promote a rural land/subdivision project listing",
            parameters: {
              type: "object",
              properties: {
                instagram: {
                  type: "object",
                  properties: {
                    caption: {
                      type: "string",
                      description: "Caption para Instagram, máximo 150 palabras, con emojis moderados y un cierre con llamada a la acción para escribir por mensaje."
                    },
                    hashtags: {
                      type: "array",
                      items: { type: "string" },
                      description: "Entre 6 y 10 hashtags relevantes en español, cada uno empieza con #, sin espacios internos."
                    }
                  },
                  required: ["caption", "hashtags"]
                },
                whatsapp: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      description: "Mensaje breve para reenviar por WhatsApp, máximo 60 palabras, directo y sin hashtags."
                    }
                  },
                  required: ["message"]
                },
                facebook: {
                  type: "object",
                  properties: {
                    post: {
                      type: "string",
                      description: "Publicación para Facebook, tono cercano, hasta 200 palabras, pocos emojis."
                    }
                  },
                  required: ["post"]
                }
              },
              required: ["instagram", "whatsapp", "facebook"]
            }
          }
        }
      ];
      aiBody.tool_choice = { type: "function", function: { name: "generate_social_copy" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aiBody),
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

    if (useStream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();

    // Handle tool calling response for brochure and social copy
    if (type === "generate-brochure" || type === "generate-social-copy") {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          const parsed = JSON.parse(toolCall.function.arguments);
          return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch {
          // Fallback to content parsing
        }
      }
    }

    const content = data.choices?.[0]?.message?.content;

    // For structured responses, try to parse JSON
    if (type === "predict-price" || type === "search" || type === "generate-listing") {
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
