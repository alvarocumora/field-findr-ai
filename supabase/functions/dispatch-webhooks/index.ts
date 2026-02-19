import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { event_type, payload, user_id } = await req.json();

    if (!event_type || !user_id) {
      return new Response(JSON.stringify({ error: "event_type and user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active webhooks for this user that subscribe to this event
    const { data: subscriptions, error: subError } = await supabase
      .from("webhook_subscriptions")
      .select("*")
      .eq("user_id", user_id)
      .eq("is_active", true)
      .contains("events", [event_type]);

    if (subError) throw subError;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ dispatched: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const timestamp = new Date().toISOString();
        const body = JSON.stringify({
          event: event_type,
          timestamp,
          data: payload,
        });

        // Create HMAC signature
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(sub.secret),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
        const sigHex = Array.from(new Uint8Array(signature))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        try {
          const response = await fetch(sub.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Webhook-Signature": `sha256=${sigHex}`,
              "X-Webhook-Event": event_type,
              "X-Webhook-Timestamp": timestamp,
            },
            body,
          });

          const responseBody = await response.text();
          const success = response.ok;

          // Log delivery
          await supabase.from("webhook_deliveries").insert({
            subscription_id: sub.id,
            event_type,
            payload,
            response_status: response.status,
            response_body: responseBody.substring(0, 1000),
            success,
          });

          // Update failure count
          if (!success) {
            await supabase
              .from("webhook_subscriptions")
              .update({
                failure_count: sub.failure_count + 1,
                is_active: sub.failure_count + 1 < 10, // disable after 10 failures
              })
              .eq("id", sub.id);
          } else {
            await supabase
              .from("webhook_subscriptions")
              .update({ failure_count: 0, last_triggered_at: timestamp })
              .eq("id", sub.id);
          }

          return { id: sub.id, success, status: response.status };
        } catch (fetchError: unknown) {
          const errMsg = fetchError instanceof Error ? fetchError.message : "Fetch failed";
          await supabase.from("webhook_deliveries").insert({
            subscription_id: sub.id,
            event_type,
            payload,
            response_status: 0,
            response_body: errMsg,
            success: false,
          });
          return { id: sub.id, success: false, error: errMsg };
        }
      })
    );

    return new Response(
      JSON.stringify({ dispatched: subscriptions.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
