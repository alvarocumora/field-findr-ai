import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BrokerMarketplace from "./BrokerMarketplace";

const state = vi.hoisted(() => ({
  error: null as Error | null,
  status: "" as string,
  retry: vi.fn(),
  request: vi.fn(),
}));
const project = {
  id: "project-1",
  name: "Proyecto para vender",
  slug: "proyecto-venta",
  city: "Hualañé",
  region: "Maule",
  user_id: "owner",
  images: [],
};
const query = (data: unknown) => ({
  data,
  isLoading: false,
  error: state.error,
  refetch: state.retry,
});
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "broker" } }),
}));
vi.mock("@/hooks/useAccess", () => ({
  useAccess: () => ({
    context: "broker",
    isAgent: true,
    isAdmin: false,
    can: () => true,
    hasFeature: () => true,
  }),
}));
vi.mock("@/hooks/useBrokerMarketProjects", () => ({
  useBrokerMarketProjects: () => ({
    ...query({ pages: [[project]] }),
    hasNextPage: false,
    isSearchPending: false,
  }),
  useAssignedMarketProjects: () => query([project]),
}));
vi.mock("@/hooks/useBrokers", () => ({
  useProjectAssignments: () =>
    query(
      state.status
        ? [
            {
              id: "assignment-1",
              project_id: "project-1",
              broker_id: "broker",
              owner_id: "owner",
              commission_rate: 4,
              status: state.status,
            },
          ]
        : [],
    ),
  useMyBrokerProfile: () => query({ invite_code: "my-code" }),
  useRequestProjectAssignment: () => ({ mutate: state.request }),
  useDecideAssignment: () => ({ mutate: vi.fn() }),
}));
vi.mock("@/hooks/useAdminCommissions", () => ({
  useCommissionRules: () => query([]),
}));
const Location = () => (
  <output data-testid="location">{useLocation().search}</output>
);
const mount = (search = "") =>
  render(
    <MemoryRouter initialEntries={["/asesor/proyectos-en-venta" + search]}>
      <BrokerMarketplace />
      <Location />
    </MemoryRouter>,
  );

describe("broker sales journey", () => {
  beforeEach(() => {
    state.error = null;
    state.status = "";
    state.retry.mockReset();
    state.request.mockReset();
  });
  it("does not invent a rate or minimum and requests an actual project", () => {
    mount();
    expect(screen.getByText("Comisión por acordar")).toBeTruthy();
    expect(screen.queryByText(/500.000/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Solicitar venta" }));
    expect(state.request).toHaveBeenCalledWith({ projectId: "project-1" });
  });
  it("explains pending approval without offering sales sharing", () => {
    state.status = "pending";
    mount("?tab=mine");
    expect(screen.getByText("En revisión")).toBeTruthy();
    expect(screen.getByText(/Espera la aprobación/)).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Compartir enlace de venta" }),
    ).toBeNull();
  });
  it("offers material and sharing after approval independently of the catalog search", () => {
    state.status = "approved";
    mount("?tab=mine&q=otro-proyecto");
    expect(screen.getByText("Aprobado para vender")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Abrir kit de venta" })
        .getAttribute("href"),
    ).toBe("/asesor/kit-venta/project-1");
    expect(
      screen.getByRole("button", { name: "Compartir enlace de venta" }),
    ).toBeTruthy();
  });
  it("keeps the search when changing tabs", () => {
    mount("?q=Maule");
    fireEvent.keyDown(
      screen.getByRole("tab", { name: "Mis solicitudes (0)" }),
      { key: "Enter" },
    );
    expect(
      new URLSearchParams(screen.getByTestId("location").textContent || "").get(
        "q",
      ),
    ).toBe("Maule");
    expect(
      new URLSearchParams(screen.getByTestId("location").textContent || "").get(
        "tab",
      ),
    ).toBe("mine");
  });
  it("distinguishes query failure from an empty catalog and retries", () => {
    state.error = new Error("offline");
    mount();
    expect(screen.getByRole("alert").textContent).toContain(
      "No pudimos cargar",
    );
    expect(screen.queryByText("Comisión por acordar")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Reintentar consulta" }),
    );
    expect(state.retry).toHaveBeenCalledTimes(5);
  });
});
