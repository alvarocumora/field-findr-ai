import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ReservationRequest {
  lot_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  buyer_rut?: string;
  reservation_amount?: number;
  notes?: string;
  source_quote_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: ReservationRequest = await req.json();
    const { lot_id, buyer_name, buyer_email, buyer_phone, buyer_rut, notes, source_quote_id } = body;
    if (!lot_id || !buyer_name || !buyer_email) {
      return new Response(JSON.stringify({ error: "Missing required fields: lot_id, buyer_name, buyer_email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: lot, error: lotError } = await supabase
      .from("lots")
      .select(`id, lot_number, area, price, status, project_id, projects (id, name, user_id, reservation_deposit)`)
      .eq("id", lot_id)
      .single();

    if (lotError || !lot) {
      return new Response(JSON.stringify({ error: "Lot not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reservation_amount = Number((lot as any).projects?.reservation_deposit) || 500000;
    if (!(reservation_amount > 0)) {
      return new Response(JSON.stringify({ error: "Invalid reservation amount configuration" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (lot.status !== "available") {
      return new Response(JSON.stringify({ error: "Lot is not available for reservation" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingReservation } = await supabase
      .from("reservations")
      .select("id")
      .eq("lot_id", lot_id)
      .eq("status", "pending_payment")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existingReservation) {
      return new Response(JSON.stringify({ error: "Lot already has a pending reservation" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (source_quote_id) {
      const { data: quote } = await supabase
        .from("sales_quotes")
        .select("id, lot_id, agent_id")
        .eq("id", source_quote_id)
        .eq("lot_id", lot_id)
        .eq("agent_id", user.id)
        .maybeSingle();
      if (!quote) {
        return new Response(JSON.stringify({ error: "Invalid source quote" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .insert({
        lot_id,
        user_id: user.id,
        buyer_name,
        buyer_email,
        buyer_phone,
        buyer_rut,
        reservation_amount,
        status: "pending_payment",
        expires_at: expiresAt.toISOString(),
        notes,
        source_quote_id: source_quote_id || null,
      })
      .select()
      .single();

    if (reservationError) {
      console.error("Error creating reservation:", reservationError);
      const conflict =
        reservationError.code === "23505"
        || /active reservation|already has a pending reservation/i.test(reservationError.message ?? "");
      return new Response(JSON.stringify({
        error: conflict
          ? "Lot already has an active reservation"
          : "Failed to create reservation",
      }), {
        status: conflict ? 409 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!MERCADOPAGO_ACCESS_TOKEN) {
      return new Response(JSON.stringify({
        reservation,
        message: "Reservation created. Payment processing not configured.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const projectName = (lot as any).projects?.name || "Proyecto";
    const preferenceData = {
      items: [{
        id: reservation.id,
        title: `Reserva Lote ${lot.lot_number} - ${projectName}`,
        description: `Señal de reserva para Lote ${lot.lot_number} (${lot.area} m²)`,
        quantity: 1,
        currency_id: "CLP",
        unit_price: reservation_amount,
      }],
      payer: {
        name: buyer_name,
        email: buyer_email,
        phone: buyer_phone ? { number: buyer_phone } : undefined,
      },
      external_reference: JSON.stringify({
        type: "reservation",
        reservation_id: reservation.id,
        lot_id,
        user_id: user.id,
        source_quote_id: source_quote_id || null,
      }),
      back_urls: {
        success: `${req.headers.get("origin")}/reserva/exito?reservation_id=${reservation.id}`,
        failure: `${req.headers.get("origin")}/reserva/error?reservation_id=${reservation.id}`,
        pending: `${req.headers.get("origin")}/reserva/pendiente?reservation_id=${reservation.id}`,
      },
      auto_return: "approved",
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: expiresAt.toISOString(),
      notification_url: `${SUPABASE_URL}/functions/v1/mercadopago-webhook`,
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferenceData),
    });

    if (!mpResponse.ok) {
      console.error("MercadoPago error:", await mpResponse.text());
      await supabase.from("reservations").update({ status: "cancelled" }).eq("id", reservation.id);
      return new Response(JSON.stringify({ error: "No pudimos generar el link de pago. Intenta nuevamente." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpPreference = await mpResponse.json();
    const paymentUrl = mpPreference.init_point as string;

    await supabase
      .from("reservations")
      .update({ mercadopago_preference_id: mpPreference.id, payment_url: paymentUrl })
      .eq("id", reservation.id);

    return new Response(JSON.stringify({
      reservation: {
        ...reservation,
        mercadopago_preference_id: mpPreference.id,
        payment_url: paymentUrl,
      },
      payment_url: paymentUrl,
      sandbox_url: mpPreference.sandbox_init_point,
      expires_at: expiresAt.toISOString(),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});