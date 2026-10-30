import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { useAdminStats } from "./useDashboardStats";
const state = vi.hoisted(() => ({
  failingTable: "",
  count: 0 as number | null,
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "admin-a" } }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: () => query,
        in: () => query,
        then: (resolve: (value: unknown) => void) =>
          Promise.resolve({
            count: state.count,
            error:
              table === state.failingTable ? new Error("unavailable") : null,
          }).then(resolve),
      };
      return query;
    },
  },
}));
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, ...renderHook(() => useAdminStats(), { wrapper }) };
}
describe("admin exact counts", () => {
  beforeEach(() => {
    state.failingTable = "";
    state.count = 0;
  });
  it("accepts verified zero counts and scopes cached metrics to the administrator", async () => {
    const { result, client, unmount } = setup();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData(["admin-stats", "admin-a"])).toMatchObject({
      totalUsers: 0,
      activeProjects: 0,
    });
    unmount();
    client.clear();
  });
  it("rejects the whole summary if one source fails instead of presenting partial zeros", async () => {
    state.failingTable = "transaction_documents";
    const { result, client, unmount } = setup();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    unmount();
    client.clear();
  });
  it("does not treat an absent exact count as a verified empty platform", async () => {
    state.count = null;
    const { result, client, unmount } = setup();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    unmount();
    client.clear();
  });
});
