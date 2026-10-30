import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { projectImages } from "@/lib/projectCovers";

interface ShowcaseProject {
  id: string;
  slug: string | null;
  name: string;
  city: string | null;
  region: string | null;
  image?: string;
  lat: number | null;
  lng: number | null;
  total: number | null;
  available: number | null;
  inventoryReady: boolean;
  minPrice?: number;
}

/** Quick filters map to real listing `type` values used by /explorar. */
export const QUICK_FILTERS = [
  { label: "Parcelas", type: "parcela_rural" },
  { label: "Campos", type: "campo_agricola" },
  { label: "Industrial", type: "sitio_industrial" },
] as const;

export const useShowcaseProjects = () =>
  useQuery({
    queryKey: ["landing-showcase-projects"],
    queryFn: async (): Promise<ShowcaseProject[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, slug, name, city, region, images, latitude, longitude, total_lots, available_lots, featured, created_at",
        )
        .eq("status", "active")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return Promise.all(
        (data ?? []).map(async (p) => {
          const { data: lots, error: lotsError } = await supabase.rpc(
            "get_public_lots",
            { p_project_id: p.id },
          );
          // Do not present stale project counters as live inventory after an RPC failure.
          const list = (lots ?? []) as Array<{
            price: number | null;
            status: string | null;
          }>;
          const avail = list.filter((l) => l.status === "available");
          const prices = avail
            .map((l) => Number(l.price))
            .filter((n) => Number.isFinite(n) && n > 0);
          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            city: p.city,
            region: p.region,
            image: projectImages(p)[0],
            lat: p.latitude ?? null,
            lng: p.longitude ?? null,
            inventoryReady: !lotsError,
            total: lotsError ? null : list.length,
            available: lotsError ? null : avail.length,
            minPrice:
              !lotsError && prices.length ? Math.min(...prices) : undefined,
          };
        }),
      );
    },
    staleTime: 5 * 60 * 1000,
  });
