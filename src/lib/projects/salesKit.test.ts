import { describe, expect, it } from "vitest";
import {
  consumeReservationFormIntent,
  reservationFormUrl,
  salesMaterialUrl,
} from "./salesKit";
const project = { id: "project-1", slug: "valle-prueba" };
const lots = [
  { id: "live-lot", lot_number: "12", status: "available", price: 10000000 },
  { id: "sold-lot", lot_number: "13", status: "sold", price: 10000000 },
  { id: "unknown-price", lot_number: "14", status: "available", price: null },
];
describe("sales kit and reservation links", () => {
  it("uses canonical public material links with broker attribution", () => {
    const url = new URL(salesMaterialUrl(project, "brochure", "broker-code"));
    expect(url.hostname).toBe("ofertaterrenos.com");
    expect(url.pathname).toBe("/p/valle-prueba");
    expect(url.searchParams.get("tab")).toBe("brochure");
    expect(url.searchParams.get("ref")).toBe("broker-code");
  });
  it("opens only a known available lot form and consumes the action once", () => {
    const url = new URL(reservationFormUrl(project, "live-lot", "broker-code"));
    url.searchParams.set("utm_campaign", "ventas");
    const result = consumeReservationFormIntent(lots, url.searchParams);
    expect(result?.lot?.id).toBe("live-lot");
    expect(result?.next.get("ref")).toBe("broker-code");
    expect(result?.next.get("utm_campaign")).toBe("ventas");
    expect(result?.next.get("lote")).toBe("live-lot");
    expect(result?.next.get("tab")).toBe("lots");
    expect(consumeReservationFormIntent(lots, result!.next)).toBeNull();
  });
  it.each(["sold-lot", "unknown-price", "foreign-lot"])(
    "does not open a reservation for %s",
    (id) => {
      const url = new URL(reservationFormUrl(project, id));
      expect(
        consumeReservationFormIntent(lots, url.searchParams)?.lot,
      ).toBeNull();
    },
  );
  it("resolves conflicting actions to one reservation form without reopening inquiry", () => {
    const params = new URLSearchParams(
      "reserva=1&consulta=1&lote=live-lot&ref=broker",
    );
    const result = consumeReservationFormIntent(lots, params);
    expect(result?.next.has("consulta")).toBe(false);
    expect(params.get("consulta")).toBe("1");
  });
});
