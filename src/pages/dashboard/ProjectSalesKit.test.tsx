import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProjectSalesKit from "./ProjectSalesKit";
const state = vi.hoisted(() => ({
  approved: true,
  accessLoading: false,
  organizationId: undefined as string | undefined,
  stockError: null as Error | null,
  enabled: [] as boolean[],
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "broker" } }),
}));
vi.mock("@/hooks/useAccess", () => ({
  useAccess: () => ({
    isLoading: state.accessLoading,
    organization: state.organizationId ? { id: state.organizationId } : null,
    can: (cap: string) => cap !== "inventory.write",
    hasFeature: () => true,
  }),
}));
vi.mock("@/hooks/useWorkspaceScope", () => ({
  withProjectScope: (path: string, id: string) => `${path}?project=${id}`,
}));
vi.mock("@/hooks/useBrokers", () => ({
  useProjectAssignments: () => ({
    data: [
      {
        project_id: "project-1",
        broker_id: "broker",
        status: state.approved ? "approved" : "pending",
        commission_rate: 4,
      },
    ],
  }),
  useMyBrokerProfile: () => ({ data: { invite_code: "broker-code" } }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: { queryKey: string[]; enabled: boolean }) => {
    state.enabled.push(options.enabled);
    if (options.queryKey[0] === "sales-kit-project")
      return {
        data: {
          id: "project-1",
          name: "Proyecto comercial",
          slug: "venta",
          user_id: "owner",
          organization_id: "org-project",
          status: "active",
        },
      };
    return {
      error: state.stockError,
      data: [
        {
          id: "available",
          lot_number: "1",
          status: "available",
          price: 10000000,
          area: 5000,
        },
        {
          id: "reserved",
          lot_number: "2",
          status: "reserved",
          price: 10000000,
          area: 5000,
        },
        {
          id: "no-price",
          lot_number: "3",
          status: "available",
          price: null,
          area: 5000,
        },
      ],
    };
  },
}));
const mount = () =>
  render(
    <MemoryRouter initialEntries={["/asesor/kit-venta/project-1"]}>
      <Routes>
        <Route
          path="/asesor/kit-venta/:projectId"
          element={<ProjectSalesKit />}
        />
      </Routes>
    </MemoryRouter>,
  );
describe("commercial material and inventory", () => {
  beforeEach(() => {
    state.approved = true;
    state.accessLoading = false;
    state.organizationId = undefined;
    state.stockError = null;
    state.enabled = [];
  });
  it("connects material, scoped commissions and a form only for a reservable lot", () => {
    mount();
    expect(
      screen
        .getByRole("link", { name: "Comisiones del proyecto" })
        .getAttribute("href"),
    ).toBe("/asesor/comisiones?project=project-1");
    const material = new URL(
      screen
        .getByRole("link", { name: "Abrir Material y PDF" })
        .getAttribute("href")!,
    );
    expect(material.searchParams.get("tab")).toBe("brochure");
    expect(material.searchParams.get("ref")).toBe("broker-code");
    const links = screen.getAllByRole("link", {
      name: "Abrir formulario de reserva",
    });
    expect(links).toHaveLength(1);
    const form = new URL(links[0].getAttribute("href")!);
    expect(form.searchParams.get("lote")).toBe("available");
    expect(form.searchParams.get("reserva")).toBe("1");
    expect(
      screen.queryByRole("link", { name: "Administrar inventario" }),
    ).toBeNull();
  });
  it("does not enable the inventory query for a pending assignment", () => {
    state.approved = false;
    mount();
    expect(screen.getByText("Necesitas una asignación aprobada")).toBeTruthy();
    expect(state.enabled.at(-1)).toBe(false);
    expect(
      screen.queryByRole("link", { name: "Abrir formulario de reserva" }),
    ).toBeNull();
  });
  it('waits for workspace permissions instead of showing a false denial', () => {
    state.approved = false;
    state.accessLoading = true;
    mount();
    expect(screen.getByLabelText('Cargando kit de venta')).toBeTruthy();
    expect(screen.queryByText('Necesitas una asignación aprobada')).toBeNull();
  });
  it('allows a project-reading member of the active project organization', () => {
    state.approved = false;
    state.organizationId = 'org-project';
    mount();
    expect(screen.getByRole('heading', { name: 'Kit de venta · Proyecto comercial' })).toBeTruthy();
  });
  it('does not treat membership in another organization as project authorization', () => {
    state.approved = false;
    state.organizationId = 'different-org';
    mount();
    expect(screen.getByText('Necesitas una asignación aprobada')).toBeTruthy();
    expect(state.enabled.at(-1)).toBe(false);
  });
  it("offers a social copy generator fed by the real project and broker data", () => {
    mount();
    expect(screen.getByText("Copy para redes sociales")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Generar copy con IA" })).toBeTruthy();
  });
  it("does not present failed inventory as available or empty", () => {
    state.stockError = new Error("offline");
    mount();
    expect(screen.getByRole("alert").textContent).toContain(
      "No pudimos consultar el inventario",
    );
    expect(
      screen.queryByRole("link", { name: "Abrir formulario de reserva" }),
    ).toBeNull();
  });
});
