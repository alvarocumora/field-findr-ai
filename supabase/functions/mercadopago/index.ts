import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const MERCADOPAGO_API_URL = "https://api.mercadopago.com";

type BillingCycle = "monthly" | "annual";
type PlanKey =
  | "corredor" | "corredora" | "inmobiliaria" | "grupo"
  // legacy aliases -> map to new tiers
  | "starter" | "growth" | "scale" | "professional";

interface PlanConfig {
  name: string;
  monthly: number; // CLP
  currency: string;
  features: string[];
}

// Precios CLP alineados con LATAM_PRICES en src/hooks/useSubscription.ts
const PLANS: Record<Exclude<PlanKey, "starter" | "growth" | "scale" | "professional">, PlanConfig> = {
  corredor: {
    name: "Plan Corredor",
    monthly: 38000,
    currency: "CLP",
    features: ["1 usuario", "Hasta 15 publicaciones", "CRM básico", "IA búsqueda"],
  },
  corredora: {
    name: "Plan Corredora",
    monthly: 94000,
    currency: "CLP",
    features: ["3 usuarios", "Hasta 60 publicaciones", "1 destacada/mes", "Lead scoring AI", "Mapa 3D"],
  },
  inmobiliaria: {
    name: "Plan Inmobiliaria",
    monthly: 188000,
    currency: "CLP",
    features: ["10 usuarios", "Hasta 200 publicaciones", "3 destacadas/mes", "CRM + financing", "Tasación AI"],
  },
  grupo: {
    name: "Plan Grupo",
    monthly: 338000,
    currency: "CLP",
    features: ["25 usuarios", "Hasta 500 publicaciones", "8 destacadas/mes", "Multi-proyecto", "API + Webhooks"],
  },
};

// Aliases -> nueva estructura para retro-compat.
const ALIAS: Record<string, keyof typeof PLANS> = {
  starter: "corredora",
  growth: "inmobiliaria",
  scale: "grupo",
  professional: "corredora",
};

const resolvePlan = (planType: string): { key: keyof typeof PLANS; cfg: PlanConfig } | null => {
  const key = (ALIAS[planType] ?? planType) as keyof typeof PLANS;
  const cfg = PLANS[key];
  return cfg ? { key, cfg } : null;
};

const priceFor = (cfg: PlanConfig, cycle: BillingCycle, firstMonthDiscount: boolean) => {
  if (cycle === "annual") {
    // 2 meses gratis: 10 * mensual
    return cfg.monthly * 10;
  }
  return firstMonthDiscount ? Math.round(cfg.monthly * 0.5) : cfg.monthly;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!MERCADOPAGO_ACCESS_TOKEN) {
    return new Response(
      JSON.stringify({ error: "MercadoPago access token not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    if (req.method === "POST" && path === "create-preference") {
      // Require an authenticated caller. The user_id bound to the payment
      // MUST come from the verified JWT — never from the request body —
      // otherwise an attacker could bind their payment (or its chargeback)
      // to a victim's account.
      const authHeader = req.headers.get("authorization") || "";
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
      if (userErr || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = await req.json();
      const {
        plan_type,
        success_url,
        failure_url,
        billing_cycle = "monthly",
        first_month_discount = true,
        organization_id = null,
      } = body as {
        plan_type: string;
        organization_id?: string | null;
        success_url?: string;
        failure_url?: string;
        billing_cycle?: BillingCycle;
        first_month_discount?: boolean;
      };
      const user_id = user.id;
      const user_email = user.email;

      // Billing belongs to the selected workspace. Never trust the client role.
      if (organization_id) {
        const service = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );
        const { data: organization } = await service
          .from("organizations")
          .select("owner_id")
          .eq("id", organization_id)
          .maybeSingle();
        if (!organization) {
          return new Response(
            JSON.stringify({ error: "Organization not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        if (organization.owner_id !== user_id) {
          const { data: membership } = await service
            .from("organization_members")
            .select("role")
            .eq("organization_id", organization_id)
            .eq("user_id", user_id)
            .maybeSingle();
          if (!membership || !["admin", "org_admin"].includes(membership.role)) {
            return new Response(
              JSON.stringify({ error: "Only organization administrators can change billing" }),
              { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
        }
      }

      if (plan_type === "enterprise" || plan_type === "free") {
        return new Response(
          JSON.stringify({ error: "Plan requires sales contact", contact_url: "/contacto" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resolved = resolvePlan(plan_type);
      if (!resolved) {
        return new Response(
          JSON.stringify({ error: "Invalid plan type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { key, cfg } = resolved;
      const cycle: BillingCycle = billing_cycle === "annual" ? "annual" : "monthly";
      const unitPrice = priceFor(cfg, cycle, first_month_discount && cycle === "monthly");
      const cycleLabel = cycle === "annual" ? "Suscripción anual (2 meses gratis)" : "Suscripción mensual";
      const promoLabel =
        cycle === "monthly" && first_month_discount ? " · 50% off primer mes" : "";

      const preferenceData = {
        items: [
          {
            title: `${cfg.name} — ${cycle === "annual" ? "Anual" : "Mensual"}`,
            description: `${cycleLabel}${promoLabel}`,
            quantity: 1,
            currency_id: cfg.currency,
            unit_price: unitPrice,
          },
        ],
        payer: user_email ? { email: user_email } : undefined,
        back_urls: {
          success: success_url || `${req.headers.get("origin")}/subscription/success`,
          failure: failure_url || `${req.headers.get("origin")}/subscription/failure`,
          pending: `${req.headers.get("origin")}/subscription/pending`,
        },
        auto_return: "approved",
        external_reference: JSON.stringify({
          user_id,
          organization_id,
          plan_type: key,
          organization_id,
          billing_cycle: cycle,
          first_month_discount: cycle === "monthly" && first_month_discount,
        }),
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
        statement_descriptor: "OFERTATERRENOS",
        metadata: { plan_type: key, billing_cycle: cycle, organization_id },
      };

      const response = await fetch(`${MERCADOPAGO_API_URL}/checkout/preferences`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferenceData),
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
          sandbox_init_point: data.sandbox_init_point,
          plan_type: key,
          billing_cycle: cycle,
          unit_price: unitPrice,
          currency: cfg.currency,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "GET" && path === "plans") {
      return new Response(JSON.stringify(PLANS), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
