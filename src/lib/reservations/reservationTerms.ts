/**
 * Condiciones de la reserva y cuenta de pago del formulario público.
 *
 * Al cambiar el texto de las condiciones, sube RESERVATION_TERMS_VERSION:
 * la versión aceptada queda guardada en `reservations.terms_version` y así se
 * sabe qué texto firmó cada comprador.
 */

export const RESERVATION_TERMS_VERSION = 'ot-reserva-2026-10-30';

export interface ReservationPaymentAccount {
  holder: string;
  holderRut: string;
  bank: string;
  accountNumber: string;
}

/** Cuenta que recibe las reservas por transferencia o depósito. */
export const RESERVATION_PAYMENT_ACCOUNT: ReservationPaymentAccount = {
  holder: 'Asesorías Terra SpA',
  holderRut: '77.333.862-0',
  bank: 'Banco Itaú',
  accountNumber: '0221332980',
};

/** Monto de modificación del borrador de escritura (cambio de titular, etc.). */
export const DEED_CHANGE_FEE_CLP = 50000;

export interface ReservationTermsClause {
  title: string;
  body: string;
}

const formatCLP = (value: number) => `$${Math.round(value).toLocaleString('es-CL')}`;

export const RESERVATION_TERMS: ReservationTermsClause[] = [
  {
    title: 'Reserva y forma de pago',
    body:
      'La reserva podrá hacerse en terreno o de forma online. Para ello, el cliente deberá pagar el monto de reserva ' +
      'informado en este formulario mediante transferencia electrónica, depósito, vale vista o cheque al día, ' +
      'nominativo y cruzado, a nombre del titular y en la cuenta indicados en el mismo, e informar el pago a su asesor. ' +
      'La suma pagada por concepto de reserva corresponde a gastos operacionales y servicios legales (notaría, ' +
      'inscripción en el Conservador de Bienes Raíces correspondiente, entrega de la inscripción, entre otros). El ' +
      'precio de la parcela se pagará al momento de la firma de la escritura de compraventa, en la notaría que la ' +
      'Inmobiliaria disponga, mediante transferencia o vale vista a nombre de la Inmobiliaria o de quien ésta indique, ' +
      'para ser cobrado a la fecha de la firma de la escritura. El monto pagado como reserva no constituye un abono al ' +
      'precio del predio reservado, sino que corresponde a los gastos señalados, y no será reembolsado en caso de ' +
      'desistimiento de la compra por parte del cliente. En tal caso, la Inmobiliaria quedará libre de toda obligación ' +
      'y podrá disponer libremente de la parcela reservada, y el cliente perderá la suma pagada por concepto de reserva, ' +
      'la cual quedará para la Inmobiliaria a título de indemnización de perjuicios, lo que el cliente acepta y entiende ' +
      'en su totalidad.',
  },
  {
    title: 'Vigencia de la reserva',
    body:
      'La parcela queda bloqueada para otros compradores por 48 horas desde el envío de este formulario. Si dentro de ' +
      'ese plazo no se acredita el pago de la reserva, la parcela vuelve a quedar disponible.',
  },
  {
    title: 'Naturaleza de los servicios',
    body:
      'La Inmobiliaria es una empresa dedicada al corretaje o intermediación de inmuebles rurales por cuenta propia y/o ' +
      'ajena. Los inmuebles que ofrece por cuenta ajena pertenecen a un tercero que le ha encomendado ofrecer y poner en ' +
      'venta sus propiedades.',
  },
  {
    title: 'Fecha y lugar de escritura',
    body:
      'La Inmobiliaria enviará el borrador de escritura de compraventa al correo electrónico proporcionado por el ' +
      'cliente. Una vez recibido, el cliente deberá señalar una fecha para la firma de la escritura, la que no podrá ' +
      'exceder de 10 días hábiles desde la recepción del borrador. Transcurrido este plazo, se entenderá que el cliente ' +
      'ha desistido de la compra, pudiendo la Inmobiliaria disponer libremente de la parcela reservada. No se hará ' +
      'devolución de pagos por concepto de reserva por causales imputables al cliente. El cliente deberá comparecer a ' +
      'firmar la escritura a la notaría que designe la Inmobiliaria dentro del plazo estipulado.',
  },
  {
    title: 'Entrega de documentación',
    body:
      'Para una compra segura, la Inmobiliaria proporciona como forma habitual de trabajo los documentos necesarios para ' +
      'su estudio, tales como: copia de la inscripción con certificado de vigencia; certificados de hipotecas, ' +
      'gravámenes y litigios; inscripción de dominio anterior; copia del plano de subdivisión; certificado del SAG que ' +
      'autoriza la subdivisión, y asignación de roles de avalúo del SII. Si el cliente desea realizar un estudio de ' +
      'títulos de la propiedad reservada, deberá contratar los servicios de un profesional de su confianza y solicitar la ' +
      'documentación adicional en las instituciones u organismos correspondientes, bajo su cargo y exclusiva ' +
      'responsabilidad.',
  },
  {
    title: 'Venta en verde',
    body:
      'Si la reserva es en verde, significa que aún no se encuentran disponibles todos los documentos necesarios para un ' +
      'cabal conocimiento del estado del predio (certificado del SAG, certificado de asignación de pre-roles y/o plano ' +
      'archivado en el Conservador de Bienes Raíces respectivo). Tan pronto la Inmobiliaria disponga de toda la ' +
      'documentación, ésta será enviada oportunamente y conjuntamente con el borrador de escritura. Sin perjuicio de lo ' +
      'anterior, la Inmobiliaria realiza un estudio de títulos con profesionales calificados y entrega los predios con ' +
      'toda la documentación en orden.',
  },
  {
    title: 'Borrador de escritura',
    body:
      'Luego de la entrega de documentación se enviará oportunamente el borrador de escritura. Será responsabilidad del ' +
      'cliente detectar cualquier error en la correcta individualización de la parte compradora, debiendo informarlo de ' +
      'inmediato para hacer las correcciones pertinentes. Todos los demás errores que el cliente, su asesor o el ' +
      'organismo correspondiente detecten serán subsanados sin costo alguno para él. Sin embargo, si el cliente desea ' +
      'cambiar el titular de la compra, agregar otro propietario o, en general, introducir cualquier cambio que ' +
      `modifique la escritura de compraventa, deberá pagar la suma de ${formatCLP(DEED_CHANGE_FEE_CLP)}, que deberá ` +
      'depositarse o transferirse a la cuenta de la Inmobiliaria antes de proceder a la modificación. Dicha ' +
      'modificación no altera el plazo inicial comprometido para la firma de la escritura.',
  },
  {
    title: 'Estado del inmueble',
    body:
      'La Inmobiliaria, al intermediar en la venta de la parcela, no ofrece parcelas con agua, permisos de construcción, ' +
      'electricidad u otros, salvo estipulación en contrario. Sólo se ofrece factibilidad de agua y factibilidad ' +
      'eléctrica. Por lo tanto, él o los propietarios de la parcela sólo se obligan a la entrega de ésta y a que quede ' +
      'debidamente inscrita en el Conservador de Bienes Raíces respectivo.',
  },
  {
    title: 'Factibilidad de agua',
    body:
      'Ofrecer factibilidad de agua significa que es el comprador quien determinará la forma de abastecerse de agua: ' +
      'construcción de pozo profundo o noria, estanque abastecido por un proveedor local, conexión a agua potable ' +
      'rural, entre otras. La decisión dependerá, por ejemplo, de la frecuencia de uso de la parcela y de las ' +
      'necesidades de cada comprador. Cualquier persona puede cavar pozos en suelo propio para la bebida y usos ' +
      'domésticos, conforme al Código de Aguas.',
  },
  {
    title: 'Factibilidad de luz',
    body:
      'Al igual que en el caso anterior, es el cliente quien deberá concurrir a la empresa eléctrica respectiva, para ' +
      'que ésta, bajo sus términos y condiciones, entregue el servicio. Se recomienda solicitar un proyecto eléctrico ' +
      'para toda la parcelación, ya que esta forma de organización ahorra recursos en su ejecución. Otra opción es la ' +
      'instalación de paneles solares, alternativa sustentable que no requiere una intervención mayor en el entorno.',
  },
  {
    title: 'Uso de suelos y construcciones',
    body:
      'Las parcelas que la Inmobiliaria intermedia son de uso agrícola. No obstante, en las parcelas de agrado pueden ' +
      'construirse hasta dos casas de uso habitacional, para lo cual deberá obtenerse el permiso municipal ' +
      'correspondiente. Es el cliente quien debe concurrir a la Dirección de Obras de la Municipalidad respectiva, ' +
      'presentando la documentación que exige la Ley General de Urbanismo y Construcciones y su Ordenanza.',
  },
  {
    title: 'Responsabilidad del asesor o vendedor',
    body:
      'La labor del asesor o vendedor es explicar de manera fidedigna cada cláusula del presente instrumento y cualquier ' +
      'materia relacionada con la venta del inmueble, además de mostrar en terreno las parcelas y sus respectivos ' +
      'límites o deslindes.',
  },
  {
    title: 'Precio oferta',
    body:
      'En los periodos en que existan ofertas en la venta de parcelas, no se podrá hacer entrega de vale vista con ' +
      'instrucciones (sin plazo ni condición alguna).',
  },
  {
    title: 'Pago de contribuciones',
    body:
      'La Inmobiliaria intermedia la venta de parcelas con rol de avalúo propio. Que la propiedad pague o no ' +
      'contribuciones lo determina exclusivamente el Servicio de Impuestos Internos, una vez activado el rol asignado, ' +
      'considerando el avalúo fiscal del predio de mayor extensión y la normativa vigente. Es responsabilidad de la ' +
      'Inmobiliaria que, al momento de la compra, la propiedad no tenga deudas por concepto de contribuciones; desde ese ' +
      'momento la obligación se traspasa al nuevo propietario.',
  },
  {
    title: 'Servidumbres de tránsito',
    body:
      'Habitualmente, el borrador de escritura contiene una cláusula que constituye una servidumbre de tránsito ' +
      'voluntaria, perpetua y gratuita: la parcela cederá metros de su superficie para la servidumbre de tránsito ' +
      'conforme al plano de subdivisión. Ésta será el camino de acceso, postación eléctrica, entre otras. En un ' +
      'proyecto de subdivisión predial, las servidumbres o caminos de paso son indispensables para acceder a la parcela ' +
      'desde el portón de la parcelación y conectarla con el camino público; se constituyen en la escritura de cada ' +
      'lote, y el comprador podrá usar las servidumbres constituidas por los demás parceleros para transitar y acceder a ' +
      'su propiedad.',
  },
  {
    title: 'Servidumbres especiales de tránsito',
    body:
      'Cuando las servidumbres proyectadas en el plano de subdivisión resulten imposibles, gravosas o de difícil ' +
      'ejecución, la Inmobiliaria proyectará estos caminos por un lugar distinto al señalado en el plano, creando una ' +
      'servidumbre no indicada en éste. Ello será informado por los asesores a los clientes, y la servidumbre se creará ' +
      'también en la escritura pública de compraventa, protocolizando el plano que indica los metros cedidos.',
  },
  {
    title: 'Construcción y mantención de servidumbres',
    body:
      'La Inmobiliaria no sólo intermedia la venta de parcelas: también realiza los accesos de servidumbre proyectados ' +
      'en el plano de subdivisión y, de ser necesarios, los portones de acceso. Una vez terminados, su mantención o ' +
      'mejora será de exclusiva responsabilidad de los nuevos propietarios, para lo cual se recomienda organizar la ' +
      'parcelación en su conjunto. Estos trabajos se realizan sin costo para los compradores a medida que las ' +
      'condiciones climáticas lo permitan, pudiendo suspenderse en periodos de lluvia. Se recomienda no transitar en ' +
      'periodos de lluvia por accesos no terminados, siendo de exclusiva responsabilidad de la persona cualquier ' +
      'contingencia derivada de ello.',
  },
  {
    title: 'Otras obras en la parcela',
    body:
      'La Inmobiliaria sólo intermedia la venta de parcelas y ejecuta los portones y accesos proyectados en el plano de ' +
      'subdivisión. Toda otra obra en la propiedad, como cercos o cierres perimetrales, pozos y construcciones en ' +
      'general, es de exclusiva responsabilidad del nuevo propietario.',
  },
  {
    title: 'Aceptación de las condiciones',
    body:
      'La aceptación de este formulario constituye, de forma expresa, libre y espontánea, la declaración del cliente de ' +
      'haber leído y conocer cada una de las cláusulas contenidas en el presente instrumento, y de que no tiene reparo, ' +
      'reclamo o condición alguna que formular a la Inmobiliaria o al vendedor.',
  },
];
