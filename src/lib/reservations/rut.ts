/**
 * RUT chileno: limpieza, formato (12.345.678-9) y dígito verificador
 * (módulo 11). Se usa en el formulario público de reserva.
 */

export const cleanRut = (value: string): string =>
  value.replace(/[^0-9kK]/g, '').toUpperCase();

export const computeRutDv = (body: string): string => {
  let sum = 0;
  let factor = 2;
  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const rest = 11 - (sum % 11);
  if (rest === 11) return '0';
  if (rest === 10) return 'K';
  return String(rest);
};

export const isValidRut = (value: string): boolean => {
  const clean = cleanRut(value);
  if (clean.length < 2) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!/^\d{6,8}$/.test(body)) return false;
  return computeRutDv(body) === dv;
};

export const formatRut = (value: string): string => {
  const clean = cleanRut(value);
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1).replace(/^0+/, '');
  const dv = clean.slice(-1);
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
};
