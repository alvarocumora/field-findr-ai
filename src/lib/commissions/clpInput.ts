/**
 * Monto CLP entero escrito por una persona: "1.200.000", "1200000" o
 * "$1.200.000". Rechaza negativos, decimales y separadores mal agrupados en
 * vez de reinterpretarlos (p. ej. "500.000,00" no se convierte en 50.000.000).
 */
const CLP_PATTERN = /^\$?\s*(\d{1,3}(?:\.\d{3})+|\d+)$/;

export const parseClpInput = (value: string): number | null => {
  const match = CLP_PATTERN.exec(value.trim());
  if (!match) return null;
  const n = Number(match[1].replace(/\./g, ''));
  return Number.isSafeInteger(n) ? n : null;
};
