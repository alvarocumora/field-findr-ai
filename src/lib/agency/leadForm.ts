export interface PublicLeadForm {
  firstName: string;
  email: string;
  phone: string;
  message: string;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Validate a public showcase inquiry. Returns an error message, or null if ok. */
export function validatePublicLead(form: PublicLeadForm): string | null {
  if (!form.firstName.trim()) return 'Ingresa tu nombre';
  if (!form.email.trim() && !form.phone.trim()) return 'Ingresa un email o teléfono de contacto';
  if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) return 'El email no es válido';
  return null;
}
