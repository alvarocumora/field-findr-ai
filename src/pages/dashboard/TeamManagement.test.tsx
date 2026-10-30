import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TeamManagement from "./TeamManagement";

const members = [
  { user_id: "owner-1", org_role: "owner" as const, name: "Dueña", email: "d@x.cl", avatar_url: null, is_owner: true },
  { user_id: "admin-1", org_role: "org_admin" as const, name: "Admin Dos", email: "a2@x.cl", avatar_url: null, is_owner: false },
  { user_id: "agent-1", org_role: "sales_agent" as const, name: "Agente", email: "ag@x.cl", avatar_url: null, is_owner: false },
];

const state = vi.hoisted(() => ({
  can: (_: string): boolean => true,
  organizationRole: "owner" as string | null,
}));

vi.mock("@/hooks/useTeam", () => ({
  useTeamMembers: () => ({
    data: members,
    isLoading: false,
    organization: { id: "org-1", name: "Mi Inmobiliaria" },
  }),
  useTeamAction: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/useSubscription", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/useSubscription")>()),
  useCurrentPlan: () => ({ plan: "enterprise" }),
}));

vi.mock("@/hooks/useAccess", () => ({
  useAccess: () => ({ can: state.can, organizationRole: state.organizationRole }),
}));

describe("team write controls match manage-team's delegation rules", () => {
  it("hides invite/remove/role controls for a role with team.read but not team.write", () => {
    state.can = () => false;
    state.organizationRole = "viewer";
    render(<TeamManagement />);

    expect(screen.queryByRole("button", { name: "Invitar miembro" })).toBeNull();
    expect(screen.getByText(/tu rol no permite invitar, remover ni cambiar roles/)).toBeTruthy();
    expect(screen.queryByLabelText(/Remover a/)).toBeNull();
  });

  it("lets a non-owner admin invite/remove regular members but not change roles or remove other admins", () => {
    state.can = () => true;
    state.organizationRole = "org_admin";
    render(<TeamManagement />);

    expect(screen.getByRole("button", { name: "Invitar miembro" })).toBeTruthy();
    expect(screen.getByLabelText("Remover a Agente")).not.toBeDisabled();
    expect(screen.getByLabelText("Remover a Admin Dos")).toBeDisabled();
  });

  it("gives the owner full control over roles and admin removal", () => {
    state.can = () => true;
    state.organizationRole = "owner";
    render(<TeamManagement />);

    expect(screen.getByLabelText("Remover a Admin Dos")).not.toBeDisabled();
  });
});
