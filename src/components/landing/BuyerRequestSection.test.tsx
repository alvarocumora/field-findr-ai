import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BuyerRequestSection from "./BuyerRequestSection";

const state = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("@/hooks/useMeetings", () => ({
  useCreateMeetingRequest: () => ({
    mutateAsync: state.send,
    isPending: false,
  }),
}));
const fill = () => {
  fireEvent.change(screen.getByLabelText("Tu nombre *"), {
    target: { value: "  Ana QA  " },
  });
  fireEvent.change(screen.getByLabelText("Teléfono / WhatsApp *"), {
    target: { value: "+56 9 1111 2222" },
  });
  fireEvent.change(screen.getByLabelText("Zona que te interesa"), {
    target: { value: "  Maule  " },
  });
  fireEvent.change(screen.getByLabelText("Tu presupuesto"), {
    target: { value: "$20 a $40 millones CLP" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
};

describe("buyer request capture", () => {
  beforeEach(() => state.send.mockReset());
  it("sends preferences into the existing commercial inbox and confirms only after acknowledgement", async () => {
    state.send.mockResolvedValue({ ok: true });
    render(<BuyerRequestSection />);
    fill();
    fireEvent.submit(screen.getByRole("form"));
    expect(await screen.findByText("Solicitud recibida")).toBeTruthy();
    expect(state.send).toHaveBeenCalledWith({
      meetingType: "reunion_comercial",
      requesterName: "Ana QA",
      requesterPhone: "+56 9 1111 2222",
      context:
        "Busca una parcela. Zona: Maule. Presupuesto: $20 a $40 millones CLP. Autoriza contacto sobre esta solicitud.",
      source: "portada_asesoria",
    });
    expect(screen.queryByRole("form")).toBeNull();
  });
  it("keeps the draft and offers retry after the server rejects the request", async () => {
    state.send.mockRejectedValue(new Error("unavailable"));
    render(<BuyerRequestSection />);
    fill();
    fireEvent.submit(screen.getByRole("form"));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(
      (screen.getByLabelText("Tu nombre *") as HTMLInputElement).value,
    ).toBe("  Ana QA  ");
    expect(screen.queryByText("Solicitud recibida")).toBeNull();
    state.send.mockResolvedValue({ ok: true });
    fireEvent.submit(screen.getByRole("form"));
    expect(await screen.findByText("Solicitud recibida")).toBeTruthy();
  });
  it("does not send twice while the first request is in flight", async () => {
    let resolve!: (value: unknown) => void;
    state.send.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(<BuyerRequestSection />);
    fill();
    fireEvent.submit(screen.getByRole("form"));
    fireEvent.submit(screen.getByRole("form"));
    expect(state.send).toHaveBeenCalledOnce();
    expect(screen.queryByText("Solicitud recibida")).toBeNull();
    await act(async () => resolve({ ok: true }));
    expect(screen.getByText("Solicitud recibida")).toBeTruthy();
  });
});
