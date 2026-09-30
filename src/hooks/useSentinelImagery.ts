import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  satelliteBoundsFromLots,
  type SatelliteLotLike,
  type SentinelImageryResult,
} from "@/lib/satellite/sentinel";

interface UseSentinelImageryOptions {
  lots: readonly SatelliteLotLike[];
  center?: { lat: number; lng: number } | null;
  enabled?: boolean;
  maxCloudCover?: number;
  lookbackDays?: number;
}

export const useSentinelImagery = ({
  lots,
  center,
  enabled = true,
  maxCloudCover = 35,
  lookbackDays = 90,
}: UseSentinelImageryOptions) => {
  const bbox = useMemo(
    () => satelliteBoundsFromLots(lots, center),
    [lots, center?.lat, center?.lng],
  );
  const bboxKey = bbox?.map((value) => value.toFixed(5)).join(",") ?? "none";

  return useQuery<SentinelImageryResult | null>({
    queryKey: ["sentinel-imagery", bboxKey, maxCloudCover, lookbackDays],
    enabled: enabled && Boolean(bbox),
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      if (!bbox) return null;
      const response = await supabase.functions.invoke("sentinel-imagery", {
        body: {
          bbox,
          max_cloud_cover: maxCloudCover,
          lookback_days: lookbackDays,
        },
      });

      if (response.error) {
        let message = "No se pudo consultar Sentinel-2";
        const context = (response.error as { context?: Response }).context;
        if (context && typeof context.json === "function") {
          try {
            const body = await context.json();
            message = body?.error || message;
          } catch {
            // keep generic message
          }
        }
        throw new Error(message);
      }

      return response.data as SentinelImageryResult;
    },
  });
};
