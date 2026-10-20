/** Compose a safe, explicit email handoff for general inquiries.
 * Unlike project/plan leads, the global contact page has no verified
 * backend endpoint. Opening the user's mail client is not proof of delivery.
 */
export interface GeneralContactInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export const GENERAL_CONTACT_EMAIL = 'ventas@ofertaterrenos.com';

export const createContactMailto = (form: GeneralContactInput): string => {
  const subject = `[OfertaTerrenos] ${form.subject.trim()}`;
  const content = [
    `Nombre: ${form.name.trim()}`,
    `Email: ${form.email.trim()}`,
    form.phone?.trim() ? `Teléfono: ${form.phone.trim()}` : null,
    '',
    form.message.trim(),
  ].filter((value) => value !== null).join('\n');
  return `mailto:${GENERAL_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`;
};
