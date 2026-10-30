import { getShareUrl } from "@/lib/publicUrls";
import { canReservePublicLot } from "@/lib/lots/publicLotCommercial";
import {
  resolveProjectInquiryLot,
  type ProjectInquiryLot,
} from "./projectInquiry";

export function salesMaterialUrl(
  project: { id: string; slug?: string | null },
  tab: "info" | "brochure" | "tour360" | "lots",
  ref?: string | null,
  lotId?: string,
) {
  const path = project.slug
    ? `/p/${encodeURIComponent(project.slug)}`
    : `/proyecto/${encodeURIComponent(project.id)}`;
  return getShareUrl(path, { tab, ref, lote: lotId });
}

/** Only opens the existing form. No reservation is created by visiting a link. */
export function reservationFormUrl(
  project: { id: string; slug?: string | null },
  lotId: string,
  ref?: string | null,
) {
  const url = new URL(salesMaterialUrl(project, "lots", ref, lotId));
  url.searchParams.set("reserva", "1");
  return url.toString();
}

export function consumeReservationFormIntent<
  T extends ProjectInquiryLot & {
    status?: string | null;
    price?: number | null;
  },
>(lots: readonly T[], params: URLSearchParams) {
  if (params.get("reserva") !== "1") return null;
  const next = new URLSearchParams(params);
  next.delete("reserva");
  next.delete("consulta"); // Reservation form takes precedence over a conflicting inquiry intent.
  const lot = resolveProjectInquiryLot(lots, params);
  return { next, lot: lot && canReservePublicLot(lot) ? lot : null };
}
