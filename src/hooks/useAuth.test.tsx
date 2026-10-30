import { useQuery } from '@tanstack/react-query';
import IdentityQueryBoundary from '@/components/auth/IdentityQueryBoundary';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./useAuth";
import {
  saveReservationDraft,
  readReservationDraft,
} from "@/lib/reservationDraft";
const sdk = vi.hoisted(() => ({
  getSession: vi.fn(),
  signOut: vi.fn(),
  listen: null as null | ((event: string, session: Session | null) => void),
  toast: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (callback: typeof sdk.listen) => {
        sdk.listen = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      getSession: sdk.getSession,
      signOut: sdk.signOut,
    },
  },
}));
vi.mock("sonner", () => ({ toast: { error: sdk.toast } }));
const session = (id: string) => ({ user: { id } }) as Session;
function Probe() {
  const auth = useAuth();
  const [result, setResult] = useState("idle");
  return (
    <>
      <p>{auth.loading ? "loading" : auth.user?.id || "guest"}</p>
      <p>{result}</p>
      <button
        onClick={async () => {
          const response = await auth.signOut();
          setResult(response.error ? "logout-error" : "logout-success");
        }}
      >
        Salir
      </button>
    </>
  );
}
const mount = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
const draft = {
  lotId: "lot",
  firstName: "Private",
  lastName: "Fixture",
  email: "test@example.test",
  phone: "12345678",
};
describe("auth event ordering and logout", () => {
  beforeEach(() => {
    sdk.getSession.mockReset();
    sdk.signOut.mockReset();
    sdk.toast.mockReset();
    sessionStorage.clear();
    sdk.listen = null;
  });
  it("does not restore a stale initial session after a newer logout event", async () => {
    let resolve!: (value: unknown) => void;
    sdk.getSession.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    mount();
    act(() => {
      sdk.listen!("SIGNED_OUT", null);
    });
    await act(async () => {
      resolve({ data: { session: session("old-account") }, error: null });
    });
    expect(screen.getByText("guest")).toBeTruthy();
    expect(screen.queryByText("old-account")).toBeNull();
  });
  it("preserves guest reservation data at login and clears it when leaving an account", async () => {
    sdk.getSession.mockResolvedValue({ data: { session: null }, error: null });
    mount();
    await screen.findByText("guest");
    saveReservationDraft(draft);
    act(() => {
      sdk.listen!("SIGNED_IN", session("account-A"));
    });
    expect(readReservationDraft("lot")).toEqual(draft);
    act(() => {
      sdk.listen!("SIGNED_IN", session("account-B"));
    });
    expect(readReservationDraft("lot")).toBeNull();
  });
  it("returns logout failure without falsely changing identity or losing the form", async () => {
    sdk.getSession.mockResolvedValue({
      data: { session: session("account-A") },
      error: null,
    });
    sdk.signOut.mockResolvedValue({ error: new Error("network") });
    mount();
    await screen.findByText("account-A");
    saveReservationDraft(draft);
    fireEvent.click(screen.getByRole("button", { name: "Salir" }));
    await screen.findByText("logout-error");
    expect(screen.getByText("account-A")).toBeTruthy();
    expect(readReservationDraft("lot")).toEqual(draft);
    expect(sdk.toast).toHaveBeenCalledOnce();
  });
  it("settles an initial read failure and catches rejected logout requests", async () => {
    sdk.getSession.mockRejectedValue(new Error("storage unavailable"));
    sdk.signOut.mockRejectedValue(new Error("offline"));
    mount();
    await screen.findByText("guest");
    fireEvent.click(screen.getByRole("button", { name: "Salir" }));
    await waitFor(() => expect(screen.getByText("logout-error")).toBeTruthy());
  });
  it('integrates auth events and query rotation without showing cached data from A to B', async () => {
    sdk.getSession.mockResolvedValue({ data: { session: session('account-A') }, error: null });
    function PrivateData() {
      const { user } = useAuth();
      const result = useQuery({ queryKey: ['shared-private-integration'], enabled: !!user, queryFn: async () => user?.id });
      return <p>{result.data ? `private:${result.data}` : 'no-private-data'}</p>;
    }
    render(<AuthProvider><IdentityQueryBoundary><PrivateData /></IdentityQueryBoundary></AuthProvider>);
    await screen.findByText('private:account-A');
    act(() => { sdk.listen!('SIGNED_IN', session('account-B')); });
    expect(screen.queryByText('private:account-A')).toBeNull();
    await screen.findByText('private:account-B');
  });

});
