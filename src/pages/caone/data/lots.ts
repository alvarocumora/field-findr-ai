// Superficies desde el masterplan comercial (KMZ) del ROL 168-921. El estado
// comercial (disponible/reservado/vendido), el precio y el listing_id se leen
// en vivo con `get_public_lots` en `useCaoneLots` — este arreglo es solo el
// fallback cuando la plataforma no responde.

export type CaoneLotStatus = 'available' | 'reserved' | 'sold';

export interface CaoneLot {
  lot_number: string;
  area_ha: number;
  status: CaoneLotStatus;
  price_clp: number | null;
  listing_id: string | null;
}

const AREA_HA_BY_LOT: readonly (readonly [string, number])[] = [
  ['1', 1.08], ['2', 1.33], ['3', 2.00], ['4', 1.00], ['5', 1.00], ['6', 1.00], ['7', 1.00], ['8', 1.00], ['9', 1.00], ['10', 1.00],
  ['11', 1.50], ['12', 1.00], ['13', 1.00], ['14', 1.00], ['15', 1.00], ['16', 1.00], ['17', 1.00], ['18', 1.00], ['19', 1.00], ['20', 1.00],
  ['21', 1.00], ['22', 1.00], ['23', 1.00], ['24', 1.00], ['25', 1.14], ['26', 1.00], ['27', 1.00], ['28', 1.00], ['29', 1.00], ['30', 1.00],
  ['31', 1.00], ['32', 1.00], ['33', 1.00], ['34', 1.00], ['35', 1.00], ['36', 0.75], ['37', 0.75], ['38', 1.20], ['39', 1.00], ['40', 1.00],
];

export const CAONE_LOTS: CaoneLot[] = AREA_HA_BY_LOT.map(([lot_number, area_ha]) => ({
  lot_number,
  area_ha,
  status: 'available',
  price_clp: null,
  listing_id: null,
}));
