import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, x-supabase-client-platform, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// ── Elevation (Open-Elevation) ──────────────────────────────────────────────
async function getElevation(lat: number, lng: number) {
  const res = await fetch(
    `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`
  );
  if (!res.ok) throw new Error(`Open-Elevation error: ${res.status}`);
  const data = await res.json();
  return { elevation: data.results?.[0]?.elevation ?? null };
}

// ── Climate (Open-Meteo) ────────────────────────────────────────────────────
async function getClimate(lat: number, lng: number) {
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  // Last full year of data
  url.searchParams.set("start_date", "2024-01-01");
  url.searchParams.set("end_date", "2024-12-31");
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,sunshine_duration"
  );
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
  const data = await res.json();

  const daily = data.daily;
  if (!daily?.temperature_2m_max) return null;

  const avgMax =
    daily.temperature_2m_max.reduce((s: number, v: number | null) => s + (v ?? 0), 0) /
    daily.temperature_2m_max.filter((v: number | null) => v !== null).length;
  const avgMin =
    daily.temperature_2m_min.reduce((s: number, v: number | null) => s + (v ?? 0), 0) /
    daily.temperature_2m_min.filter((v: number | null) => v !== null).length;
  const totalRain = daily.precipitation_sum.reduce(
    (s: number, v: number | null) => s + (v ?? 0),
    0
  );
  const totalSunHours =
    daily.sunshine_duration
      .filter((v: number | null) => v !== null)
      .reduce((s: number, v: number) => s + v, 0) / 3600; // seconds → hours

  return {
    avgTempMax: Math.round(avgMax * 10) / 10,
    avgTempMin: Math.round(avgMin * 10) / 10,
    annualRainMm: Math.round(totalRain),
    annualSunHours: Math.round(totalSunHours),
  };
}

// ── POIs (Overpass / OpenStreetMap) ──────────────────────────────────────────
async function getPOIs(lat: number, lng: number, radiusM = 2000) {
  const query = `
[out:json][timeout:10];
(
  node["amenity"~"school|hospital|clinic|pharmacy|supermarket|bank|fuel|restaurant|cafe"](around:${radiusM},${lat},${lng});
  node["shop"~"supermarket|convenience"](around:${radiusM},${lat},${lng});
  node["public_transport"="stop_position"](around:${radiusM},${lat},${lng});
);
out body 50;
`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
  const data = await res.json();

  const categories: Record<string, { name: string; type: string; distance: number }[]> = {};

  for (const el of data.elements ?? []) {
    const tags = el.tags ?? {};
    const name = tags.name || tags.amenity || tags.shop || "Sin nombre";
    const type = tags.amenity || tags.shop || tags.public_transport || "otro";

    // Haversine distance
    const R = 6371000;
    const dLat = ((el.lat - lat) * Math.PI) / 180;
    const dLng = ((el.lon - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((el.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const dist = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

    const category = categorize(type);
    if (!categories[category]) categories[category] = [];
    categories[category].push({ name, type, distance: dist });
  }

  // Sort each category by distance
  for (const cat of Object.keys(categories)) {
    categories[cat].sort((a, b) => a.distance - b.distance);
    categories[cat] = categories[cat].slice(0, 5);
  }

  return categories;
}

function categorize(type: string): string {
  if (["school", "university", "kindergarten"].includes(type)) return "educacion";
  if (["hospital", "clinic", "pharmacy", "doctors"].includes(type)) return "salud";
  if (["supermarket", "convenience"].includes(type)) return "comercio";
  if (["restaurant", "cafe", "fast_food"].includes(type)) return "gastronomia";
  if (["bank", "atm"].includes(type)) return "finanzas";
  if (["fuel"].includes(type)) return "combustible";
  if (["stop_position", "bus_stop"].includes(type)) return "transporte";
  return "otro";
}

// ── Geocoding (Nominatim) ───────────────────────────────────────────────────
async function reverseGeocode(lat: number, lng: number) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
    {
      headers: {
        "User-Agent": "OfertaTerrenos/1.0 (contact@ofertaterrenos.cl)",
      },
    }
  );
  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
  const data = await res.json();

  return {
    displayName: data.display_name ?? null,
    road: data.address?.road ?? null,
    suburb: data.address?.suburb ?? data.address?.neighbourhood ?? null,
    city: data.address?.city ?? data.address?.town ?? data.address?.village ?? null,
    state: data.address?.state ?? null,
    country: data.address?.country ?? null,
    postcode: data.address?.postcode ?? null,
  };
}

// ── Main handler ────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng, services } = await req.json();

    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(
        JSON.stringify({ error: "lat and lng are required numbers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const requestedServices: string[] = services ?? [
      "elevation",
      "climate",
      "pois",
      "geocode",
    ];

    const results: Record<string, unknown> = {};
    const errors: Record<string, string> = {};

    // Run requested services in parallel
    const tasks: Promise<void>[] = [];

    if (requestedServices.includes("elevation")) {
      tasks.push(
        getElevation(lat, lng)
          .then((r) => { results.elevation = r; })
          .catch((e) => { errors.elevation = e.message; })
      );
    }

    if (requestedServices.includes("climate")) {
      tasks.push(
        getClimate(lat, lng)
          .then((r) => { results.climate = r; })
          .catch((e) => { errors.climate = e.message; })
      );
    }

    if (requestedServices.includes("pois")) {
      tasks.push(
        getPOIs(lat, lng)
          .then((r) => { results.pois = r; })
          .catch((e) => { errors.pois = e.message; })
      );
    }

    if (requestedServices.includes("geocode")) {
      tasks.push(
        reverseGeocode(lat, lng)
          .then((r) => { results.geocode = r; })
          .catch((e) => { errors.geocode = e.message; })
      );
    }

    await Promise.all(tasks);

    return new Response(
      JSON.stringify({ success: true, data: results, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
