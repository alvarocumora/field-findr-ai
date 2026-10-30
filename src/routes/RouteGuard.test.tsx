import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import RouteGuard from "./RouteGuard";

const state = vi.hoisted(() => ({ refetchRoles: vi.fn() }));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" }, loading: false }),
}));

vi.mock("@/hooks/useSmartRedirect", () => ({
  useSmartRedirect: () => ({
    isAdmin: false,
    isAgent: false,
    isLoading: false,
    isError: true,
    refetchRoles: state.refetchRoles,
  }),
}));

describe("role verification failure is not a denial", () => {
  it("offers retry instead of claiming the agent role is missing", () => {
    render(
      <MemoryRouter initialEntries={["/asesor/mi-negocio"]}>
        <RouteGuard access="agent" layout="none" />
      </MemoryRouter>,
    );

    expect(screen.queryByText("Acceso denegado")).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain(
      "No pudimos verificar tus permisos",
    );

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(state.refetchRoles).toHaveBeenCalledOnce();
  });
});
