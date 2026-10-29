import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { useBrokerMarketProjects } from "./useBrokerMarketProjects";
import type { ReactNode } from "react";

const api = vi.hoisted(() => ({
  filters: [] as string[],
  ranges: [] as number[][],
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "broker" } }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => {
      let filtered = false;
      const chain = {
        select: () => chain,
        eq: () => chain,
        neq: () => chain,
        order: () => chain,
        or: (filter: string) => {
          api.filters.push(filter);
          filtered = true;
          return chain;
        },
        range: async (start: number, end: number) => {
          api.ranges.push([start, end]);
          const rows = Array.from({ length: 31 }, (_, index) => ({
            id: `project-${index + 1}`,
            name: index === 30 ? "Maule único" : `Otro ${index}`,
          }));
          return {
            data: (filtered
              ? rows.filter((row) => row.name.includes("Maule"))
              : rows
            ).slice(start, end + 1),
            error: null,
          };
        },
      };
      return chain;
    },
  },
}));

describe("server-side broker catalog", () => {
  it("paginates in order and searches beyond the first loaded page", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const catalog = renderHook(() => useBrokerMarketProjects(""), { wrapper });
    await waitFor(() => expect(catalog.result.current.isSuccess).toBe(true));
    expect(catalog.result.current.data?.pages[0]).toHaveLength(30);
    await act(async () => {
      await catalog.result.current.fetchNextPage();
    });
    await waitFor(() =>
      expect(catalog.result.current.data?.pages).toHaveLength(2),
    );
    expect(api.ranges).toContainEqual([30, 59]);
    const search = renderHook(() => useBrokerMarketProjects("Maule"), {
      wrapper,
    });
    await waitFor(() => expect(search.result.current.isSuccess).toBe(true));
    expect(search.result.current.data?.pages[0].map((row) => row.id)).toEqual([
      "project-31",
    ]);
    expect(api.filters[0]).toContain("name.ilike.%Maule%");
    catalog.unmount();
    search.unmount();
    client.clear();
  });
});
