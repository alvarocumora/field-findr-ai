import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const MERCADOPAGO_WEBHOOK_SECRET = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Must stay aligned with LATAM_PRICES.CLP and the checkout function.
const MONTHLY_PLAN_PRICES: Record<string, number> = {
  corredor: 38000,
  corredora: 94000,
  inmobiliaria: 188000,
  grupo: 338000,
};
const PLAN_ALIASES: Record<string, string> = {
  starter: "corredora",
  growth: "inmobiliaria",
  scale: "grupo",
  professional: "corredora",
};
const LEGACY_PENDING_PRICES: Record<string, number> = {
  starter: 75000,
  growth: 168750,
  scale: 300000,
  enterprise: 562500,
  professional: 49990,
};
const expectedSubscriptionAmounts = (
  planType: string,
  cycle: "monthly" | "annual" = "monthly",
  firstMonthDiscount = false,
): number[] => {
  const normalized = PLAN_ALIASES[planType] ?? planType;
  const monthly = MONTHLY_PLAN_PRICES[normalized];
  if (!monthly) return LEGACY_PENDING_PRICES[planType] ? [LEGACY_PENDING_PRICES[planType]] : [];
  const current = cycle === "annual"
    ? monthly * 10
    : firstMonthDiscount ? Math.round(monthly * 0.5) : monthly;
  const legacy = LEGACY_PENDING_PRICES[planType];
  return legacy && legacy !== current ? [current, legacy] : [current];
};

/**
 * Verify the MercadoPago webhook HMAC signature.
 * See https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks
 * Manifest: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
 */
