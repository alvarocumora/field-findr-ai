/**
 * Presentation and commercial gating for public project lots.
 *
 * The get_public_lots RPC publishes lot prices in CLP (there is no per-lot
 * currency column on the public lots table). We must not interpret a null,
 * zero, negative, or nonfinite value as a bookable, published price.
 */
export interface PublicLotCommercial {
  status?: string | null;
  price?: number | null;
}

export const hasPublishedLotPrice = (price: number | null | undefined): boolean =>
  typeof price === 'number' && Number.isFinite(price) && price > 0;

export const canReservePublicLot = (lot: PublicLotCommercial | null | undefined): boolean =>
  !!lot && lot.status === 'available' && hasPublishedLotPrice(lot.price);

export const formatPublicLotPrice = (price: number | null | undefined): string =>
  hasPublishedLotPrice(price)
    ? `$${Math.round(price!).toLocaleString('es-CL')} CLP`
    : 'Precio por confirmar';

export const formatPublicLotUnitPrice = (
  price: number | null | undefined,
  area: number | null | undefined,
): string | null =>
  hasPublishedLotPrice(price) && typeof area === 'number' && Number.isFinite(area) && area > 0
    ? `$${Math.round(price! / area).toLocaleString('es-CL')} CLP/m²`
    : null;
