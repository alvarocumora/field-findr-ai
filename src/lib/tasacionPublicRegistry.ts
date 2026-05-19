// Static registry of public, verifiable appraisals.
// Used as a fallback when the row doesn't exist in `tasaciones_publicadas`
// (e.g. for the v21 Teno demo PDFs that ship with the project).
// Keep this list short and source-of-truth for the QR landing page.

export interface PublicAppraisalRecord {
  id: string;
  comuna: string;
  region: string;
  direccion: string;
  rol: string | null;
  superficie_m2: number;
  valor_uf: number;
  valor_clp: number;
  valor_m2_uf: number;
  fmv_min_uf: number;
  fmv_max_uf: number;
  fecha_emision: string;
  tasador_nombre: string;
  pdf_sha256: string[]; // accepts multiple variants (standard / extendido)
  pdf_filenames?: string[];
  validator_url: string;
  notes?: string;
}

export const PUBLIC_APPRAISALS: PublicAppraisalRecord[] = [
  {
    id: '2026-05-18-TENO-V21',
    comuna: 'Teno',
    region: 'Maule',
    direccion: 'Camino interior, sector Ruta 5 Sur',
    rol: '—',
    superficie_m2: 70_700,
    valor_uf: 88_000,
    valor_clp: 3_344_000_000,
    valor_m2_uf: 1.245,
    fmv_min_uf: 83_600, // -5%
    fmv_max_uf: 92_400, // +5%
    fecha_emision: '2026-05-18',
    tasador_nombre: 'OFERTA TERRENOS · Valuation',
    pdf_sha256: [
      '83bde58671970f591945b32d64d8941a98a1452c9ad778112f5a0c4c18e61e7a',
      '87f226ce54cbe32a9a5aa5057785ec41a2b395d847ff94ac023b0d8fdedf7600',
    ],
    pdf_filenames: [
      'Tasacion_Teno_18052026_v21_standard.pdf',
      'Tasacion_Teno_18052026_v21_extendido.pdf',
    ],
    validator_url: 'https://ofertaterrenos.com/tasacion/v/2026-05-18-TENO-V21',
    notes:
      'Fair Market Value bajo IVS 2022. Rango ±5% por absorción y descuento. Justificación: predio Ruta 5 Sur con IFC vigente.',
  },
];

export const findPublicAppraisalById = (id: string) =>
  PUBLIC_APPRAISALS.find((r) => r.id.toLowerCase() === id.toLowerCase()) ?? null;

export const findPublicAppraisalByHash = (hash: string) =>
  PUBLIC_APPRAISALS.find((r) => r.pdf_sha256.includes(hash.toLowerCase())) ?? null;
