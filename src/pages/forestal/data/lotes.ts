export type LoteEstado = 'disponible' | 'reservado' | 'vendido';

export interface Lote {
  numero: string;
  superficie: number; // m²
  orientacion: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'O';
  precioUF: number;
  estado: LoteEstado;
  // grid position for the SVG masterplan (col 0-4, row 0-2)
  col: number;
  row: number;
}

export const LOTES: Lote[] = [
  { numero: 'A-01', superficie: 5000, orientacion: 'N',  precioUF: 1450, estado: 'vendido',    col: 0, row: 0 },
  { numero: 'A-02', superficie: 5000, orientacion: 'N',  precioUF: 1500, estado: 'disponible', col: 1, row: 0 },
  { numero: 'A-03', superficie: 5200, orientacion: 'NE', precioUF: 1620, estado: 'disponible', col: 2, row: 0 },
  { numero: 'A-04', superficie: 5500, orientacion: 'NE', precioUF: 1780, estado: 'reservado',  col: 3, row: 0 },
  { numero: 'A-05', superficie: 6000, orientacion: 'E',  precioUF: 1950, estado: 'disponible', col: 4, row: 0 },
  { numero: 'A-06', superficie: 5000, orientacion: 'N',  precioUF: 1480, estado: 'disponible', col: 0, row: 1 },
  { numero: 'A-07', superficie: 5300, orientacion: 'NE', precioUF: 1690, estado: 'vendido',    col: 1, row: 1 },
  { numero: 'A-08', superficie: 5800, orientacion: 'E',  precioUF: 1880, estado: 'disponible', col: 2, row: 1 },
  { numero: 'A-09', superficie: 6500, orientacion: 'E',  precioUF: 2150, estado: 'disponible', col: 3, row: 1 },
  { numero: 'A-10', superficie: 7000, orientacion: 'SE', precioUF: 2380, estado: 'reservado',  col: 4, row: 1 },
  { numero: 'A-11', superficie: 5000, orientacion: 'N',  precioUF: 1520, estado: 'disponible', col: 0, row: 2 },
  { numero: 'A-12', superficie: 5400, orientacion: 'NE', precioUF: 1720, estado: 'disponible', col: 1, row: 2 },
  { numero: 'A-13', superficie: 6200, orientacion: 'E',  precioUF: 2020, estado: 'disponible', col: 2, row: 2 },
  { numero: 'A-14', superficie: 6800, orientacion: 'SE', precioUF: 2250, estado: 'reservado',  col: 3, row: 2 },
  { numero: 'A-15', superficie: 7500, orientacion: 'SE', precioUF: 2780, estado: 'disponible', col: 4, row: 2 },
];

export const SUPERFICIE_TOTAL_HA = 87;
