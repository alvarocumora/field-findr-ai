import type jsPDF from 'jspdf';

/**
 * Tipografías de marca para las fichas PDF (Montserrat + Caveat, licencia OFL).
 *
 * Los TTF viven en /public/fonts/pdf y se descargan solo al generar un PDF
 * (no entran al precache de la PWA). Si no están disponibles — sin red, tests —
 * `resolveFont` cae a Helvetica y la ficha se genera igual.
 */

interface FontFile {
  file: string;
  family: string;
  style: 'normal' | 'bold';
}

const FONT_FILES: FontFile[] = [
  { file: 'Montserrat-Regular.ttf', family: 'montserrat', style: 'normal' },
  { file: 'Montserrat-ExtraBold.ttf', family: 'montserrat', style: 'bold' },
  { file: 'Montserrat-SemiBold.ttf', family: 'montserrat-semibold', style: 'normal' },
  { file: 'Caveat-SemiBold.ttf', family: 'caveat', style: 'normal' },
];

/** Familias propias que requieren registrar TTF en el documento. */
export const CUSTOM_FONT_FAMILIES = new Set(FONT_FILES.map((f) => f.family));

let cache: Map<string, string> | null = null;
let loading: Promise<boolean> | null = null;

const toBase64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
};

/** Descarga (una sola vez) los TTF de marca. Devuelve false si no se pudo. */
export const ensureFichaFonts = (): Promise<boolean> => {
  if (cache) return Promise.resolve(true);
  if (!loading) {
    loading = (async () => {
      try {
        if (typeof fetch === 'undefined' || typeof window === 'undefined') return false;
        const entries = await Promise.all(
          FONT_FILES.map(async ({ file }) => {
            const res = await fetch(`/fonts/pdf/${file}`);
            if (!res.ok) throw new Error(`font ${file}: ${res.status}`);
            const buf = await res.arrayBuffer();
            // Guard against an HTML fallback page served with 200.
            const magic = new Uint8Array(buf, 0, 4);
            if (!(magic[0] === 0 && magic[1] === 1 && magic[2] === 0 && magic[3] === 0)) throw new Error(`font ${file}: not a TTF`);
            return [file, toBase64(buf)] as const;
          }),
        );
        cache = new Map(entries);
        return true;
      } catch (err) {
        console.warn('Fuentes de marca no disponibles, se usa Helvetica:', err);
        loading = null; // permitir reintento en la próxima ficha
        return false;
      }
    })();
  }
  return loading;
};

/** Registra las fuentes ya descargadas en un documento jsPDF. */
export const registerFichaFonts = (doc: jsPDF): boolean => {
  if (!cache) return false;
  for (const { file, family, style } of FONT_FILES) {
    const data = cache.get(file);
    if (!data) return false;
    doc.addFileToVFS(file, data);
    doc.addFont(file, family, style);
  }
  return true;
};

/** Familia a usar en un documento: la de marca si está registrada, si no Helvetica. */
export const resolveFont = (doc: jsPDF, family: string): string => {
  if (!CUSTOM_FONT_FAMILIES.has(family)) return family;
  const list = doc.getFontList() as Record<string, string[]>;
  return list[family] ? family : 'helvetica';
};

/** Solo para tests: olvida las fuentes descargadas. */
export const __resetFichaFontsForTests = () => {
  cache = null;
  loading = null;
};
