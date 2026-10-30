import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardAdmin from "./DashboardAdmin";
const state = vi.hoisted(() => ({
  error: null as Error | null,
  retry: vi.fn(),
}));
vi.mock("@/hooks/useDashboardStats", () => ({
  useAdminStats: () => ({
    error: state.error,
    refetch: state.retry,
    data: {
      totalUsers: 10,
      activeListings: 12,
      activeProjects: 3,
      pendingAlerts: 2,
    },
  }),
}));
vi.mock("@/components/dashboard/TodayPanel", () => ({
  default: () => <p>Pendientes verificados</p>,
}));
const Location = () => {
  const location = useLocation();
  return (
    <output data-testid="destination">
      {location.pathname + location.search + location.hash}
    </output>
  );
};
const mount = (path = "/admin/dashboard") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/dashboard" element={<DashboardAdmin />} />
        <Route path="/admin/reservations" element={<Location />} />
      </Routes>
    </MemoryRouter>,
  );
describe("admin operational home", () => {
  beforeEach(() => {
    state.error = null;
    state.retry.mockReset();
  });
  it("links to real managers instead of duplicating user editing and deposit GMV", () => {
    mount();
    expect(
      screen
        .getByRole("link", { name: "Usuarios y roles" })
        .getAttribute("href"),
    ).toBe("/admin/users");
    expect(
      screen
        .getByRole("link", { name: "Comisiones y reglas" })
        .getAttribute("href"),
    ).toBe("/admin/comisiones");
    expect(screen.queryByText("GMV Total")).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Actualizar resumen" }));
    expect(state.retry).toHaveBeenCalledOnce();
  });
  it("hides unverified metrics while leaving functional navigation available", () => {
    state.error = new Error("offline");
    mount();
    expect(screen.getByRole("alert").textContent).toContain(
      "No pudimos verificar",
    );
    expect(screen.queryByText("Usuarios registrados")).toBeNull();
    expect(screen.getByRole("link", { name: "Usuarios y roles" })).toBeTruthy();
  });
  it("returns legacy reservation tabs to the manager without losing project or anchor", () => {
    mount("/admin/dashboard?tab=reservations&project=project-a#pendientes");
    expect(screen.getByTestId("destination").textContent).toBe(
      "/admin/reservations?project=project-a#pendientes",
    );
  });
});
