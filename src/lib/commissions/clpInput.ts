/** Monto CLP escrito por una persona: acepta "1.200.000", "1200000" o "$1.200.000". */
export const parseClpInput = (value: string): number | null => {
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isSafeInteger(n) ? n : null;
};
