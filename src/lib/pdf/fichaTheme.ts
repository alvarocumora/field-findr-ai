/**
 * Tema configurable de las fichas PDF (branding sin tocar código).
 *
 * Permite cambiar logo (texto o imagen), colores y tipografías desde la
 * configuración (/admin/branding-fichas) y regenerar todas las fichas con el
 * nuevo tema. El tema se persiste en localStorage y puede exportarse /
 * importarse como JSON para replicarlo entre entornos.
 */

export type RGB = [number, number, number];

export type FichaFontFamily = 'helvetica' | 'times' | 'courier';

export interface FichaThemeColors {
  emerald: string;
  sky: string;
  forest: string;
  dark: string;
  gray: string;
  line: string;
  soft: string;
  white: string;
  /** Color de cabecera de la ficha de predio urbano / variantes. */
  accent: string;
}

export interface FichaTheme {
  /** Nombre corto de marca usado en pies de página. */
  brandName: string;
  logo: {
    /** Primera palabra del wordmark (se imprime en negrita). */
    primary: string;
    /** Segunda palabra del wordmark. */
    secondary: string;
    /** Logo en imagen (data URL). Si existe, reemplaza la marca vectorial. */
    imageDataUrl?: string | null;
    /** Alto del logo en mm cuando es imagen. */
    imageHeight?: number;
  };
  colors: FichaThemeColors;
  fonts: {
    heading: FichaFontFamily;
    body: FichaFontFamily;
  };
  /** Origen público usado para los QR y enlaces de las fichas. */
  publicOrigin: string;
  /** Sufijo del pie de página (por defecto el dominio). */
  footerSuffix: string;
}

export const DEFAULT_FICHA_THEME: FichaTheme = {
  brandName: 'OFERTA TERRENOS',
  logo: { primary: 'OFERTA', secondary: 'TERRENOS', imageDataUrl: null, imageHeight: 10 },
  colors: {
    emerald: '#22C55E',
    sky: '#0EA5E9',
    forest: '#164E34',
    dark: '#1E2320',
    gray: '#6E7672',
    line: '#E2E6E3',
    soft: '#F8FAF8',
    white: '#FFFFFF',
    accent: '#163C4E',
  },
  fonts: { heading: 'helvetica', body: 'helvetica' },
  publicOrigin: 'https://ofertaterrenos.com',
  footerSuffix: 'ofertaterrenos.com',
};

const STORAGE_KEY = 'ot.ficha.theme.v1';

export const hexToRgb = (hex: string): RGB => {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const rgbToHex = ([r, g, b]: RGB) =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

const merge = (base: FichaTheme, patch: Partial<FichaTheme> | null | undefined): FichaTheme => ({
  ...base,
  ...(patch ?? {}),
  logo: { ...base.logo, ...(patch?.logo ?? {}) },
  colors: { ...base.colors, ...(patch?.colors ?? {}) },
  fonts: { ...base.fonts, ...(patch?.fonts ?? {}) },
});

let current: FichaTheme = DEFAULT_FICHA_THEME;
let loaded = false;
const listeners = new Set<(t: FichaTheme) => void>();

const load = (): FichaTheme => {
  if (loaded) return current;
  loaded = true;
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) current = merge(DEFAULT_FICHA_THEME, JSON.parse(raw));
  } catch {
    current = DEFAULT_FICHA_THEME;
  }
  return current;
};

/** Tema activo de las fichas. */
export const getFichaTheme = (): FichaTheme => load();

/** Colores del tema activo en formato jsPDF (RGB). */
export const themeRgb = (key: keyof FichaThemeColors): RGB => hexToRgb(load().colors[key]);

/** Guarda un tema parcial y notifica a los suscriptores. */
export const setFichaTheme = (patch: Partial<FichaTheme>): FichaTheme => {
  current = merge(load(), patch);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* almacenamiento no disponible */
  }
  listeners.forEach((fn) => fn(current));
  return current;
};

/** Restaura el branding por defecto. */
export const resetFichaTheme = (): FichaTheme => {
  current = DEFAULT_FICHA_THEME;
  loaded = true;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
  listeners.forEach((fn) => fn(current));
  return current;
};

export const subscribeFichaTheme = (fn: (t: FichaTheme) => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const exportFichaTheme = () => JSON.stringify(load(), null, 2);

export const importFichaTheme = (json: string): FichaTheme => {
  const parsed = JSON.parse(json) as Partial<FichaTheme>;
  return setFichaTheme(parsed);
};
