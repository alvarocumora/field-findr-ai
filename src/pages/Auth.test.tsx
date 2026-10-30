import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import Auth from "./Auth";

const sdk = vi.hoisted(() => ({
  signUp: vi.fn(),
  resend: vi.fn(),
  resetPasswordForEmail: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: vi.fn(),
    signUp: sdk.signUp,
  }),
}));

vi.mock("@/hooks/useSmartRedirect", () => ({
  useSmartRedirect: () => ({
    isLoading: false,
    roles: [],
    refetchRoles: vi.fn(),
  }),
}));

vi.mock("@/integrations/lovable/index", () => ({
  lovable: { auth: { signInWithOAuth: vi.fn() } },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      resend: sdk.resend,
      resetPasswordForEmail: sdk.resetPasswordForEmail,
    },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const renderAuth = (path = "/auth") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Auth />
    </MemoryRouter>,
  );

const fillSignup = async (email = "nueva@x.cl") => {
  fireEvent.keyDown(screen.getByRole("tab", { name: "Registrarse" }), { key: "Enter" });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "secreto123" } });
  fireEvent.click(screen.getByRole("button", { name: "Crear Cuenta" }));
  await waitFor(() => expect(sdk.signUp).toHaveBeenCalled());
};

describe("email confirmation keeps the original destination and gives explicit next steps", () => {
  beforeEach(() => {
    sdk.signUp.mockReset();
    sdk.resend.mockReset();
    window.history.replaceState(null, "", "/auth");
  });

  it("embeds the validated redirect destination in emailRedirectTo instead of a fixed /auth", async () => {
    sdk.signUp.mockResolvedValue({ session: null, error: null });
    renderAuth("/auth?redirect=%2Fp%2Fvalle-escondido-licanten%3Fconsulta%3D1");
    await fillSignup();

    const [, , , emailRedirectPath] = sdk.signUp.mock.calls[0];
    expect(emailRedirectPath).toBe("/auth?redirect=%2Fp%2Fvalle-escondido-licanten%3Fconsulta%3D1");
  });

  it("shows a persistent check-your-email screen with resend instead of only a toast", async () => {
    sdk.signUp.mockResolvedValue({ session: null, error: null });
    renderAuth();
    await fillSignup("persistente@x.cl");

    expect(screen.getByText("Revisa tu correo")).toBeTruthy();
    expect(screen.getByText(/persistente@x\.cl/)).toBeTruthy();

    const resendButton = screen.getByRole("button", { name: /Reenviar en \d+s/ });
    expect(resendButton).toBeDisabled();
  });

  it("detects an expired confirmation link and lets the user request a new one", async () => {
    window.history.replaceState(null, "", "/auth#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired");
    sdk.resend.mockResolvedValue({ error: null });
    renderAuth();

    expect(screen.getByText("Tu enlace de confirmación venció")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "vencido@x.cl" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar nuevo enlace" }));

    await waitFor(() => expect(sdk.resend).toHaveBeenCalledWith({
      type: "signup",
      email: "vencido@x.cl",
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    }));
  });
});
