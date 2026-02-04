import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const MERCADOPAGO_API_URL = "https://api.mercadopago.com";

interface PlanConfig {
  name: string;
  price: number;
  currency: string;
  features: string[];
}

const PLANS: Record<string, PlanConfig> = {
  professional: {
    name: "Plan Profesional",
    price: 49990,
    currency: "CLP",
    features: [
      "Hasta 50 publicaciones activas",
      "LandScore AI completo",
      "CRM integrado",
      "Alertas en tiempo real",
      "Soporte prioritario"
    ]
  },
  enterprise: {
    name: "Plan Empresa",
    price: 149990,
    currency: "CLP",
    features: [
      "Publicaciones ilimitadas",
      "BuildCheck AI",
      "API de datos",
      "White-label",
      "Soporte dedicado 24/7"
    ]
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!MERCADOPAGO_ACCESS_TOKEN) {
    return new Response(
      JSON.stringify({ error: "MercadoPago access token not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // Create preference for checkout
    if (req.method === "POST" && path === "create-preference") {
      const { plan_type, user_id, user_email, success_url, failure_url } = await req.json();

      if (!plan_type || !PLANS[plan_type]) {
        return new Response(
          JSON.stringify({ error: "Invalid plan type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const plan = PLANS[plan_type];

      const preferenceData = {
        items: [
          {
            title: plan.name,
            description: `Suscripción mensual a ${plan.name}`,
            quantity: 1,
            currency_id: plan.currency,
            unit_price: plan.price
          }
        ],
        payer: {
          email: user_email
        },
        back_urls: {
          success: success_url || `${req.headers.get("origin")}/subscription/success`,
          failure: failure_url || `${req.headers.get("origin")}/subscription/failure`,
          pending: `${req.headers.get("origin")}/subscription/pending`
        },
        auto_return: "approved",
        external_reference: JSON.stringify({ user_id, plan_type }),
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
        statement_descriptor: "OFERTATERRENOS"
      };

      const response = await fetch(`${MERCADOPAGO_API_URL}/checkout/preferences`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(preferenceData)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("MercadoPago error:", data);
        return new Response(
          JSON.stringify({ error: "Failed to create preference", details: data }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          preference_id: data.id,
          init_point: data.init_point,
          sandbox_init_point: data.sandbox_init_point
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get plans info
    if (req.method === "GET" && path === "plans") {
      return new Response(
        JSON.stringify(PLANS),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
