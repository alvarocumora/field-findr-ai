import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProjectDownloads } from "./ProjectDownloads";

const sdk = vi.hoisted(() => ({
  generateProjectDossierPdf: vi.fn().mockResolvedValue(undefined),
  broker: null as null | { display_name: string; phone: string | null; email: string | null; company_name: string | null },
}));

vi.mock("@/hooks/useStaticMapToken", () => ({ useStaticMapToken: () => "token" }));
vi.mock("@/hooks/useSentinelImagery", () => ({
  useSentinelImagery: () => ({ data: null, refetch: vi.fn().mockResolvedValue({ data: null }) }),
}));
vi.mock("@/hooks/useTrackEvent", () => ({ useTrackEvent: () => ({ track: vi.fn() }) }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));
vi.mock("@/hooks/useBrokers", () => ({
  useBrokerByInviteCode: () => ({ data: sdk.broker }),
}));
vi.mock("@/lib/pdf/projectKit", () => ({
  generateProjectDossierPdf: sdk.generateProjectDossierPdf,
  generateProjectMasterplanPdf: vi.fn(),
  generateProjectPriceListPdf: vi.fn(),
  exportProjectPriceListCsv: vi.fn(),
  generateProjectLotSheetsPdf: vi.fn(),
}));

const project = { id: "proj-1", slug: "proyecto-demo", name: "Proyecto Demo" };

const renderDownloads = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <ProjectDownloads project={project} lots={[{ status: "available", price: 1, area: 1 }]} />
    </MemoryRouter>,
  );

describe("broker-attributed material via ?ref=", () => {
  it("passes no broker when there is no ?ref= on the URL", async () => {
    sdk.broker = null;
    renderDownloads("/p/proyecto-demo");
    fireEvent.click(screen.getByRole("button", { name: /Descargar dossier/ }));
    await waitFor(() => expect(sdk.generateProjectDossierPdf).toHaveBeenCalled());
    const [, , opts] = sdk.generateProjectDossierPdf.mock.calls.at(-1)!;
    expect(opts.broker).toBeNull();
  });

  it("attributes the dossier to the broker resolved from ?ref=", async () => {
    sdk.broker = { display_name: "Camila Rojas", phone: "+56933334444", email: "camila@corredora.cl", company_name: "Rojas Corretajes" };
    renderDownloads("/p/proyecto-demo?ref=BK-ABC123");
    fireEvent.click(screen.getByRole("button", { name: /Descargar dossier/ }));
    await waitFor(() => expect(sdk.generateProjectDossierPdf).toHaveBeenCalled());
    const [, , opts] = sdk.generateProjectDossierPdf.mock.calls.at(-1)!;
    expect(opts.broker).toEqual({
      name: "Camila Rojas",
      phone: "+56933334444",
      email: "camila@corredora.cl",
      company_name: "Rojas Corretajes",
    });
  });
});
