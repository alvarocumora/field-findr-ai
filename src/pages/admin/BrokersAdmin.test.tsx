import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BrokersAdmin from "./BrokersAdmin";
const state = vi.hoisted(() => ({ retry: vi.fn() }));
vi.mock("@/hooks/useBrokers", () => ({
  useBrokerApplications: () => ({
    data: [],
    error: new Error("offline"),
    refetch: state.retry,
  }),
  useAllBrokerProfiles: () => ({ data: [], refetch: state.retry }),
  useApproveBrokerApplication: () => ({}),
  useUpdateBrokerApplication: () => ({}),
  useAdminUpdateBrokerProfile: () => ({}),
}));
describe("admin broker availability", () => {
  it("does not expose approval actions or empty counts when applications fail", () => {
    render(<BrokersAdmin />);
    expect(screen.getByRole("alert").textContent).toContain(
      "No pudimos cargar postulaciones",
    );
    expect(screen.queryByText("Aprobar broker")).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: "Reintentar consulta" }),
    );
    expect(state.retry).toHaveBeenCalledTimes(2);
  });
});
