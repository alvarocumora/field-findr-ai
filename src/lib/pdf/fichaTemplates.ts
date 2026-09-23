import { BRAND, createFichaDoc, type FichaDoc } from '@/lib/pdf/fichaShell';
import { getFichaTheme } from '@/lib/pdf/fichaTheme';
import { ensureFichaFonts } from '@/lib/pdf/fichaFonts';

/**
 * Plantillas del shell único de fichas.
 *
 * Cada tipo de ficha (dossier, lote, predio urbano) define únicamente su
 * "piel" editorial: nota de pie, color de cabecera, eyebrow por defecto,
 * leyenda del QR y disclaimer final. El header, el QR, el pie con paginación
 * y las primitivas de contenido son siempre los mismos (fichaShell).
 */

export type FichaTemplateId = 'dossier' | 'lote' | 'predio-urbano' | 'proyecto';

export interface FichaTemplate {
  id: FichaTemplateId;
  /** Texto del pie de página (izquierda). */
  footerNote: string;
  /** Etiqueta por defecto sobre el título. */
  eyebrow: string;
  /** Color de la barra de cabecera. */
  headerColor: [number, number, number];
  /** Alto de la cabecera en mm. */
  headerHeight: number;
  /** Leyenda bajo el código QR. */
  qrCaption: string;
  /** Nota legal que se imprime al final de la ficha. */
  disclaimer: (ctx: { date: string }) => string;
}

const buildTemplates = (): Record<FichaTemplateId, FichaTemplate> => {
  const theme = getFichaTheme();
  const foot = (label: string) => `${theme.brandName} · ${label} · ${theme.footerSuffix}`;
  return {
  dossier: {
    id: 'dossier',
    footerNote: foot('Expediente confidencial'),
    eyebrow: 'Expediente de presentacion · entidad financiera',
    headerColor: BRAND.forest,
    headerHeight: 54,
    qrCaption: 'Escanear ficha online',
    disclaimer: () =>
      'Documento de caracter informativo y confidencial, preparado para la evaluacion de una entidad financiera. Las cifras de valoracion no constituyen oferta ni compromiso de credito. Los antecedentes completos estan disponibles en el data room digital de la ficha.',
  },
  proyecto: {
    id: 'proyecto',
    footerNote: foot('Material del proyecto'),
    eyebrow: 'Material del proyecto',
    headerColor: BRAND.forest,
    headerHeight: 54,
    qrCaption: 'Ver proyecto online',
    disclaimer: ({ date }) =>
      `Documento generado por ofertaterrenos.com el ${date}. Superficies, precios y disponibilidad son referenciales y pueden variar sin previo aviso; las imagenes y planos son referenciales.`,
  },
  lote: {
    id: 'lote',
    footerNote: foot('Ficha de lote'),
    eyebrow: 'Ficha de lote',
    headerColor: BRAND.forest,
    headerHeight: 50,
    qrCaption: 'Ver ficha online',
    disclaimer: ({ date }) =>
      `Documento generado por ofertaterrenos.com el ${date}. Los precios y la disponibilidad pueden variar sin previo aviso.`,
  },
  'predio-urbano': {
    id: 'predio-urbano',
    footerNote: foot('Ficha de predio urbano'),
    eyebrow: 'Ficha de predio urbano',
    headerColor: BRAND.accent,
    headerHeight: 50,
    qrCaption: 'Ver antecedentes online',
    disclaimer: ({ date }) =>
      `Antecedentes tributarios y urbanisticos vigentes a la fecha de emision (${date}). Documento informativo; los certificados originales estan disponibles en el data room de la ficha.`,
    },
  };
};

/** Plantillas resueltas con el tema activo (branding configurable). */
export const getFichaTemplate = (id: FichaTemplateId): FichaTemplate => buildTemplates()[id];

/** Acceso compatible: siempre devuelve la plantilla con el tema vigente. */
export const FICHA_TEMPLATES = new Proxy({} as Record<FichaTemplateId, FichaTemplate>, {
  get: (_t, key: string) => getFichaTemplate(key as FichaTemplateId),
}) as Record<FichaTemplateId, FichaTemplate>;

export interface RenderFichaOptions {
  template: FichaTemplateId;
  title: string;
  subtitle?: string;
  /** Sobrescribe el eyebrow por defecto de la plantilla. */
  eyebrow?: string;
  /** Ruta o URL pública para el QR de cabecera. */
  qrUrl?: string;
  filename: string;
  output?: 'download' | 'blob';
  /** Contenido específico de la ficha, con las primitivas del shell. */
  body: (f: FichaDoc, t: FichaTemplate) => void | Promise<void>;
  /** Reemplaza el disclaimer de la plantilla (null lo omite). */
  disclaimer?: string | null;
}

/**
 * Construye y descarga una ficha aplicando la plantilla indicada:
 * mismo header/logo/QR/pie, contenido intercambiable.
 */
export async function renderFicha(options: RenderFichaOptions): Promise<Blob | undefined> {
  await ensureFichaFonts();
  const t = getFichaTemplate(options.template);
  const f = createFichaDoc({ footerNote: t.footerNote });

  await f.header({
    eyebrow: options.eyebrow ?? t.eyebrow,
    title: options.title,
    subtitle: options.subtitle,
    qrUrl: options.qrUrl,
    qrCaption: t.qrCaption,
    height: t.headerHeight,
    color: t.headerColor,
  });

  await options.body(f, t);

  const date = new Date().toLocaleDateString('es-CL');
  const note = options.disclaimer === undefined ? t.disclaimer({ date }) : options.disclaimer;
  if (note) f.note(note);

  if (options.output === 'blob') return f.blob();
  f.save(options.filename);
}

export interface PredioUrbano {
  rol: string;
  direccion: string;
  destino: string;
  propietario: string;
  avaluoTotal: number;
  avaluoActualizado: number;
  contribucionSemestral: number;
  periodo: string;
  expropiacion: string;
  /** Títulos de los antecedentes asociados. */
  documentos?: string[];
  comuna?: string;
}

const clp = (n: number) => '$' + n.toLocaleString('es-CL');

/** Ficha individual de un predio urbano de la sociedad. */
export async function generatePredioUrbanoFicha(
  predio: PredioUrbano,
  options: { qrUrl?: string; sociedad?: string } = {}
) {
  await renderFicha({
    template: 'predio-urbano',
    title: predio.direccion,
    subtitle: `ROL ${predio.rol} · ${predio.destino}${predio.comuna ? ` · ${predio.comuna}` : ''}`,
    qrUrl: options.qrUrl,
    filename: `Ficha-Predio-Urbano-ROL-${predio.rol.replace(/[^\dA-Za-z-]/g, '')}.pdf`,
    body: (f) => {
      f.kpis([
        ['Avaluo total', clp(predio.avaluoTotal), predio.periodo],
        ['Avaluo actualizado', clp(predio.avaluoActualizado), 'Reajustado'],
        ['Contribucion semestral', clp(predio.contribucionSemestral), predio.periodo],
        ['Destino SII', predio.destino, `ROL ${predio.rol}`],
      ]);

      f.section('Identificacion');
      f.kv('Direccion', predio.direccion);
      f.kv('ROL SII', predio.rol);
      if (predio.comuna) f.kv('Comuna', predio.comuna);
      f.kv('Propietario', options.sociedad ?? predio.propietario);
      f.y += 2;

      f.section('Situacion urbanistica');
      f.paragraph(predio.expropiacion);

      if (predio.documentos?.length) {
        f.section(`Antecedentes (${predio.documentos.length})`);
        f.bullets(predio.documentos);
      }
    },
  });
}
