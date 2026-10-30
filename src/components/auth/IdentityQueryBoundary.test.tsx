import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import IdentityQueryBoundary from "./IdentityQueryBoundary";
const state = vi.hoisted(() => ({ identity: "account-A" as string | null }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: state.identity ? { id: state.identity } : null }),
}));
const clients = new Map<string, QueryClient>();
function Probe() {
  const client = useQueryClient();
  clients.set(state.identity ?? "guest", client);
  const [draft, setDraft] = useState("");
  const data = useQuery({
    queryKey: ["private-shared-key"],
    enabled: !!state.identity,
    queryFn: async () => state.identity,
  });
  return (
    <>
      <p>{data.data ?? "no-private-data"}</p>
      <input
        aria-label="Public draft"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
    </>
  );
}
const tree = () => (
  <IdentityQueryBoundary>
    <Probe />
  </IdentityQueryBoundary>
);
describe("identity data boundary", () => {
  beforeEach(() => {
    state.identity = "account-A";
    clients.clear();
  });
  it("does not show A to B, including a late callback writing to the old client", async () => {
    const view = render(tree());
    await screen.findByText("account-A");
    const old = clients.get("account-A")!;
    state.identity = "account-B";
    view.rerender(tree());
    expect(screen.queryByText("account-A")).toBeNull();
    await screen.findByText("account-B");
    expect(clients.get("account-B")).not.toBe(old);
    act(() => {
      old.setQueryData(["private-shared-key"], "late-A");
    });
    expect(screen.getByText("account-B")).toBeTruthy();
    expect(screen.queryByText("late-A")).toBeNull();
    old.clear();
  });
  it("replaces the client on logout before admitting another account", async () => {
    const view = render(tree());
    await screen.findByText("account-A");
    const old = clients.get("account-A");
    state.identity = null;
    view.rerender(tree());
    expect(screen.getByText("no-private-data")).toBeTruthy();
    expect(clients.get("guest")).not.toBe(old);
    state.identity = "account-B";
    view.rerender(tree());
    await screen.findByText("account-B");
    expect(clients.get("account-B")?.getQueryData(["private-shared-key"])).toBe(
      "account-B",
    );
  });
  it("keeps forms and cached data during a refresh of the same identity", async () => {
    const view = render(tree());
    await screen.findByText("account-A");
    const current = clients.get("account-A");
    fireEvent.change(screen.getByLabelText("Public draft"), {
      target: { value: "form in progress" },
    });
    view.rerender(tree());
    expect(clients.get("account-A")).toBe(current);
    expect(screen.getByLabelText("Public draft")).toHaveValue(
      "form in progress",
    );
  });
  it("preserves anonymous forms and listeners through guest login without prior private data", async () => {
    state.identity = null;
    const view = render(tree());
    const guest = clients.get("guest");
    fireEvent.change(screen.getByLabelText("Public draft"), {
      target: { value: "reservation draft" },
    });
    state.identity = "account-A";
    view.rerender(tree());
    await waitFor(() => expect(screen.getByText("account-A")).toBeTruthy());
    expect(clients.get("account-A")).toBe(guest);
    expect(screen.getByLabelText("Public draft")).toHaveValue(
      "reservation draft",
    );
  });
});