async function verifyMercadoPagoSignature(req: Request, dataId: string): Promise<boolean> {
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  if (!xSignature) return false;

  // x-signature looks like: "ts=1704908010,v1=<hex>"
  const parts = Object.fromEntries(
    xSignature.split(",").map((kv) => kv.split("=").map((s) => s.trim()) as [string, string])
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // Alphanumeric data.id must be lowercased per MP spec.
  const id = /[a-zA-Z]/.test(dataId) ? dataId.toLowerCase() : dataId;
  const manifest = `id:${id};request-id:${xRequestId};ts:${ts};`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(MERCADOPAGO_WEBHOOK_SECRET!),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const computed = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time-ish comparison
  if (computed.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

/**
 * Record the MercadoPago payment exactly once. MP retries notifications, so the
 * insert must be idempotent: `payments.mercadopago_payment_id` has a unique
 * index and retries update the status of the existing row instead of inserting.
 */
// deno-lint-ignore no-explicit-any
async function recordPayment(supabase: any, row: {
  user_id?: string;
  organization_id?: string | null;
  amount: number;
  currency: string;
  status: string;
  mercadopago_payment_id: string;
  mercadopago_preference_id?: string;
  description: string;
}) {
  const { error } = await supabase
    .from("payments")
    .upsert(row, { onConflict: "mercadopago_payment_id" });
  if (error) console.error("Failed to record payment:", error);
}

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

    // Signature verification. data.id can arrive as a query param (?data.id=)
    // or in the body; the manifest uses the query value when present.
    const url = new URL(req.url);
    const dataIdForSig = url.searchParams.get("data.id") || String(body?.data?.id ?? "");
    if (MERCADOPAGO_WEBHOOK_SECRET) {
      const valid = await verifyMercadoPagoSignature(req, dataIdForSig);
      if (!valid) {
        console.warn("Rejected webhook: invalid signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("MERCADOPAGO_WEBHOOK_SECRET not set — skipping signature verification (insecure).");
    }

    console.log("Webhook received, type:", body?.type);

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
      // Avoid logging the full payment object (contains buyer PII). Log only
      // the non-sensitive fields needed for debugging.
      console.log("Payment fetched:", JSON.stringify({ id: paymentId, status: payment.status }));

      // Parse external reference
      let externalRef: {
        type?: string;
        user_id?: string;
        organization_id?: string;
        plan_type?: string;
        billing_cycle?: "monthly" | "annual";
        first_month_discount?: boolean;
        reservation_id?: string;
        lot_id?: string;
        project_id?: string;
        plan?: string;
        days?: number;
      } | null = null;

      try {
        externalRef = JSON.parse(payment.external_reference || "{}");
      } catch (e) {
        console.error("Failed to parse external reference:", e);
      }

      if (!externalRef) {
        console.error("Invalid external reference");
        return new Response(JSON.stringify({ error: "Invalid external reference" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Handle FEATURED (Home slot destacado) payments
      if (externalRef.type === "featured" && externalRef.project_id && externalRef.days) {
        console.log("Processing featured payment for project:", externalRef.project_id, "status:", payment.status);

        // Server-authoritative pricing — MUST match create-featured-checkout.
        const FEATURED_PRICES: Record<string, number> = {
          "featured-7": 19990,
          "featured-30": 59990,
          "featured-90": 149990,
        };

        if (payment.status === "approved") {
          const expected = externalRef.plan ? FEATURED_PRICES[externalRef.plan] : undefined;
          if (expected !== undefined && Number(payment.transaction_amount) !== expected) {
            console.error("Amount mismatch on featured payment", {
              project_id: externalRef.project_id,
              plan: externalRef.plan,
              expected,
              received: payment.transaction_amount,
            });
            return new Response(JSON.stringify({ received: true, type: "featured", ignored: "amount_mismatch" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }

          // Idempotency: skip if we've already processed this MP payment id.
          const { data: existingPayment } = await supabase
            .from("payments")
            .select("id")
            .eq("mercadopago_payment_id", paymentId.toString())
            .maybeSingle();

          if (!existingPayment) {
            const { error: rpcError } = await supabase.rpc("system_activate_featured", {
              p_project_id: externalRef.project_id,
              p_days: externalRef.days,
              p_payment_ref: `MP #${paymentId}`,
            });
            if (rpcError) {
              console.error("Failed to activate featured:", rpcError);
              return new Response(JSON.stringify({ error: rpcError.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
              });
            }
          }

          await recordPayment(supabase, {
            user_id: externalRef.user_id,
            amount: payment.transaction_amount,
            currency: payment.currency_id,
            status: payment.status,
            mercadopago_payment_id: paymentId.toString(),
            mercadopago_preference_id: payment.preference_id,
            description: `Destacado ${externalRef.days}d — proyecto ${externalRef.project_id}`,
          });
        } else if (payment.status === "refunded" || payment.status === "charged_back") {
          // Money returned: turn off the featured slot immediately.
          await supabase
            .from("projects")
            .update({ featured: false, featured_until: null, updated_at: new Date().toISOString() })
            .eq("id", externalRef.project_id);

          await supabase.from("featured_history").insert({
            project_id: externalRef.project_id,
            action: "deactivated",
            previous_featured: true,
            new_featured: false,
            new_until: null,
            notes: `Reembolso/chargeback MP #${paymentId}`,
            changed_by: null,
          });

          await recordPayment(supabase, {
            user_id: externalRef.user_id,
            amount: payment.transaction_amount,
            currency: payment.currency_id,
            status: payment.status,
            mercadopago_payment_id: paymentId.toString(),
            mercadopago_preference_id: payment.preference_id,
            description: `Destacado ${externalRef.days}d — proyecto ${externalRef.project_id} (reembolso)`,
          });
        }

        return new Response(JSON.stringify({ received: true, type: "featured" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Handle RESERVATION payments
      if (externalRef.type === "reservation" && externalRef.reservation_id) {
        console.log("Processing reservation payment:", externalRef.reservation_id, "status:", payment.status);

        const { data: reservation } = await supabase
          .from("reservations")
          .select("id, status, reservation_amount, expires_at")
          .eq("id", externalRef.reservation_id)
          .maybeSingle();

        if (!reservation) {
          console.error("Reservation not found for webhook:", externalRef.reservation_id);
          // 200 so MercadoPago stops retrying a reference we will never resolve.
          return new Response(JSON.stringify({ received: true, type: "reservation", ignored: "not_found" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        if (payment.status === "approved") {
          // Defense-in-depth: the preference is built server-side, but never
          // mark paid on an amount that doesn't match the reservation.
          if (Number(payment.transaction_amount) !== Number(reservation.reservation_amount)) {
            console.error("Amount mismatch on reservation payment", {
              reservation_id: reservation.id,
              expected: reservation.reservation_amount,
              received: payment.transaction_amount,
            });
            return new Response(JSON.stringify({ received: true, type: "reservation", ignored: "amount_mismatch" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }

          // Idempotent transition: only pending reservations move to paid.
          if (reservation.status === "pending_payment") {
            const { error: updateError } = await supabase
              .from("reservations")
              .update({
                status: "paid",
                mercadopago_payment_id: paymentId.toString(),
                paid_at: new Date().toISOString(),
              })
              .eq("id", reservation.id)
              .eq("status", "pending_payment");

            if (updateError) {
              console.error("Failed to update reservation:", updateError);
            } else {
              console.log("Reservation marked as paid:", reservation.id);
            }
          }

          await recordPayment(supabase, {
            user_id: externalRef.user_id,
            amount: payment.transaction_amount,
            currency: payment.currency_id,
            status: payment.status,
            mercadopago_payment_id: paymentId.toString(),
            mercadopago_preference_id: payment.preference_id,
            description: `Reserva de lote - ID: ${externalRef.lot_id}`
          });
        } else if (payment.status === "in_process" || payment.status === "pending") {
          // Money is in flight (bank transfer / cash point: 1-3 business days).
          // Keep the reservation alive so it doesn't expire mid-payment.
          if (reservation.status === "pending_payment") {
            const extended = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
            if (!reservation.expires_at || reservation.expires_at < extended) {
              await supabase
                .from("reservations")
                .update({ expires_at: extended })
                .eq("id", reservation.id)
                .eq("status", "pending_payment");
              console.log("Reservation expiry extended for in-flight payment:", reservation.id);
            }
          }
        } else if (payment.status === "rejected" || payment.status === "cancelled") {
          // Mark reservation as cancelled if payment failed — but never knock
          // down a reservation that another (approved) payment already paid.
          await supabase
            .from("reservations")
            .update({ status: "cancelled" })
            .eq("id", reservation.id)
            .eq("status", "pending_payment");
        } else if (payment.status === "refunded" || payment.status === "charged_back") {
          // Money came back: cancel the reservation. The DB trigger releases
          // the lot (only while it's still 'reserved', never once sold).
          await supabase
            .from("reservations")
            .update({ status: "cancelled" })
            .eq("id", reservation.id)
            .eq("status", "paid");

          await recordPayment(supabase, {
            user_id: externalRef.user_id,
            amount: payment.transaction_amount,
            currency: payment.currency_id,
            status: payment.status,
            mercadopago_payment_id: paymentId.toString(),
            mercadopago_preference_id: payment.preference_id,
            description: `Reserva de lote - ID: ${externalRef.lot_id}`
          });
        }

        return new Response(JSON.stringify({ received: true, type: "reservation" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Handle subscription payments.
      if (externalRef.user_id && externalRef.plan_type) {
        await recordPayment(supabase, {
          user_id: externalRef.user_id,
          organization_id: externalRef.organization_id ?? null,
          amount: payment.transaction_amount,
          currency: payment.currency_id,
          status: payment.status,
          mercadopago_payment_id: paymentId.toString(),
          mercadopago_preference_id: payment.preference_id,
          description: `Suscripción ${externalRef.plan_type}`,
        });

        const subscriptionScope = (query: ReturnType<typeof supabase.from>) =>
          externalRef.organization_id
            ? query.eq("organization_id", externalRef.organization_id)
            : query.eq("user_id", externalRef.user_id);

        if (payment.status === "refunded" || payment.status === "charged_back") {
          const cancelQuery = supabase.from("subscriptions").update({ status: "cancelled" });
          const { error } = await subscriptionScope(cancelQuery);
          if (error) console.error("Failed to cancel subscription on refund:", error);
        }

        if (payment.status === "approved") {
          const expectedAmounts = expectedSubscriptionAmounts(
            externalRef.plan_type,
            externalRef.billing_cycle,
            externalRef.first_month_discount,
          );
          if (
            expectedAmounts.length > 0
            && !expectedAmounts.includes(Number(payment.transaction_amount))
          ) {
            console.error("Amount mismatch on subscription payment", {
              user_id: externalRef.user_id,
              organization_id: externalRef.organization_id,
              plan_type: externalRef.plan_type,
              expected: expectedAmounts,
              received: payment.transaction_amount,
            });
            return new Response(JSON.stringify({ received: true, ignored: "amount_mismatch" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          const now = new Date();
          const periodEnd = new Date(now);
          if (externalRef.billing_cycle === "annual") {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
          } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
          }

          let existingQuery = supabase.from("subscriptions").select("id");
          existingQuery = subscriptionScope(existingQuery);
          const { data: existingSub } = await existingQuery
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const values = {
            user_id: externalRef.user_id,
            organization_id: externalRef.organization_id ?? null,
            plan_type: externalRef.plan_type,
            status: "active",
            mercadopago_payer_id: payment.payer?.id?.toString(),
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            cancel_at_period_end: false,
          };

          const { error } = existingSub
            ? await supabase.from("subscriptions").update(values).eq("id", existingSub.id)
            : await supabase.from("subscriptions").insert(values);
          if (error) console.error("Failed to activate subscription:", error);

          const paidPlans = new Set([
            "corredor", "corredora", "inmobiliaria", "grupo",
            "starter", "growth", "scale", "enterprise", "professional",
          ]);
          if (paidPlans.has(externalRef.plan_type)) {
            const { data: existingRole } = await supabase
              .from("user_roles")
              .select("id")
              .eq("user_id", externalRef.user_id)
              .eq("role", "agent")
              .maybeSingle();
            if (!existingRole) {
              await supabase.from("user_roles").insert({
                user_id: externalRef.user_id,
                role: "agent",
              });
            }
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
