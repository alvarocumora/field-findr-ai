import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAccess } from "./useAccess";

const state = vi.hoisted(() => ({
  organizationRole: null as string | null,
  organizationError: false,
}));

vi.mock("@/hooks/useSmartRedirect", () => ({
  useSmartRedirect: () => ({
    isAdmin: false,
    isAgent: true,
    isBuyer: false,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/hooks/usePanelContext", () => ({
  usePanelContext: () => ({
    context: "empresa",
    options: [],
    organization: null,
    organizationRole: state.organizationRole,
    organizationError: state.organizationError,
    brokerProfile: null,
    plan: "free",
    planDetails: {},
    planIsAgency: false,
    setContext: vi.fn(),
    isLoading: false,
    isError: state.organizationError,
    retry: vi.fn(),
  }),
}));

describe("solo-owner capability fallback vs. failed organization lookup", () => {
  it("grants owner-level capability when there is confirmed no organization", () => {
    state.organizationRole = null;
    state.organizationError = false;
    const { result } = renderHook(() => useAccess());
    expect(result.current.can("projects.read")).toBe(true);
  });

  it("does not grant owner-level capability when the organization lookup failed", () => {
    state.organizationRole = null;
    state.organizationError = true;
    const { result } = renderHook(() => useAccess());
    expect(result.current.can("projects.read")).toBe(false);
  });
});
