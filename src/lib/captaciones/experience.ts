import type { CaptacionStatus } from './status';

export const CAPTACION_NEXT_STEP: Record<CaptacionStatus, string> = {
  nueva: 'Gerencia debe revisar los antecedentes enviados.',
  en_revision: 'Gerencia está evaluando el terreno y sus antecedentes.',
  en_negociacion: 'Gerencia gestiona las condiciones con el propietario.',
  acuerdo_firmado: 'Falta preparar y publicar el terreno.',
  publicada: 'Revisa la publicación. Publicar no acredita una venta ni una comisión pagada.',
  rechazada: 'Revisa las observaciones de gerencia antes de volver a presentar el terreno.',
};
