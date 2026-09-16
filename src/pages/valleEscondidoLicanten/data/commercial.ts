const env = (value: string | undefined) => value?.trim() ?? '';

/**
 * Canales comerciales públicos de Valle Escondido.
 *
 * Teléfono y WhatsApp se configuran por entorno para evitar publicar
 * números ficticios en producción. El email conserva un fallback seguro.
 */
export const VEL_CONTACT = {
  email: env(import.meta.env.VITE_OFERTA_EMAIL) || 'contacto@ofertaterrenos.com',
  phone: env(import.meta.env.VITE_OFERTA_PHONE),
  whatsapp: env(import.meta.env.VITE_OFERTA_WHATSAPP),
} as const;

export const whatsappDigits = (value: string) => value.replace(/\D/g, '');
