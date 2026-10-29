import { useEffect, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sanitizeSearchTerm } from "@/hooks/useInfiniteListings";

export interface MarketProject {
  id: string;
  name: string;
  location: string | null;
  region: string | null;
  city: string | null;
  country: string | null;
  images: string[] | null;
  user_id: string;
  slug: string | null;
}
const fields = "id,name,location,region,city,country,images,user_id,slug";
const PAGE_SIZE = 30;

export function useBrokerMarketProjects(search: string) {
  const { user } = useAuth();
  const [term, setTerm] = useState(sanitizeSearchTerm(search));
  useEffect(() => {
    const timer = setTimeout(() => setTerm(sanitizeSearchTerm(search)), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useInfiniteQuery({
    queryKey: ["broker-market-projects", user?.id, term],
    enabled: !!user,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from("projects")
        .select(fields)
        .eq("status", "active")
        .neq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: true });
      if (term) {
        const pattern = `%${term}%`;
        query = query.or(
          `name.ilike.${pattern},location.ilike.${pattern},region.ilike.${pattern},city.ilike.${pattern}`,
        );
      }
      const { data, error } = await query.range(
        pageParam,
        pageParam + PAGE_SIZE - 1,
      );
      if (error) throw error;
      return (data ?? []) as MarketProject[];
    },
    getNextPageParam: (last, pages) =>
      last.length === PAGE_SIZE ? pages.length * PAGE_SIZE : undefined,
  });
  return { ...query, isSearchPending: sanitizeSearchTerm(search) !== term };
}

/** Assigned projects do not depend on the catalog search, active status or loaded pages. */
export function useAssignedMarketProjects(ids: string[]) {
  const { user } = useAuth();
  const uniqueIds = [...new Set(ids)].sort();
  return useQuery({
    queryKey: ["assigned-market-projects", user?.id, uniqueIds],
    enabled: !!user && uniqueIds.length > 0,
    queryFn: async () => {
      const rows: MarketProject[] = [];
      for (let index = 0; index < uniqueIds.length; index += 100) {
        const { data, error } = await supabase
          .from("projects")
          .select(fields)
          .in("id", uniqueIds.slice(index, index + 100));
        if (error) throw error;
        rows.push(...((data ?? []) as MarketProject[]));
      }
      return rows;
    },
  });
}
