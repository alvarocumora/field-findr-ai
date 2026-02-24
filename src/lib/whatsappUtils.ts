/**
 * Utilidades para generar links de WhatsApp con mensajes contextuales mejorados
 */

interface WhatsAppLotMessage {
  projectName: string;
  lotNumber: string;
  lotArea: number;
  lotPrice?: number | null;
  currency?: string;
  location?: string;
  phone?: string;
}

interface WhatsAppListingMessage {
  title: string;
  price: number;
  currency?: string;
  area?: number | null;
  location?: string;
  phone?: string;
}

interface WhatsAppLeadMessage {
  leadName: string;
  projectName?: string;
  lotNumber?: string;
  phone: string;
}

const formatPrice = (value: number, currency = 'CLP'): string =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);

const buildWaUrl = (phone: string | undefined, text: string): string => {
  const encoded = encodeURIComponent(text);
  if (phone) {
    const clean = phone.replace(/[^0-9+]/g, '');
    return `https://wa.me/${clean}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
};

export const whatsapp = {
  /** Mensaje contextual para consulta sobre un lote específico */
  lotInquiry({ projectName, lotNumber, lotArea, lotPrice, currency = 'CLP', location, phone }: WhatsAppLotMessage): string {
    let msg = `🏡 Hola, estoy interesado/a en el *Lote ${lotNumber}* del proyecto *${projectName}*.\n\n`;
    msg += `📐 Superficie: ${lotArea.toLocaleString('es-CL')} m²\n`;
    if (lotPrice) msg += `💰 Precio: ${formatPrice(lotPrice, currency)}\n`;
    if (location) msg += `📍 Ubicación: ${location}\n`;
    msg += `\n¿Podrían darme más información sobre disponibilidad y condiciones de compra?`;
    return buildWaUrl(phone, msg);
  },

  /** Mensaje contextual para consulta sobre un listing */
  listingInquiry({ title, price, currency = 'CLP', area, location, phone }: WhatsAppListingMessage): string {
    let msg = `🏡 Hola, me interesa la propiedad *"${title}"*.\n\n`;
    msg += `💰 Precio publicado: ${formatPrice(price, currency)}\n`;
    if (area) msg += `📐 Superficie: ${area.toLocaleString('es-CL')} m²\n`;
    if (location) msg += `📍 Ubicación: ${location}\n`;
    msg += `\n¿Podrían enviarme más detalles y coordinar una visita?`;
    return buildWaUrl(phone, msg);
  },

  /** Mensaje de seguimiento para un lead */
  leadFollowUp({ leadName, projectName, lotNumber, phone }: WhatsAppLeadMessage): string {
    let msg = `Hola ${leadName}, le escribo desde Ofertaterrenos.`;
    if (projectName) msg += ` Respecto al proyecto *${projectName}*`;
    if (lotNumber) msg += ` (Lote ${lotNumber})`;
    if (projectName || lotNumber) msg += `.`;
    msg += `\n\n¿Le gustaría agendar una visita o recibir más información?`;
    return buildWaUrl(phone, msg);
  },

  /** Recordatorio de pago */
  paymentReminder(phone: string, buyerName: string, amount: number, currency = 'CLP', dueDate: string): string {
    const msg = `Estimado/a ${buyerName}, le recordamos que tiene un pago programado de ${formatPrice(amount, currency)} con vencimiento el ${dueDate}.\n\n¿Necesita asistencia con el proceso de pago?`;
    return buildWaUrl(phone, msg);
  },

  /** Notificación de reserva confirmada */
  reservationConfirmation(phone: string, buyerName: string, lotNumber: string, projectName: string): string {
    const msg = `🎉 ¡Felicidades ${buyerName}! Su reserva del *Lote ${lotNumber}* en *${projectName}* ha sido confirmada exitosamente.\n\nNos pondremos en contacto para coordinar los próximos pasos del proceso de compra.`;
    return buildWaUrl(phone, msg);
  },
};
