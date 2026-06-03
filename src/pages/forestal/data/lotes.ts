// Datos Fase 1 reales del Master Loteo La Palmilla — Caone (Hualañé, Maule).
// Fuente: 01_PlanDeNegocio_Dossier_LaPalmilla (Documento 1 de 8) + Memoria de Inversión.
// Marco legal: DL 3.516. Hijuelas inscritas en CBR Licantén (2022) con SAG + roles SII preasignados.

export type LoteEstado = 'disponible' | 'reservado' | 'vendido';

export interface Etapa {
  id: 'A' | 'B' | 'C';
  nombre: string;
  hijuela: string;
  rolMatriz: string;
  cbr: string;
  certSAG: string;
  lotes: number;
  tamanoHa: number;       // ha promedio referencial
  precioCLP_M: number;    // CLP por lote, en millones
  subtotalCLP_M: number;  // GDV de la etapa
  rolesSerie: string;
  color: string;          // color etapa (forest deep / gold / charcoal mix)
}

export interface Lote {
  numero: string;
  etapa: 'A' | 'B' | 'C';
  superficie: number;     // m²
  orientacion: 'N' | 'NE' | 'E' | 'SE' | 'S' | 'O';
  precioCLP_M: number;    // CLP en millones
  estado: LoteEstado;
  rolSII?: string;
}

// 3 etapas comerciales = 3 hijuelas inscritas (7, 8, 10). Total 177 lotes, GDV CLP $ 2.303M.
export const ETAPAS: Etapa[] = [
  {
    id: 'A',
    nombre: 'Lanzamiento',
    hijuela: 'Hijuela 7',
    rolMatriz: '168-918',
    cbr: 'Fs 4785 N° 2344 / 2022',
    certSAG: 'SAG 2139/2023',
    lotes: 68,
    tamanoHa: 0.5,
    precioCLP_M: 9.5,
    subtotalCLP_M: 646,
    rolesSerie: '08078-001/068',
    color: '#3F7D54',
  },
  {
    id: 'B',
    nombre: 'Consolidación',
    hijuela: 'Hijuela 8',
    rolMatriz: '168-919',
    cbr: 'Fs 4787 N° 2345 / 2022',
    certSAG: 'SAG 2135/2023',
    lotes: 69,
    tamanoHa: 0.7,
    precioCLP_M: 13.0,
    subtotalCLP_M: 897,
    rolesSerie: '08079-001/069',
    color: '#C8983F',
  },
  {
    id: 'C',
    nombre: 'Premium',
    hijuela: 'Hijuela 10',
    rolMatriz: '168-921',
    cbr: 'Fs 4789 N° 2346 / 2022',
    certSAG: 'SAG 2744/2023',
    lotes: 40,
    tamanoHa: 1.2,
    precioCLP_M: 19.0,
    subtotalCLP_M: 760,
    rolesSerie: '08088-001/040',
    color: '#1F3D2B',
  },
];

// Totales Fase 1
export const FASE1_LOTES = 177;
export const FASE1_SUPERFICIE_HA = 123;
export const FASE1_GDV_CLP_M = 2_303;
export const PROGRAMA_TOTAL_LOTES = 600;
export const PROGRAMA_TOTAL_GDV_CLP_M = 7_800;

// Selección representativa de lotes-vitrina (no enumeramos los 177, sería ruidoso).
// Muestra 18 lotes (6 por etapa) con estados realistas para el plano maestro.
export const LOTES_DESTACADOS: Lote[] = [
  // Etapa A — Hijuela 7 · lanzamiento (precio gancho)
  { numero: 'A-07-01', etapa: 'A', superficie: 5_000, orientacion: 'N',  precioCLP_M: 9.5,  estado: 'vendido',    rolSII: '08078-001' },
  { numero: 'A-07-04', etapa: 'A', superficie: 5_100, orientacion: 'NE', precioCLP_M: 9.5,  estado: 'vendido',    rolSII: '08078-004' },
  { numero: 'A-07-12', etapa: 'A', superficie: 5_000, orientacion: 'N',  precioCLP_M: 9.5,  estado: 'reservado',  rolSII: '08078-012' },
  { numero: 'A-07-18', etapa: 'A', superficie: 5_200, orientacion: 'E',  precioCLP_M: 9.9,  estado: 'disponible', rolSII: '08078-018' },
  { numero: 'A-07-31', etapa: 'A', superficie: 5_000, orientacion: 'N',  precioCLP_M: 9.5,  estado: 'disponible', rolSII: '08078-031' },
  { numero: 'A-07-55', etapa: 'A', superficie: 5_400, orientacion: 'NE', precioCLP_M: 10.2, estado: 'disponible', rolSII: '08078-055' },
  // Etapa B — Hijuela 8 · consolidación
  { numero: 'B-08-02', etapa: 'B', superficie: 7_000, orientacion: 'NE', precioCLP_M: 13.0, estado: 'reservado',  rolSII: '08079-002' },
  { numero: 'B-08-09', etapa: 'B', superficie: 7_200, orientacion: 'E',  precioCLP_M: 13.4, estado: 'disponible', rolSII: '08079-009' },
  { numero: 'B-08-17', etapa: 'B', superficie: 7_500, orientacion: 'SE', precioCLP_M: 13.8, estado: 'disponible', rolSII: '08079-017' },
  { numero: 'B-08-24', etapa: 'B', superficie: 6_800, orientacion: 'N',  precioCLP_M: 12.8, estado: 'disponible', rolSII: '08079-024' },
  { numero: 'B-08-38', etapa: 'B', superficie: 7_100, orientacion: 'NE', precioCLP_M: 13.2, estado: 'disponible', rolSII: '08079-038' },
  { numero: 'B-08-52', etapa: 'B', superficie: 7_400, orientacion: 'E',  precioCLP_M: 13.6, estado: 'disponible', rolSII: '08079-052' },
  // Etapa C — Hijuela 10 · premium (mayor superficie y orientación)
  { numero: 'C-10-03', etapa: 'C', superficie: 12_000, orientacion: 'E',  precioCLP_M: 19.0, estado: 'reservado',  rolSII: '08088-003' },
  { numero: 'C-10-08', etapa: 'C', superficie: 11_500, orientacion: 'NE', precioCLP_M: 18.6, estado: 'disponible', rolSII: '08088-008' },
  { numero: 'C-10-14', etapa: 'C', superficie: 13_200, orientacion: 'E',  precioCLP_M: 20.1, estado: 'disponible', rolSII: '08088-014' },
  { numero: 'C-10-21', etapa: 'C', superficie: 12_800, orientacion: 'SE', precioCLP_M: 19.8, estado: 'disponible', rolSII: '08088-021' },
  { numero: 'C-10-27', etapa: 'C', superficie: 14_000, orientacion: 'E',  precioCLP_M: 21.0, estado: 'disponible', rolSII: '08088-027' },
  { numero: 'C-10-34', etapa: 'C', superficie: 12_400, orientacion: 'NE', precioCLP_M: 19.4, estado: 'disponible', rolSII: '08088-034' },
];

// — Aliases retro-compatibles para secciones legacy (Contacto, Proyecto) —
// Exponen los lotes destacados con el campo `precioUF` derivado del precio CLP (FX ≈ UF $ 38.500).
const UF_CLP = 38_500;
export const LOTES = LOTES_DESTACADOS.map((l) => ({
  ...l,
  precioUF: Math.round((l.precioCLP_M * 1_000_000) / UF_CLP),
}));
export const SUPERFICIE_TOTAL_HA = FASE1_SUPERFICIE_HA;
