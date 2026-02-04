import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
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
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body, null, 2));

    // MercadoPago sends different types of notifications
    if (body.type === "payment" && body.data?.id) {
      const paymentId = body.data.id;

      // Fetch payment details from MercadoPago
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            "Authorization": `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
          }
        }
      );

      if (!paymentResponse.ok) {
        console.error("Failed to fetch payment:", await paymentResponse.text());
        return new Response(JSON.stringify({ error: "Failed to fetch payment" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const payment = await paymentResponse.json();
      console.log("Payment details:", JSON.stringify(payment, null, 2));

      // Parse external reference
      let externalRef: { user_id: string; plan_type: string } | null = null;
      try {
        externalRef = JSON.parse(payment.external_reference || "{}");
      } catch (e) {
        console.error("Failed to parse external reference:", e);
      }

      if (!externalRef?.user_id || !externalRef?.plan_type) {
        console.error("Invalid external reference");
        return new Response(JSON.stringify({ error: "Invalid external reference" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Record the payment
      const { error: paymentError } = await supabase.from("payments").insert({
        user_id: externalRef.user_id,
        amount: payment.transaction_amount,
        currency: payment.currency_id,
        status: payment.status,
        mercadopago_payment_id: paymentId.toString(),
        mercadopago_preference_id: payment.preference_id,
        description: `Suscripción ${externalRef.plan_type}`
      });

      if (paymentError) {
        console.error("Failed to record payment:", paymentError);
      }

      // If payment approved, update or create subscription
      if (payment.status === "approved") {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        // Check if user already has a subscription
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", externalRef.user_id)
          .single();

        if (existingSub) {
          // Update existing subscription
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              plan_type: externalRef.plan_type,
              status: "active",
              mercadopago_payer_id: payment.payer?.id?.toString(),
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
              cancel_at_period_end: false
            })
            .eq("id", existingSub.id);

          if (updateError) {
            console.error("Failed to update subscription:", updateError);
          }
        } else {
          // Create new subscription
          const { error: insertError } = await supabase.from("subscriptions").insert({
            user_id: externalRef.user_id,
            plan_type: externalRef.plan_type,
            status: "active",
            mercadopago_payer_id: payment.payer?.id?.toString(),
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString()
          });

          if (insertError) {
            console.error("Failed to create subscription:", insertError);
          }
        }

        // Assign agent role if upgrading to professional or enterprise
        if (externalRef.plan_type === "professional" || externalRef.plan_type === "enterprise") {
          const { data: existingRole } = await supabase
            .from("user_roles")
            .select("id")
            .eq("user_id", externalRef.user_id)
            .eq("role", "agent")
            .single();

          if (!existingRole) {
            await supabase.from("user_roles").insert({
              user_id: externalRef.user_id,
              role: "agent"
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
