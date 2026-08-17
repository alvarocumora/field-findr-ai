/**
 * Centro de ayuda: categorías y artículos del ecosistema de brokers.
 * El contenido es estático (SEO-friendly) y comparte las categorías con
 * el sistema de tickets para que soporte llegue clasificado.
 */

export type SupportCategory =
  | 'cuenta'
  | 'comisiones'
  | 'proyectos'
  | 'publicacion'
  | 'pagos'
  | 'tecnico'
  | 'otro';

export const SUPPORT_CATEGORIES: { value: SupportCategory; label: string; description: string }[] = [
  { value: 'cuenta', label: 'Cuenta y perfil', description: 'Registro, verificación, perfil público y red de referidos.' },
  { value: 'comisiones', label: 'Comisiones', description: 'Tasas, splits, overrides y estados de pago.' },
  { value: 'proyectos', label: 'Proyectos y loteos', description: 'Asignaciones, inventario de lotes y material de venta.' },
  { value: 'publicacion', label: 'Publicaciones', description: 'Publicar terrenos, aprobaciones y límites del plan.' },
  { value: 'pagos', label: 'Planes y pagos', description: 'Suscripciones, facturación y destacados.' },
  { value: 'tecnico', label: 'Soporte técnico', description: 'Errores, mapas, carga de archivos y rendimiento.' },
  { value: 'otro', label: 'Otro', description: 'Cualquier consulta que no encaje en las anteriores.' },
];

export const categoryLabel = (value: string) =>
  SUPPORT_CATEGORIES.find((c) => c.value === value)?.label ?? value;

export const TICKET_STATUSES = [
  { value: 'open', label: 'Abierto' },
  { value: 'in_progress', label: 'En curso' },
  { value: 'waiting_user', label: 'Esperando tu respuesta' },
  { value: 'resolved', label: 'Resuelto' },
  { value: 'closed', label: 'Cerrado' },
] as const;

export const statusLabel = (value: string) =>
  TICKET_STATUSES.find((s) => s.value === value)?.label ?? value;

export const TICKET_PRIORITIES = [
  { value: 'low', label: 'Baja' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
] as const;

export const priorityLabel = (value: string) =>
  TICKET_PRIORITIES.find((p) => p.value === value)?.label ?? value;

export interface HelpArticle {
  slug: string;
  category: SupportCategory;
  title: string;
  summary: string;
  body: string[];
}

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: 'como-ser-broker',
    category: 'cuenta',
    title: '¿Cómo me inscribo como broker?',
    summary: 'Postulación, revisión y activación de tu perfil público.',
    body: [
      'Completa el formulario en /brokers/inscripcion con tus datos, zonas de operación y experiencia.',
      'Un administrador revisa la postulación (normalmente en 24-48 horas hábiles) y activa tu perfil de broker con tu tasa de comisión base.',
      'Al activarse, obtienes tu link de referido, tu vitrina pública en /b/tu-slug y acceso al panel "Mi negocio".',
    ],
  },
  {
    slug: 'link-de-referido',
    category: 'cuenta',
    title: 'Cómo funciona mi link de referido',
    summary: 'Invita brokers y gana override sobre su red.',
    body: [
      'Tu link vive en "Mi negocio" e incluye tu código de invitación.',
      'Cuando alguien se inscribe con tu link queda ligado a tu red y aparece en /asesor/red.',
      'Sobre las ventas de tu red directa se calcula el override según la tasa configurada en tu perfil.',
    ],
  },
  {
    slug: 'calculo-comisiones',
    category: 'comisiones',
    title: 'Cómo se calculan y pagan las comisiones',
    summary: 'Tasa base, split de referido y estados de pago.',
    body: [
      'Cada venta registra el monto, la tasa aplicada y la comisión resultante en /asesor/comisiones.',
      'Si el lead vino de otro broker se genera un split de referido con su propio estado de pago.',
      'Los estados son pendiente, aprobada y pagada. El pago se marca por el administrador al liquidar.',
      'Si detectas una diferencia, abre un ticket en la categoría "Comisiones" indicando el ID de la venta.',
    ],
  },
  {
    slug: 'proyectos-en-venta',
    category: 'proyectos',
    title: 'Solicitar un proyecto para vender',
    summary: 'Marketplace de proyectos y asignaciones.',
    body: [
      'En /asesor/proyectos-en-venta ves los loteos disponibles con su comisión ofrecida.',
      'Envía una solicitud de asignación con un mensaje breve; el dueño del proyecto o un administrador la aprueba.',
      'Una vez aprobada, el proyecto aparece en tu atribución y tus leads quedan asociados a él.',
    ],
  },
  {
    slug: 'limites-de-publicacion',
    category: 'publicacion',
    title: 'Límites de publicación por plan',
    summary: 'Cuántos terrenos puedes publicar según tu plan.',
    body: [
      'Cada plan (Corredor, Corredora, Inmobiliaria, Grupo, Enterprise) define un máximo de publicaciones activas.',
      'El contador en tiempo real aparece en tu dashboard; al llegar al tope el formulario bloquea la publicación.',
      'Puedes archivar publicaciones antiguas o subir de plan en /pricing.',
    ],
  },
  {
    slug: 'aprobacion-publicaciones',
    category: 'publicacion',
    title: 'Mi publicación quedó "en revisión"',
    summary: 'Cola de aprobación y motivos de rechazo.',
    body: [
      'Toda publicación nueva pasa por una cola de aprobación para verificar ubicación, superficie y legalidad.',
      'Si falta información (ROL, deslindes o fotos) el equipo la rechaza indicando el motivo y puedes corregirla.',
      'Las validaciones de coordenadas y duplicados se ejecutan antes de enviar, en el paso "Ubicación".',
    ],
  },
  {
    slug: 'suscripcion-y-pagos',
    category: 'pagos',
    title: 'Cambiar de plan, facturación y destacados',
    summary: 'Suscripciones vía Mercado Pago y visibilidad pagada.',
    body: [
      'Los planes se contratan desde /pricing y se cobran vía Mercado Pago.',
      'Los destacados de proyecto se contratan aparte y muestran el loteo en la portada por el período pagado.',
      'Para problemas de cobro, abre un ticket en "Planes y pagos" con la fecha y el monto.',
    ],
  },
  {
    slug: 'problemas-mapa',
    category: 'tecnico',
    title: 'El mapa o los polígonos no cargan bien',
    summary: 'Pasos rápidos antes de escalar a soporte técnico.',
    body: [
      'Recarga la página con caché limpia y verifica tu conexión: los mapas descargan tiles satelitales pesados.',
      'En móvil, desactiva el modo ahorro de datos para permitir la carga 3D.',
      'Si persiste, abre un ticket "Soporte técnico" indicando el proyecto, el dispositivo y el navegador.',
    ],
  },
];

export const articlesByCategory = (category: SupportCategory) =>
  HELP_ARTICLES.filter((a) => a.category === category);
