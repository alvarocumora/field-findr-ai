/** Plantillas de notificación (WhatsApp / email) editables por el agente. */

export type NotificationEvent = 'lead_created' | 'visit_requested';
export type NotificationChannel = 'whatsapp' | 'email';
export type NotificationAudience = 'agent' | 'contact';

export interface TemplateKey {
  event: NotificationEvent;
  channel: NotificationChannel;
  audience: NotificationAudience;
}

export interface TemplateDefinition extends TemplateKey {
  id: string;
  title: string;
  description: string;
  subject?: string;
  body: string;
}

/** Variables disponibles en las plantillas. */
export const TEMPLATE_VARIABLES = [
  { token: '{{nombre}}', label: 'Nombre del interesado' },
  { token: '{{email}}', label: 'Email del interesado' },
  { token: '{{telefono}}', label: 'Teléfono del interesado' },
  { token: '{{propiedad}}', label: 'Título de la propiedad' },
  { token: '{{mensaje}}', label: 'Mensaje o consulta' },
  { token: '{{fecha}}', label: 'Fecha (visita o registro)' },
  { token: '{{agente}}', label: 'Nombre del agente' },
  { token: '{{enlace}}', label: 'Enlace a la ficha o al panel' },
] as const;

export const templateId = (k: TemplateKey) => `${k.event}:${k.channel}:${k.audience}`;

export const DEFAULT_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'lead_created:whatsapp:contact',
    event: 'lead_created',
    channel: 'whatsapp',
    audience: 'contact',
    title: 'WhatsApp al interesado · Nuevo lead',
    description: 'Mensaje que se abre con un clic para responder a un nuevo contacto.',
    body:
      'Hola {{nombre}}, soy {{agente}} de OFERTA TERRENOS. Vi tu consulta por "{{propiedad}}". ' +
      '¿Te acomoda que conversemos hoy? Puedo enviarte la ficha completa y coordinar una visita.',
  },
  {
    id: 'lead_created:email:agent',
    event: 'lead_created',
    channel: 'email',
    audience: 'agent',
    title: 'Email al agente · Nuevo lead',
    description: 'Aviso interno cuando alguien deja sus datos en tu publicación.',
    subject: 'Nuevo contacto por {{propiedad}}',
    body:
      'Recibiste un nuevo contacto.\n\n' +
      'Nombre: {{nombre}}\nEmail: {{email}}\nTeléfono: {{telefono}}\n' +
      'Propiedad: {{propiedad}}\nFecha: {{fecha}}\n\nMensaje:\n{{mensaje}}\n\nVer en tu panel: {{enlace}}',
  },
  {
    id: 'lead_created:email:contact',
    event: 'lead_created',
    channel: 'email',
    audience: 'contact',
    title: 'Email al interesado · Confirmación',
    description: 'Confirmación automática para quien deja sus datos.',
    subject: 'Recibimos tu consulta por {{propiedad}}',
    body:
      'Hola {{nombre}},\n\nGracias por tu interés en "{{propiedad}}". ' +
      'Tu consulta ya está en manos de {{agente}} y te contactaremos a la brevedad.\n\n' +
      'Puedes revisar la propiedad aquí: {{enlace}}\n\nEquipo OFERTA TERRENOS',
  },
  {
    id: 'visit_requested:whatsapp:contact',
    event: 'visit_requested',
    channel: 'whatsapp',
    audience: 'contact',
    title: 'WhatsApp al interesado · Visita',
    description: 'Mensaje de coordinación de visita en un clic.',
    body:
      'Hola {{nombre}}, soy {{agente}} de OFERTA TERRENOS. Recibí tu solicitud de visita a "{{propiedad}}" ' +
      'para el {{fecha}}. ¿Te confirmo ese horario?',
  },
  {
    id: 'visit_requested:email:agent',
    event: 'visit_requested',
    channel: 'email',
    audience: 'agent',
    title: 'Email al agente · Visita agendada',
    description: 'Aviso interno cuando solicitan una visita.',
    subject: 'Nueva solicitud de visita · {{propiedad}}',
    body:
      'Nueva solicitud de visita.\n\nNombre: {{nombre}}\nEmail: {{email}}\nTeléfono: {{telefono}}\n' +
      'Propiedad: {{propiedad}}\nFecha preferida: {{fecha}}\n\nNotas:\n{{mensaje}}\n\nGestionar: {{enlace}}',
  },
  {
    id: 'visit_requested:email:contact',
    event: 'visit_requested',
    channel: 'email',
    audience: 'contact',
    title: 'Email al interesado · Visita solicitada',
    description: 'Confirmación de que la visita fue registrada.',
    subject: 'Tu visita a {{propiedad}} está en revisión',
    body:
      'Hola {{nombre}},\n\nRegistramos tu solicitud de visita a "{{propiedad}}" para el {{fecha}}. ' +
      '{{agente}} te confirmará el horario definitivo.\n\nDetalle de la propiedad: {{enlace}}\n\nEquipo OFERTA TERRENOS',
  },
];

export const EVENT_LABELS: Record<NotificationEvent, string> = {
  lead_created: 'Nuevo lead',
  visit_requested: 'Visita agendada',
};

export type TemplateVars = Partial<Record<
  'nombre' | 'email' | 'telefono' | 'propiedad' | 'mensaje' | 'fecha' | 'agente' | 'enlace',
  string | null | undefined
>>;

/** Reemplaza {{variables}} y limpia las que no tengan valor. */
export function renderTemplate(body: string, vars: TemplateVars): string {
  return body
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) => {
      const value = (vars as Record<string, string | null | undefined>)[key];
      return value ? String(value) : '';
    })
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** Enlace click-to-chat de WhatsApp con el mensaje ya escrito. */
export function whatsappLink(phone: string, message: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
