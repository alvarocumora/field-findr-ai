/**
 * Comisiones fijas por proyecto que se muestran en textos públicos (landing,
 * panel y guía PDF). La fuente de verdad es `commission_rules` en la base;
 * estos valores deben coincidir con la última migración de montos
 * (supabase/migrations/20261031120000_project_commission_amounts_update.sql),
 * y un test lo verifica.
 */
export interface BrokerProjectCommission {
  projectId: string;
  name: string;
  /** Comisión TOTAL en CLP por lote vendido (si capta y cierra el mismo, la recibe completa). */
  sale: number;
  /** Parte del total para quien captó al cliente cuando cierra otro vendedor. */
  capture: number;
}

export const BROKER_PROJECT_COMMISSIONS: readonly BrokerProjectCommission[] = [
  {
    projectId: 'b4363fda-e99f-400d-ae95-2cbc8244b770',
    name: 'Valle Escondido Licantén',
    sale: 1_200_000,
    capture: 500_000,
  },
  {
    projectId: '761e73ed-cc0d-5605-a06a-4a4348523b4b',
    name: 'Valle de Hualañé',
    sale: 750_000,
    capture: 350_000,
  },
];

/** Comisión por venta más baja entre los proyectos con monto fijo ("desde"). */
export const BROKER_MIN_SALE_COMMISSION_CLP = Math.min(
  ...BROKER_PROJECT_COMMISSIONS.map((p) => p.sale),
);

export const BROKER_GUIDE_URL = '/downloads/guia-red-vendedores.pdf';

export const clpAmount = (amount: number) => '$' + amount.toLocaleString('es-CL');

/** Parte de quien cierra cuando otro vendedor captó al cliente. */
export const brokerCloserShare = (p: BrokerProjectCommission) => Math.max(0, p.sale - p.capture);

/**
 * "Valle Escondido Licantén: $1.200.000 por venta ($500.000 captación + $700.000 cierre) · …"
 * El total se reparte entre quien capta y quien cierra; si es la misma persona, lo recibe completo.
 */
export const brokerCommissionSummary = (separator = ' · ') =>
  BROKER_PROJECT_COMMISSIONS.map(
    (p) => `${p.name}: ${clpAmount(p.sale)} por venta (${clpAmount(p.capture)} captación + ${clpAmount(brokerCloserShare(p))} cierre)`,
  ).join(separator);

export const whatsappShareUrl = (text: string, url: string) =>
  `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
