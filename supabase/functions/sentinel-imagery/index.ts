import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { clientIp, rateLimit, tooManyRequests } from "../_shared/rateLimit.ts";
import {
  averageCloudCover,
  selectLatestSentinelPass,
  type SentinelStacFeature,
} from "../_shared/sentinel.ts";

const STAC_SEARCH_URL = "https://planetarycomputer.microsoft.com/api/stac/v1/search";
const COLLECTION = "sentinel-2-l2a";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SentinelRequest {
  bbox?: number[];
  max_cloud_cover?: number;
  lookback_days?: number;
}

const validBbox = (bbox: unknown): bbox is [number, number, number, number] => {
  if (!Array.isArray(bbox) || bbox.length !== 4 || !bbox.every(Number.isFinite)) return false;
  const [west, south, east, north] = bbox as number[];
  return (
    west >= -180 && east <= 180 && south >= -85 && north <= 85
    && west < east && south < north
    && east - west <= 2 && north - south <= 2
  );
};

const searchStac = async (
  bbox: [number, number, number, number],
  fromIso: string,
  toIso: string,
): Promise<SentinelStacFeature[]> => {
  const payload: Record<string, unknown> = {
    collections: [COLLECTION],
    bbox,
    datetime: fromIso + "/" + toIso,
    limit: 200,
  };

  const response = await fetch(STAC_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "OfertaTerrenos-Sentinel/1.0",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Planetary Computer STAC search failed: " + response.status);
  }

  const body = await response.json() as { features?: SentinelStacFeature[] };
  return Array.isArray(body.features) ? body.features : [];
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!rateLimit("sentinel-imagery:" + clientIp(req), { limit: 120, windowMs: 60_000 })) {
    return tooManyRequests(corsHeaders);
  }

  try {
    const body = await req.json() as SentinelRequest;
    if (!validBbox(body.bbox)) {
      return new Response(JSON.stringify({ error: "bbox must be [west,south,east,north] within a 2 degree span" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const maxCloudCover = Math.min(Math.max(Number(body.max_cloud_cover ?? 35), 0), 100);
    const lookbackDays = Math.min(Math.max(Math.round(Number(body.lookback_days ?? 90)), 7), 365);
    const searchedTo = new Date();
    const searchedFrom = new Date(searchedTo.getTime() - lookbackDays * 86_400_000);

    // Query the complete set of intersecting granules first. Cloud cover is
    // used only to choose the anchor pass; adjacent granules are retained even
    // when one tile is cloudier so projects at Sentinel tile edges stay whole.
    const features = await searchStac(
      body.bbox,
      searchedFrom.toISOString(),
      searchedTo.toISOString(),
    );
    const scenes = selectLatestSentinelPass(features, maxCloudCover);

    const responseBody = {
      provider: "Microsoft Planetary Computer",
      collection: COLLECTION,
      available: scenes.length > 0,
      bbox: body.bbox,
      acquisition_datetime: scenes[0]?.datetime ?? null,
      cloud_cover: averageCloudCover(scenes),
      scenes,
      searched_from: searchedFrom.toISOString(),
      searched_to: searchedTo.toISOString(),
    };

    return new Response(JSON.stringify(responseBody), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=900, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Sentinel imagery lookup failed", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Sentinel imagery lookup failed",
    }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
