// Gestión del equipo de una organización (inmobiliaria/corredora):
// invitar miembros, removerlos y cambiar su rol interno, con enforcement
// de asientos según el plan del dueño. Caller: dueño de la org o miembro
// con rol interno 'admin'. Usa service role para auth.admin e inserciones.
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Réplica server-side de PLAN_DETAILS.teamSeats (src/hooks/useSubscription.ts)
// y del mapeo legacy de normalizePlanId. null = ilimitado.
const LEGACY_PLAN_MAP: Record<string, string> = {
  starter: "corredora",
  growth: "inmobiliaria",
  scale: "grupo",
};
const TEAM_SEATS: Record<string, number | null> = {
  free: 1,
  corredor: 1,
  corredora: 3,
  inmobiliaria: 8,
  grupo: 25,
  enterprise: null,
};

const seatsForPlan = (planType: string | null | undefined): number | null => {
  const normalized = LEGACY_PLAN_MAP[planType ?? ""] ?? planType ?? "free";
  return normalized in TEAM_SEATS ? TEAM_SEATS[normalized] : 1;
};

const ActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("invite"),
    email: z.string().email().max(255),
    first_name: z.string().max(100).optional(),
    last_name: z.string().max(100).optional(),
    org_role: z.enum(["admin", "member"]).default("member"),
  }),
  z.object({ action: z.literal("remove"), member_user_id: z.string().uuid() }),
  z.object({
    action: z.literal("set_role"),
    member_user_id: z.string().uuid(),
    org_role: z.enum(["admin", "member"]),
  }),
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const caller = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await caller.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const callerId = claims.claims.sub as string;

    const parsed = ActionSchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
    const body = parsed.data;

    const admin = createClient(SUPABASE_URL, SERVICE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Resolver la organización del caller y su nivel de permiso.
    const { data: ownedOrg, error: ownedErr } = await admin
      .from("organizations")
      .select("id, owner_id, name")
      .eq("owner_id", callerId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (ownedErr) return json({ error: ownedErr.message }, 500);

    let org = ownedOrg;
    let callerIsOwner = !!ownedOrg;

    if (!org) {
      const { data: membership, error: memErr } = await admin
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", callerId)
        .in("role", ["owner", "admin"])
        .limit(1)
        .maybeSingle();
      if (memErr) return json({ error: memErr.message }, 500);
      if (membership) {
        const { data: memberOrg } = await admin
          .from("organizations")
          .select("id, owner_id, name")
          .eq("id", membership.organization_id)
          .maybeSingle();
        org = memberOrg;
        callerIsOwner = memberOrg?.owner_id === callerId;
      }
    }

    if (!org) return json({ error: "No tienes una organización o permisos para administrarla" }, 403);

    const audit = async (action: string, details: unknown) => {
      await admin.from("audit_logs").insert({
        user_id: callerId,
        action,
        entity_type: "organization",
        entity_id: org!.id,
        details: details as Record<string, unknown>,
      });
    };

    // Miembros actuales (para asientos y validaciones)
    const { data: members, error: membersErr } = await admin
      .from("organization_members")
      .select("user_id, role")
      .eq("organization_id", org.id);
    if (membersErr) return json({ error: membersErr.message }, 500);
    const memberList = members ?? [];

    switch (body.action) {
      case "invite": {
        // Enforcement de asientos según el plan del DUEÑO de la org.
        const { data: sub } = await admin
          .from("subscriptions")
          .select("plan_type")
          .eq("user_id", org.owner_id)
          .eq("status", "active")
          .maybeSingle();
        const seats = seatsForPlan(sub?.plan_type);
        // El dueño ocupa asiento aunque no tenga fila de miembro.
        const seatUsers = new Set(memberList.map((m) => m.user_id));
        seatUsers.add(org.owner_id);
        if (seats !== null && seatUsers.size >= seats) {
          return json(
            { error: `Alcanzaste el límite de ${seats} asientos de tu plan. Mejora tu plan para invitar más miembros.` },
            400,
          );
        }

        // ¿Existe ya un usuario con ese email?
        const { data: existingProfile } = await admin
          .from("profiles")
          .select("user_id")
          .eq("email", body.email)
          .maybeSingle();

        let invitedUserId = existingProfile?.user_id as string | undefined;

        if (invitedUserId && seatUsers.has(invitedUserId)) {
          return json({ error: "Esa persona ya es parte de tu equipo" }, 400);
        }

        if (!invitedUserId) {
          const origin = req.headers.get("origin") ?? undefined;
          const { data, error } = await admin.auth.admin.inviteUserByEmail(body.email, {
            data: {
              first_name: body.first_name,
              last_name: body.last_name,
              account_type: "agent",
              invited_to_org: org.id,
            },
            redirectTo: origin ? `${origin}/auth` : undefined,
          });
          if (error) return json({ error: error.message }, 400);
          invitedUserId = data.user?.id;
          if (!invitedUserId) return json({ error: "No se pudo crear la invitación" }, 500);
          // Asegurar rol agente aunque handle_new_user no corra para invitados.
          await admin
            .from("user_roles")
            .upsert({ user_id: invitedUserId, role: "agent" }, { onConflict: "user_id,role" });
        }

        const { error: insertErr } = await admin
          .from("organization_members")
          .upsert(
            { organization_id: org.id, user_id: invitedUserId, role: body.org_role },
            { onConflict: "organization_id,user_id" },
          );
        if (insertErr) return json({ error: insertErr.message }, 400);

        await audit("team.member_invited", { email: body.email, org_role: body.org_role, user_id: invitedUserId });
        return json({ ok: true, user_id: invitedUserId });
      }

      case "remove": {
        if (body.member_user_id === org.owner_id) {
          return json({ error: "No puedes remover al dueño de la organización" }, 400);
        }
        const target = memberList.find((m) => m.user_id === body.member_user_id);
        if (!target) return json({ error: "Esa persona no es miembro de tu equipo" }, 404);
        // Solo el dueño puede remover a un admin interno.
        if (target.role === "admin" && !callerIsOwner) {
          return json({ error: "Solo el dueño puede remover a un administrador" }, 403);
        }
        const { error } = await admin
          .from("organization_members")
          .delete()
          .eq("organization_id", org.id)
          .eq("user_id", body.member_user_id);
        if (error) return json({ error: error.message }, 400);

        await audit("team.member_removed", { user_id: body.member_user_id });
        return json({ ok: true });
      }

      case "set_role": {
        if (body.member_user_id === org.owner_id) {
          return json({ error: "El rol del dueño no se puede cambiar" }, 400);
        }
        // Solo el dueño otorga o revoca el rol de administrador interno.
        if (!callerIsOwner) {
          return json({ error: "Solo el dueño puede cambiar roles" }, 403);
        }
        const target = memberList.find((m) => m.user_id === body.member_user_id);
        if (!target) return json({ error: "Esa persona no es miembro de tu equipo" }, 404);

        const { error } = await admin
          .from("organization_members")
          .update({ role: body.org_role })
          .eq("organization_id", org.id)
          .eq("user_id", body.member_user_id);
        if (error) return json({ error: error.message }, 400);

        await audit("team.role_changed", { user_id: body.member_user_id, org_role: body.org_role });
        return json({ ok: true });
      }
    }
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
