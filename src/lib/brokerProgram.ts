/** Reglas públicas del programa de red de vendedores (definidas por el negocio). */
export const BROKER_MIN_COMMISSION_CLP = 500_000;
export const BROKER_REFERRAL_BONUS_CLP = 200_000;
export const BROKER_GUIDE_URL = '/downloads/guia-red-vendedores.pdf';

/** Comisión mostrada al vendedor para una venta en pesos: el mayor entre % y el mínimo. */
export const brokerCommissionFor = (priceClp: number, ratePct: number) =>
  Math.max(BROKER_MIN_COMMISSION_CLP, Math.round((priceClp * ratePct) / 100));

export const whatsappShareUrl = (text: string, url: string) =>
  `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
