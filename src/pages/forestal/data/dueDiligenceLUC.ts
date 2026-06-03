// AUTO-GENERATED from LUC_Financing_DueDiligence_Forestal_Valle_Escondida.xlsx
// Do not edit by hand — re-run scripts/generateLucDDPdfs to regenerate.

export type LucNivel = '1' | '2' | 'seccion';

export interface LucDDItem {
  numero: number;
  nivel: LucNivel;
  categoria: string;
  titulo: string;
  descripcion: string;
  slug: string;
  pdfUrl: string;
}

export const LUC_CATEGORIES: string[] = [
  "01 · Información Corporativa",
  "02 · Histórico Financiero",
  "03 · Uso de Fondos (CAPEX)",
  "04 · Cronograma y Desembolsos",
  "05 · Viabilidad y Operación",
  "06 · Modelo Financiero",
  "07 · Tracción Comercial",
  "08 · Estructura de Financiación",
  "09 · Información del Holding (Matriz)",
];

export const LUC_DD_ITEMS: LucDDItem[] = [
  {
    numero: 1,
    nivel: '1',
    categoria: "01 · Información Corporativa",
    titulo: "BUSINESS PLAN",
    descripcion: `Cuéntanos la historia y la estrategia de tu proyecto. Este documento es la pieza clave para que entendamos la lógica de tu negocio y el potencial de la inversión que solicitas.

¿Por qué es importante? Un buen plan de negocio permite que el analista vea la realidad estratégica detrás de las cifras, aportando la confianza necesaria para validar la viabilidad de la operación.

¿Qué puedes incluir aquí?

• Dossier del Proyecto o Plan de Negocio: Donde expliques qué haces, en qué mercados compites y tu ventaja diferencial.

• Memoria de Inversión: Un detalle de en qué vas a utilizar exactamente los fondos solicitados.

• Presentación Ejecutiva (Deck): Un resumen visual de tu modelo de negocio.

Nota: Si dispones de las proyecciones financieras en un archivo Excel, no te preocupes; tendrás un apartado específico para subirlas más adelante.`,
    slug: "01-business-plan",
    pdfUrl: "/dd-luc/01-business-plan.pdf",
  },
  {
    numero: 2,
    nivel: '1',
    categoria: "01 · Información Corporativa",
    titulo: "WEB",
    descripcion: `Facilítanos la URL de la web o landing page específica del proyecto a financiar. Aunque no es obligatorio, es muy recomendable: nos permite tangibilizar tu propuesta, ver tu producto en funcionamiento y entender tu posicionamiento mejor que cualquier documento escrito.

Instrucción Específica:

• Empresa Operativa: Usa el dominio principal de tu negocio.

• SPVs o Holdings: Si perteneces a un grupo de empresas, no enlaces la web corporativa general. Debes indicar la ruta de URL exacta

donde se detalla este proyecto específico a financiar (ej. grupocorp.com/proyecto-hotel-beta). Si el proyecto no tiene presencia digital propia ni sección dedicada, deja este campo en blanco.

Nota: Si el proyecto aún no tiene presencia digital o sección dedicada, puedes dejar este campo vacío sin problema.`,
    slug: "02-web",
    pdfUrl: "/dd-luc/02-web.pdf",
  },
  {
    numero: 3,
    nivel: '1',
    categoria: "01 · Información Corporativa",
    titulo: "DOCUMENTO DE CONSTITUCIÓN / ACTA FUNDACIONAL",
    descripcion: `Sube el documento oficial que acredita la creación legal de tu empresa ante las autoridades de tu país. Este archivo es la base para validar la identidad de tu sociedad, sus propietarios originales y la actividad para la que está habilitada.

¿Por qué es importante? Contar con este documento nos permite confirmar la capacidad legal de la empresa para operar, asegurando que el proyecto se construye sobre una base jurídica transparente y sólida para cualquier financiador.

¿Qué puedes incluir aquí (según tu país)?

• Articles of Incorporation / Certificate of Formation (EE.UU./UK).

• Acta o Escritura Constitutiva / Estatutos Sociales (Latinoamérica/España).

• Statuts de la société (Francia/Bélgica) o cualquier documento equivalente en tu legislación local.

Nota: Adjunta aquí únicamente el documento original de creación. Si tu empresa ha tenido cambios posteriores (como nuevos socios, administradores o cambios de domicilio), dispondrás de apartados específicos más abajo para subir esas actualizaciones.`,
    slug: "03-documento-de-constitucion-acta-fundacion",
    pdfUrl: "/dd-luc/03-documento-de-constitucion-acta-fundacion.pdf",
  },
  {
    numero: 4,
    nivel: '1',
    categoria: "01 · Información Corporativa",
    titulo: "ACTUALIZACIÓN DE CAPITAL / AMPLIACIÓN DE SOCIOS",
    descripcion: `Si tu empresa ha crecido incorporando nuevos socios o aumentando su capital social desde su creación, este documento es la evidencia legal de ese crecimiento. Permite que el sistema valide tu estructura de propiedad actual y tu fortaleza patrimonial vigente.

¿Por qué es importante? Contar con la información actualizada asegura que el análisis de solvencia se base en tu situación real a día de hoy, lo que facilita enormemente la aprobación de la operación por parte de las entidades financieras.

¿Qué puedes incluir aquí (según tu país)?

•  Share Issuance / Capital Increase Resolution (EE.UU./UK).

•  Escritura de Ampliación de Capital (España/Latinoamérica).

•  Acta de Asamblea o Junta de Socios donde se formalice el aumento de capital.

Nota: Si has realizado varias ampliaciones a lo largo del tiempo, solo necesitamos que adjuntes la más reciente. Con el documento más actual podemos validar el capital total acumulado sin necesidad de que busques todo el historial histórico.`,
    slug: "04-actualizacion-de-capital-ampliacion-de-s",
    pdfUrl: "/dd-luc/04-actualizacion-de-capital-ampliacion-de-s.pdf",
  },
  {
    numero: 5,
    nivel: '1',
    categoria: "01 · Información Corporativa",
    titulo: "AJUSTE DE CAPITAL / REDUCCIÓN DE FONDOS PROPIOS",
    descripcion: `Si tu empresa ha realizado una reducción de su capital social (ya sea por compensación de resultados, devolución de aportaciones a socios o amortización de acciones/participaciones), este documento es la evidencia legal de dicho ajuste. Permite que el análisis refleje con exactitud tu estructura de capital actual.

¿Por qué es importante? Mantener actualizada la información sobre tu capital social asegura que los ratios de solvencia se calculen sobre la base jurídica correcta, evitando confusiones durante el análisis de riesgos bancarios.

¿Qué puedes incluir aquí (según tu país)?

•  Reduction of Capital / Share Cancellation Certificate (EE.UU./UK).

•  Escritura de Reducción de Capital (España/Latinoamérica).

•  Acuerdo de Asamblea o Junta de Accionistas que formalice la disminución del capital.

Nota: Si has realizado varios ajustes a lo largo del tiempo, adjunta únicamente el documento más reciente. Nuestro objetivo es validar simplemente el Capital Social final resultante y tu situación patrimonial a día de hoy.`,
    slug: "05-ajuste-de-capital-reduccion-de-fondos-pr",
    pdfUrl: "/dd-luc/05-ajuste-de-capital-reduccion-de-fondos-pr.pdf",
  },
  {
    numero: 6,
    nivel: '1',
    categoria: "01 · Información Corporativa",
    titulo: "IDENTIFICACIÓN DE PROPIEDAD REAL (KYC)",
    descripcion: `Facilítanos el documento que identifica a las personas físicas que ostentan el control final de la sociedad (habitualmente, aquellos con una participación superior al 25%). Este es un requisito estándar de transparencia para cumplir con las normativas internacionales de 'Conozca a su Cliente' (KYC).

¿Por qué es importante? Contar con esta información permite verificar la identidad de los beneficiarios últimos de la empresa, lo que agiliza el proceso de validación legal y asegura que la operación cumpla con todos los estándares de seguridad bancaria.

Instrucción Específica:

•  Documento vigente: Adjunta únicamente el acta o certificado de titularidad real más reciente.

•  Sin cambios: Si la propiedad sigue siendo la misma que en la creación de la empresa, puedes volver a adjuntar el documento de constitución original aquí.

Nota: Este documento es necesario para todas las empresas que no coticen en mercados de valores regulados (Bolsa).`,
    slug: "06-identificacion-de-propiedad-real-kyc",
    pdfUrl: "/dd-luc/06-identificacion-de-propiedad-real-kyc.pdf",
  },
  {
    numero: 7,
    nivel: '1',
    categoria: "01 · Información Corporativa",
    titulo: "ESTRUCTURA DE ACCIONARIADO (CAP TABLE)",
    descripcion: `Facilítanos un resumen actualizado de la composición de la propiedad de tu empresa. Mientras que los documentos fundacionales reflejan el inicio de la sociedad, este cuadro nos ofrece la visión operativa y real de quiénes son los accionistas y qué porcentaje de control ostentan a día de hoy.

¿Por qué es importante? Contar con una estructura de propiedad clara y actualizada permite que el sistema valide rápidamente el gobierno corporativo de la compañía, transmitiendo una imagen de transparencia y orden profesional ante las entidades financieras.

¿Qué puedes incluir aquí?

•  Cap Table / Shareholder Register: Un documento o tabla interna que detalle los nombres de los socios y sus porcentajes de participación.

•  Libro de Registro de Socios: O cualquier certificado interno que refleje el reparto actual de acciones o participaciones.

Nota: Asegúrate de que los porcentajes sumen el 100% y que los nombres coincidan con la documentación legal más reciente para garantizar la máxima agilidad en el análisis.`,
    slug: "07-estructura-de-accionariado-cap-table",
    pdfUrl: "/dd-luc/07-estructura-de-accionariado-cap-table.pdf",
  },
  {
    numero: 8,
    nivel: 'seccion',
    categoria: "02 · Histórico Financiero",
    titulo: "HISTORICO FINANCIERO Y RESULTADOS",
    descripcion: `Aporta la información financiera que mejor refleje la trayectoria de tu negocio. El sistema prioriza automáticamente aquellos documentos que cuenten con validación externa u oficial, lo que agiliza el proceso de auditoría y aporta mayor solidez a tu informe final.

¿Cómo seleccionar el documento correcto? Para cada año, intenta siempre aportar el archivo de mayor rango oficial disponible en tu país. Aquí tienes una guía de referencia por orden de preferencia:

1. Información Auditada: Cuentas revisadas por un auditor externo independiente (Máxima fiabilidad).

2. Declaraciones Fiscales: Documentos oficiales presentados ante la autoridad tributaria de tu país (ej. Impuesto sobre Sociedades).

3. Cuentas Depositadas: Documentos registrados legalmente ante los registros públicos o mercantiles competentes.

4. Reportes Internos: Estados financieros de gestión o archivos Excel, recomendados principalmente para el año fiscal en curso o empresas de nueva creación.

Nota importante para el Excel: Esta fila actúa únicamente como encabezado del bloque informativo. Por favor, no adjuntes archivos en esta línea. Encontrarás los apartados específicos para subir cada tipo de documento en las filas que aparecen justo debajo.`,
    slug: "08-historico-financiero-y-resultados",
    pdfUrl: "/dd-luc/08-historico-financiero-y-resultados.pdf",
  },
  {
    numero: 9,
    nivel: '2',
    categoria: "02 · Histórico Financiero",
    titulo: "ESTADOS FINANCIEROS AUDITADOS",
    descripcion: `Aporta los informes financieros que hayan sido revisados y firmados por un auditor externo independiente. Al contar con una verificación de terceros, estos documentos proporcionan el nivel más alto de confianza y transparencia sobre la salud de tu negocio, facilitando una respuesta más rápida por parte de las entidades financieras.

¿Cómo completar este apartado?

•  Solo periodos auditados: Adjunta en esta sección únicamente los ejercicios fiscales que dispongan de un informe de auditoría completo.

•  Flexibilidad: Si tu empresa no ha auditado algunos de los años solicitados, simplemente deja este espacio vacío; podrás aportar tus declaraciones fiscales o estados internos en las filas que verás a continuación.

•  Identificación: En la descripción del archivo, indícanos qué años estás incluyendo (ej: 'Auditoría 2022 y 2023').

Nota: Siempre que dispongas de auditorías, prioriza su subida. Estos documentos eliminan dudas técnicas y permiten que el análisis de tu proyecto alcance su máximo potencial de solidez.`,
    slug: "09-estados-financieros-auditados",
    pdfUrl: "/dd-luc/09-estados-financieros-auditados.pdf",
  },
  {
    numero: 10,
    nivel: '2',
    categoria: "02 · Histórico Financiero",
    titulo: "DECLARACIONES FISCALES OFICIALES",
    descripcion: `Aporta las declaraciones oficiales del impuesto sobre el beneficio de tu empresa presentadas ante la autoridad tributaria de tu país. Al ser documentos validados ante la administración pública, proporcionan una base de confianza muy sólida sobre la realidad de tus ingresos y la salud de tu negocio.

¿Por qué es importante? Estos documentos actúan como un respaldo oficial de tus estados financieros. Son fundamentales para dar consistencia a tu análisis de riesgos, especialmente para aquellos años en los que la empresa no haya contado con una auditoría externa.

¿Qué puedes incluir aquí (ejemplos según el país)?

•  Modelo 200 (España).

•  Form 1120 (Estados Unidos).

•  CT600 (Reino Unido) o el equivalente en tu jurisdicción local.

Instrucción Específica:

•  Cubre los huecos: Adjunta en esta sección únicamente los periodos que no hayas cubierto ya con un informe de auditoría en la fila superior.

•  Identificación: En la descripción del archivo, especifica qué años estás incluyendo (ej: 'Impuesto Sociedades 2022 y 2023').

Nota: Aportar documentación oficial para todos los años cerrados es la mejor forma de evitar retrasos en la aprobación y garantizar que tu informe de bancabilidad sea lo más robusto posible.`,
    slug: "10-declaraciones-fiscales-oficiales",
    pdfUrl: "/dd-luc/10-declaraciones-fiscales-oficiales.pdf",
  },
  {
    numero: 11,
    nivel: '2',
    categoria: "02 · Histórico Financiero",
    titulo: "ESTADOS FINANCIEROS REGISTRADOS OFICIALMENTE",
    descripcion: `Aporta las cuentas anuales que han sido depositadas o legalizadas ante el registro público o mercantil de tu país. Estos documentos tienen validez legal frente a terceros y permiten que el sistema verifique tu histórico financiero de forma oficial.

¿Por qué es importante? Presentar documentos registrados oficialmente demuestra transparencia y orden en la gestión de tu empresa. Es la alternativa ideal para aquellos ejercicios fiscales en los que no se dispone de una auditoría externa.

¿Qué puedes incluir aquí (ejemplos según el país)?

•  Cuentas Depositadas en el Registro Mercantil (España/Latinoamérica).

•  Financial Statements filed at Companies House (Reino Unido).

•  Public Filings / Annual Reports ante el registro correspondiente de tu jurisdicción.

Instrucción Específica:

•  Completa tu histórico: Utiliza este apartado para subir los años que no hayas podido cubrir con Auditorías (Fila anterior) o Declaraciones Fiscales.

•  Identificación: En la descripción del archivo, indícanos qué ejercicios estás adjuntando (ej: 'Cuentas Depositadas 2022 y 2023').

Nota: Si no dispones de registros oficiales para años ya cerrados, podrás aportar estados financieros internos en la siguiente sección, aunque te recomendamos siempre priorizar la documentación oficial para obtener un análisis de solvencia más ágil y sólido.`,
    slug: "11-estados-financieros-registrados-oficialm",
    pdfUrl: "/dd-luc/11-estados-financieros-registrados-oficialm.pdf",
  },
  {
    numero: 12,
    nivel: '2',
    categoria: "02 · Histórico Financiero",
    titulo: "ESTADOS FINANCIEROS DE GESTIÓN (INTERNOS)",
    descripcion: `Sube aquí los balances y cuentas de resultados generados directamente por tu sistema contable o en formato Excel. Estos reportes son fundamentales para entender el desempeño más reciente de tu empresa y su evolución en el año en curso.

¿Cuándo es necesario aportar estos documentos?

• Empresas de reciente creación: Si tu sociedad es nueva y aún no ha tenido que presentar cuentas oficiales ante el registro o el fisco.

• Análisis del año en curso: Para que el sistema evalúe tu crecimiento actual y los cambios recientes en tu estructura (ej. nuevas inversiones o líneas de financiación).

• Completar el historial: Si para algún año anterior no dispones de documentación oficial cerrada (Auditada o Registrada).

Instrucción Específica:

•  Contenido: Asegúrate de que el archivo incluya tanto el Balance de Situación como la Cuenta de Pérdidas y Ganancias (P&G).

•  Identificación: En la descripción del archivo, especifica qué meses o año cubre el reporte (ej: 'Balance Enero-Agosto 2025' o 'Cierre Provisional 2024').

Nota: Siempre que un ejercicio anual esté totalmente cerrado y oficializado, prioriza el uso de los documentos de las categorías superiores (Auditados, Fiscales o Registrados). Esto aporta la máxima solidez a tu informe final y reduce los tiempos de verificación técnica.`,
    slug: "12-estados-financieros-de-gestion-internos",
    pdfUrl: "/dd-luc/12-estados-financieros-de-gestion-internos.pdf",
  },
  {
    numero: 13,
    nivel: 'seccion',
    categoria: "03 · Uso de Fondos (CAPEX)",
    titulo: "EVIDENCIA DOCUMENTAL DE USO DE FONDOS (DETALLE Y JUSTIFICACIÓN DE LA INVERSIÓN)",
    descripcion: `Define con precisión en qué vas a emplear la financiación solicitada. Aportar evidencias claras sobre el destino de los fondos es el factor que más confianza genera en las entidades financieras, ya que garantiza que el capital se utilizará para hacer crecer el proyecto de forma segura.

¿Cómo presentar una inversión sólida? Para que el análisis sea ágil y positivo, intenta, en la medida de lo posible, que la suma de los documentos que aportes en las filas de abajo coincida con el importe total del préstamo que has solicitado.

Tipos de documentos recomendados:

1. Compromisos en firme: Contratos ya firmados con proveedores o acuerdos 'llave en mano' (Máxima solidez).

2. Presupuestos Oficiales: Facturas proforma o presupuestos detallados que identifiquen claramente al proveedor.

3. Planes Técnicos: Desgloses internos detallados con estimaciones de mercado si aún no tienes proveedores finales.

Instrucción importante para el Excel: Esta fila es un encabezado de sección para organizar tu información. No adjuntes archivos en esta línea. Encontrarás los apartados específicos para cada tipo de gasto (maquinaria, obras, personal, etc.) en las filas siguientes.

Nota: Te recomendamos aportar documentación oficial para garantizar que tu informe de bancabilidad refleje la máxima solidez posible.`,
    slug: "13-evidencia-documental-de-uso-de-fondos-de",
    pdfUrl: "/dd-luc/13-evidencia-documental-de-uso-de-fondos-de.pdf",
  },
  {
    numero: 14,
    nivel: '2',
    categoria: "03 · Uso de Fondos (CAPEX)",
    titulo: "ADQUISICIÓN DE ACTIVOS INMOBILIARIOS",
    descripcion: `Completa esta sección únicamente si una parte de la financiación se destinará a la compra de terrenos, naves industriales, oficinas o locales comerciales. Documentar correctamente esta inversión permite que el propio inmueble actúe como la garantía principal de la operación, facilitando el acceso a crédito.

¿Por qué es importante? Se validará que el precio de compra sea coherente con el valor de mercado actual. Aportar documentos oficiales reduce la incertidumbre del analista y asegura que la estructura de garantías de tu proyecto sea sólida desde el primer día.

¿Qué documentos puedes aportar?

1. Contrato de Compraventa (SPA), Reserva o Señal firmado, junto con un informe de valoración o tasación oficial realizado por una entidad certificada en los últimos 6 meses.

2. Ofertas Formales: Oferta vinculante de compra y un certificado de titularidad actualizado (emitido por el Registro de la Propiedad o autoridad competente) que acredite que el bien está libre de cargas.

3. Acuerdos no vinculantes, informes de valoración de mercado o comparativas de precios de la zona.

Instrucción Específica:

•  Identificación: En la descripción del archivo, indica el Número de Identificación del Inmueble (Referencia Catastral, Parcel ID o equivalente) para agilizar su validación.

•  Titularidad: Asegúrate de que el vendedor que figura en tu contrato coincida con el titular que aparece en el registro de la propiedad.

Nota: Aportar una tasación profesional reciente es la mejor forma de blindar tu solicitud.`,
    slug: "14-adquisicion-de-activos-inmobiliarios",
    pdfUrl: "/dd-luc/14-adquisicion-de-activos-inmobiliarios.pdf",
  },
  {
    numero: 15,
    nivel: '2',
    categoria: "03 · Uso de Fondos (CAPEX)",
    titulo: "CONSTRUCCIÓN, REFORMAS Y ADECUACIÓN",
    descripcion: `Utiliza esta sección si parte de la financiación se destina a la construcción, ampliación o reforma de activos inmobiliarios. Documentar correctamente estos costes asegura que tu proyecto cuente con un presupuesto cerrado y los permisos necesarios para evitar cualquier interrupción administrativa.

¿Por qué es importante? La obra civil es una partida crítica. Aportar contratos y licencias claras permite que el sistema valide la viabilidad técnica de la inversión, eliminando dudas sobre posibles sobrecostes y garantizando que el activo estará operativo en los plazos previstos.

¿Qué documentos puedes aportar?

1. Contrato de precio cerrado o 'Llave en Mano' (EPC) firmado con la constructora, junto con la licencia o permiso de obra ya concedido.

2. Presupuesto detallado por partidas (materiales, mano de obra, mediciones) firmado por un técnico o empresa, junto con el resguardo de solicitud de los permisos ante la autoridad local.

3. Presupuestos globales o estimaciones técnicas y declaraciones responsables de obra.

Instrucción Específica:

• Derecho de Uso: Asegúrate de adjuntar el documento que acredite que la empresa tiene la propiedad o el derecho de uso del inmueble donde se realizará la obra.

• Detalle Técnico: Evita presupuestos con "importes globales" sin desglose. Cuanto más detallado sea el documento, más rápido podrá el sistema validar la inversión.

• Permisos locales: Si por la naturaleza de la obra no necesitas licencia, adjunta una breve nota técnica justificando la exención según la normativa de tu zona.`,
    slug: "15-construccion-reformas-y-adecuacion",
    pdfUrl: "/dd-luc/15-construccion-reformas-y-adecuacion.pdf",
  },
  {
    numero: 16,
    nivel: '2',
    categoria: "03 · Uso de Fondos (CAPEX)",
    titulo: "EQUIPAMIENTO Y MAQUINARIA PRODUCTIVA",
    descripcion: `Utiliza esta sección si la inversión se destina a maquinaria, robótica, líneas de producción, vehículos industriales o equipos especializados. Documentar correctamente estos activos permite validar la capacidad operativa de tu negocio y asegurar que la tecnología elegida es la adecuada para alcanzar tus objetivos de producción.

¿Por qué es importante? El equipamiento es el motor de tu proyecto. Aportar información técnica clara permite confirmar que tu inversión generará los rendimientos previstos y facilita que la maquinaria sea considerada como una garantía sólida para la financiación.

Documentación recomendada:

1. Contrato de compra o leasing firmado, fichas técnicas detalladas del fabricante (Specs) y contrato de mantenimiento y operación (O&M).

2. Facturas proforma oficiales que identifiquen claramente al proveedor, junto con las fichas técnicas o catálogos del fabricante.

3. Presupuestos globales, estimaciones técnicas preliminares o capturas de equipos de referencia.

Instrucción Específica:

• Identificación del Proveedor: Asegúrate de que el documento muestre la identificación fiscal del proveedor, el modelo exacto de la máquina y el año de fabricación.

• Rendimiento Técnico: Es muy recomendable adjuntar la ficha técnica donde se detallen consumos, rendimientos o capacidades de producción. Esto permite al sistema validar que la máquina es capaz de cumplir con los ingresos que has proyectado en tu plan de negocio.`,
    slug: "16-equipamiento-y-maquinaria-productiva",
    pdfUrl: "/dd-luc/16-equipamiento-y-maquinaria-productiva.pdf",
  },
  {
    numero: 17,
    nivel: '2',
    categoria: "03 · Uso de Fondos (CAPEX)",
    titulo: "INFRAESTRUCTURA E INSTALACIONES TÉCNICAS",
    descripcion: `Utiliza esta sección si parte de la financiación se destina a instalaciones fijas necesarias para la operatividad, como frío industrial, sistemas de energía, climatización, suministros o seguridad. Documentar correctamente estas partidas asegura que tu infraestructura cumpla con la normativa técnica y garantiza la continuidad de tu actividad comercial.

¿Por qué es importante? Las instalaciones técnicas son el soporte de tu producción. Aportar evidencias claras sobre su legalización y presupuesto permite validar que el proyecto es viable a largo plazo, reduciendo riesgos operativos.

Documentación recomendada:

1. Contrato de ejecución (Llave en Mano/EPC), proyecto técnico certificado por un ingeniero y certificados de cumplimiento o legalización ante las autoridades locales.

2. Presupuesto detallado y firmado por un proveedor autorizado, junto con una memoria técnica que describa las capacidades y potencias de la instalación.

3. Presupuestos globales, estimaciones preliminares o resúmenes de necesidades técnicas.

Instrucción Específica:

• Legalización: Si la instalación requiere registros específicos ante organismos reguladores (depósitos de gas, alta tensión, etc.), es muy recomendable adjuntar el resguardo de solicitud o el proyecto aprobado.

• Energías Renovables: Para instalaciones de autoconsumo (como placas solares), adjunta el estudio de ahorro energético. Esto permitirá que validemos la reducción de gastos operativos que has proyectado en tu plan de negocio.`,
    slug: "17-infraestructura-e-instalaciones-tecnicas",
    pdfUrl: "/dd-luc/17-infraestructura-e-instalaciones-tecnicas.pdf",
  },
  {
    numero: 18,
    nivel: '2',
    categoria: "03 · Uso de Fondos (CAPEX)",
    titulo: "SERVICIOS PROFESIONALES Y COSTES DE DESARROLLO (DEVEX)",
    descripcion: `Utiliza esta sección para incluir los gastos de ingeniería, arquitectura, consultoría legal y tasas administrativas necesarias antes de iniciar la ejecución del proyecto. Documentar estos 'costes invisibles' demuestra que tu operación tiene una base técnica y legal sólida, garantizando que el proyecto cuenta con todos los estudios previos necesarios para tener éxito.

¿Por qué es importante? Contar con estudios de impacto, tasaciones o asesoramiento especializado reduce la incertidumbre del financiador. Demuestra que el capital solicitado para la gestión previa está alineado con los precios de mercado y que el proyecto ya está en una fase de ejecución real.

Documentación recomendada:

1. Contratos de servicios profesionales firmados, hojas de encargo validadas por la autoridad competente y justificantes de pago de tasas gubernamentales.

2. Presupuestos detallados de consultoras o ingenierías (que incluyan su identificación fiscal) y estudios de viabilidad técnica o económica previos.

3. Propuestas de servicios preliminares o estimaciones de honorarios basadas en estándares del sector.

Instrucción Específica:

• Claridad en el gasto: Incluye aquí exclusivamente honorarios de técnicos, licencias administrativas, estudios ambientales, tasaciones y asesoramiento legal/financiero.

• Separación de partidas: Por favor, no incluyas en esta sección costes de obra civil o compra de maquinaria; esos activos tienen sus propios apartados específicos.`,
    slug: "18-servicios-profesionales-y-costes-de-desa",
    pdfUrl: "/dd-luc/18-servicios-profesionales-y-costes-de-desa.pdf",
  },
  {
    numero: 19,
    nivel: '2',
    categoria: "03 · Uso de Fondos (CAPEX)",
    titulo: "DESARROLLO DE SOFTWARE Y ACTIVOS TECNOLÓGICOS",
    descripcion: `Utiliza esta sección si solicitas financiación para la creación de Apps, plataformas SaaS, algoritmos o soluciones de software a medida. Documentar correctamente este desarrollo permite que la inversión sea considerada un activo de la empresa (CAPEX) en lugar de un gasto corriente, fortaleciendo significativamente tu balance.

¿Por qué es importante? El software es un activo intangible complejo de valorar. Aportar un plan técnico sólido y contratos claros garantiza que el proyecto tiene una hoja de ruta profesional, mitigando los riesgos de ejecución y asegurando que la propiedad intelectual pertenezca legalmente a tu compañía.

Documentación recomendada:

1. Contrato de desarrollo firmado con hitos de pago vinculados a entregables técnicos, informe de viabilidad firmado por un responsable tecnológico (CTO) y cláusulas explícitas de cesión de propiedad intelectual.

2. Análisis funcional detallado (arquitectura) y presupuesto desglosado por fases de desarrollo con un cronograma de ejecución (Gantt o similar).

3. Presupuestos globales de agencias de desarrollo o propuestas técnicas preliminares sin desglose de fases.

Instrucción Específica:

• Propiedad Intelectual: Asegúrate de que los documentos especifiquen que la empresa solicitante es la propietaria del código fuente. Este punto es vital para que el software compute como un activo de valor para el análisis.

• Desarrollo Interno: Si el software se crea con equipo propio, es muy recomendable adjuntar el cálculo de horas/empleado y el organigrama técnico para justificar la inversión de personal en el activo.

• Detalle del Producto: Evita estimaciones genéricas (ej: 'Creación de App: 50k'). Cuanta más información aportes sobre la arquitectura técnica, más solidez tendrá la valoración del intangible.`,
    slug: "19-desarrollo-de-software-y-activos-tecnolo",
    pdfUrl: "/dd-luc/19-desarrollo-de-software-y-activos-tecnolo.pdf",
  },
  {
    numero: 20,
    nivel: '2',
    categoria: "03 · Uso de Fondos (CAPEX)",
    titulo: "INVERSIÓN EN MARKETING",
    descripcion: `Utiliza esta sección si parte de la financiación se destina a la adquisición de clientes, posicionamiento de marca, publicidad o lanzamientos. Documentar correctamente estos gastos permite validar que tu estrategia comercial tiene un respaldo profesional y que los fondos solicitados están enfocados a escalar tu negocio de forma sostenible.

¿Por qué es importante? El marketing es el motor de tus ventas. Aportar presupuestos y planes de medios detallados genera confianza sobre tu capacidad para alcanzar las proyecciones de ingresos de tu plan de negocio, asegurando que cada dólar invertido tiene un objetivo de retorno claro.

Documentación recomendada:

1. Contratos firmados con agencias de marketing o compradores de medios (Media Buyers) que incluyan objetivos de rendimiento (KPIs), junto con un plan de medios anual profesional.

2. Facturas proforma oficiales de proveedores (ej. Google Ads, Meta, agencias creativas) que incluyan su identificación fiscal y propuestas de servicios detalladas.

3. Planes de inversión internos (Excel o PDF) desglosados por canales y meses, incluso si aún no cuentas con presupuestos de terceros.

Instrucción Específica:

• Foco en el Coste: En esta sección necesitamos validar el importe de la inversión. Por favor, asegúrate de que el documento muestre claramente los costes mensuales o por campaña (ej. 'Inversión mensual en canales digitales: 5.000€').

• Identificación de Proveedores: Es muy recomendable que los presupuestos incluyan la identificación fiscal (Tax ID, NIT, CIF, RFC o equivalente) de la agencia o proveedor para agilizar su verificación.

• Contenido del Documento: No es necesario adjuntar aquí manuales de marca o creatividades. Céntrate en los documentos que justifiquen el importe total que solicitas financiar.`,
    slug: "20-inversion-en-marketing",
    pdfUrl: "/dd-luc/20-inversion-en-marketing.pdf",
  },
  {
    numero: 21,
    nivel: '2',
    categoria: "03 · Uso de Fondos (CAPEX)",
    titulo: "INVERSIÓN EN TALENTO Y EQUIPO HUMANO ESTRATÉGICO",
    descripcion: `Utiliza esta sección si la financiación se destina a la contratación de nuevos perfiles clave o a la ampliación de tu fuerza laboral para ejecutar el plan de expansión. Proporcionar un desglose claro de estas incorporaciones permite validar que tu estructura humana está alineada con tus objetivos de ventas y que el proyecto cuenta con los recursos necesarios para tener éxito.

¿Por qué es importante? Un equipo bien planificado reduce el riesgo de ejecución. Aportar evidencias sobre las futuras contrataciones asegura que los costes de personal (incluyendo salarios y cargas sociales) están correctamente presupuestados, evitando imprevistos financieros durante el crecimiento de la empresa.

Documentación recomendada:

1.Cartas de oferta (Job Offers) o cartas de intención firmadas por candidatos clave, junto con contratos de servicios con agencias de selección o headhunters.

2. Plan de contratación detallado (Excel o PDF) que especifique el rol, el salario bruto anual, las cargas sociales o impuestos derivados del empleo y la fecha prevista de incorporación.

3. Organigrama proyectado y estimaciones de masa salarial por departamentos, incluso si los perfiles específicos aún no han sido identificados.

Instrucción Específica:

• Organigrama Futuro: Es muy recomendable adjuntar un organigrama que muestre cómo quedará la estructura de la empresa tras la inversión. Esto ayuda a validar que el equipo es coherente con el volumen de actividad previsto en tu plan de negocio.

• Enfoque en Crecimiento: Esta sección debe centrarse exclusivamente en las nuevas incorporaciones necesarias para el proyecto. Para garantizar la mejor valoración, evita incluir aquí el pago de nóminas actuales o deudas salariales pasadas, ya que la financiación debe percibirse como un motor de valor futuro.

• Coste Total: Asegúrate de que tus cálculos incluyan no solo el salario neto, sino el coste total empresa (impuestos, beneficios y seguridad social según la normativa de tu país).`,
    slug: "21-inversion-en-talento-y-equipo-humano-est",
    pdfUrl: "/dd-luc/21-inversion-en-talento-y-equipo-humano-est.pdf",
  },
  {
    numero: 22,
    nivel: '2',
    categoria: "03 · Uso de Fondos (CAPEX)",
    titulo: "INVERSIÓN EN INVENTARIOS Y EXISTENCIAS",
    descripcion: `Utiliza esta sección si la financiación se destina a la adquisición de stock, materias primas o el llenado de almacén para iniciar o expandir tu actividad. Documentar correctamente esta partida permite validar tu ciclo operativo y asegura que cuentas con los recursos necesarios para cumplir con las previsiones de ventas de tu plan de negocio.

¿Por qué es importante? El inventario es el activo más cercano al efectivo. Aportar evidencias sobre tus proveedores y la demanda prevista genera confianza sobre tu capacidad de repago, demostrando que la inversión se transformará en ingresos de forma ágil y eficiente.

Documentación recomendada:

1. Contratos de suministro con precios cerrados, pedidos en firme de clientes (Back-to-back) o un historial de rotación de stock verificado.

2. Facturas proforma detalladas de proveedores (con su identificación fiscal) y un plan de aprovisionamiento vinculado a tus previsiones de ventas.

3. Presupuestos genéricos, tarifas oficiales de proveedores o estimaciones internas de necesidades de stock.

Instrucción Específica:

• Sincronización de plazos: Para una valoración óptima, asegúrate de que el plazo del préstamo solicitado guarde coherencia con el tiempo que tardas habitualmente en vender el producto. Se valora positivamente que la deuda se amortice en paralelo al ciclo de venta del inventario.

• Tipo de Stock: Si la inversión es para un 'Stock de Seguridad' permanente (por ejemplo, por la apertura de una nueva sede), acláralo en la descripción. Esto nos permite entender que se trata de una inversión estructural y no solo de una necesidad puntual de tesorería.

• Identificación del Proveedor: Es muy recomendable que los documentos identifiquen claramente al proveedor (Nombre y Tax ID/CIF/RFC). Esto permite validar la solvencia de tu cadena de suministro y garantiza la viabilidad del proyecto.`,
    slug: "22-inversion-en-inventarios-y-existencias",
    pdfUrl: "/dd-luc/22-inversion-en-inventarios-y-existencias.pdf",
  },
  {
    numero: 23,
    nivel: '1',
    categoria: "04 · Cronograma y Desembolsos",
    titulo: "PLANIFICACIÓN DE DESEMBOLSOS (CRONOGRAMA)",
    descripcion: `Define en qué momentos exactos necesitarás disponer del capital solicitado.

¿Por qué es importante? La precisión en el tiempo es tan valiosa como la precisión en el importe. Un calendario de hitos bien definido transmite seguridad al financiador/inversor, demostrando que el dinero se inyectará a medida que el proyecto crece y alcanza sus metas.

Documentación recomendada:

1. Cronograma detallado (Gantt): Vinculado a los hitos de pago de tus proveedores o contratos de obra. Cada euro solicitado tiene una fecha asociada a un avance real.

2. Excel de Disposiciones Mensuales: Un desglose mes a mes que coincida con los plazos de entrega que figuran en tus facturas proforma y presupuestos.

3. Calendario por Fases Globales: División del capital por etapas principales (ej: 30% al inicio, 40% a mitad de proyecto, 30% al cierre).

Instrucción específica:

• Hitos de Pago: Intenta definir momentos claros de desembolso basados en hitos técnicos. Ejemplo: "Desembolso 2: 200.000€ tras la certificación de la estructura" o "Hito 3: 50.000€ a la entrega del prototipo final".

• Coherencia del Presupuesto: Asegúrate de que la suma de todos los desembolsos coincida exactamente con el 100% del presupuesto de inversión que has definido en los pasos anteriores.

• Eficiencia: Si solicitas el 100% de la financiación en una disposición única a la firma, es recomendable justificar técnicamente la necesidad de liquidez inmediata para evitar que el sistema lo interprete como una ineficiencia en la estructura de deuda.`,
    slug: "23-planificacion-de-desembolsos-cronograma",
    pdfUrl: "/dd-luc/23-planificacion-de-desembolsos-cronograma.pdf",
  },
  {
    numero: 24,
    nivel: '1',
    categoria: "05 · Viabilidad y Operación",
    titulo: "VIABILIDAD TÉCNICA Y PROPIEDAD INTELECTUAL (IP)",
    descripcion: `Utiliza esta sección para aportar los documentos que protejan tus activos tecnológicos, innovaciones o procesos industriales únicos. Documentar tu propiedad intelectual e industrial permite validar que tu propuesta cuenta con un respaldo legal sólido y una ventaja competitiva real en el mercado.

¿Cuándo es necesaria esta información? Aportar esta documentación es clave si tu proyecto se basa en la innovación, el desarrollo de software o procesos tecnológicos propios. Si tu negocio opera en un sector tradicional o de servicios que no depende de tecnología exclusiva, puedes omitir este apartado sin que afecte a la valoración de tu informe.

¿Por qué es importante? La robustez de tu tecnología y su protección legal determinan la seguridad del modelo de negocio a largo plazo. Aportar patentes, registros o memorias técnicas reduce la incertidumbre sobre la exclusividad de tu proyecto y asegura al financiador que el valor de la empresa está debidamente blindado.

Documentación recomendada:

1. Protección Total: Títulos de concesión de patentes otorgados por la autoridad competente, junto con informes de viabilidad o auditorías técnicas firmadas por expertos independientes o el responsable tecnológico (CTO).

2. Protección en Curso: Solicitudes de patentes en trámite con informe positivo sobre el estado de la técnica, acompañadas de análisis funcionales o memorias técnicas detalladas de la ingeniería.

3. Protección Básica: Registros de marcas, modelos de utilidad o diseños industriales, junto con la hoja de ruta de desarrollo (Roadmap) del producto.

Instrucción Específica:

• Propiedad de la Innovación: Asegúrate de que los documentos demuestren que la propiedad de los registros pertenece a la empresa solicitante. El sistema valora especialmente que la tecnología sea un activo propio de la sociedad.

• Alternativas al Registro: Si tu ventaja competitiva se basa en un 'secreto comercial' no registrado, intenta aportar una memoria técnica que describa la complejidad del proceso. Esto ayuda al sistema a valorar tu barrera de entrada frente a otros competidores.

Nota: Te recomendamos aportar documentación oficial y firmada para garantizar que tu informe de bancabilidad refleje la máxima solidez posible.`,
    slug: "24-viabilidad-tecnica-y-propiedad-intelectu",
    pdfUrl: "/dd-luc/24-viabilidad-tecnica-y-propiedad-intelectu.pdf",
  },
  {
    numero: 25,
    nivel: '1',
    categoria: "05 · Viabilidad y Operación",
    titulo: "LICENCIAS Y PERMISOS DE ACTIVIDAD (OPERACIÓN)",
    descripcion: `Utiliza esta sección para aportar los documentos que autorizan legalmente la puesta en marcha o la continuidad de tu actividad comercial.

¿Cuándo es necesaria esta información? Es fundamental para negocios ya operativos que necesitan demostrar que su actividad es legal, o para proyectos nuevos que necesitan el permiso final para empezar a vender (ej. hostelería, salud, industria o inmobiliario). Si lo que tienes es un permiso de construcción, súbelo en la sección de 'Construcción_Reformas'; aquí buscamos el permiso de apertura o uso final.

¿Por qué es importante? Documentar que tienes 'luz verde' para operar garantiza que tu flujo de ingresos no se verá interrumpido por sanciones o cierres. En el sector inmobiliario, esto es lo que convierte un edificio en un producto legal que se puede vender, alquilar o hipotecar.

Documentación recomendada:

1. Licencia de Funcionamiento / Apertura: Licencia definitiva, certificado de primera ocupación (en inmobiliario) o resoluciones sectoriales definitivas (registros sanitarios, turísticos, etc.).

2. Habilitación Provisional: Declaraciones responsables de inicio de actividad o comunicaciones previas selladas que permitan abrir las puertas legalmente mientras se tramita la definitiva.

3. Certificaciones Técnicas: Informes de conformidad o certificados finales de instalaciones que acrediten que el activo cumple con la normativa para su uso previsto.

Instrucción Específica:

• Diferenciación: No adjuntes aquí facturas de tasas o proyectos de obra (eso va en DEVEX u OBRA). Aquí necesitamos el documento administrativo que dice: 'Usted puede abrir y operar'.

Nota: Te recomendamos aportar documentación oficial y vigente para garantizar que tu informe de bancabilidad refleje la máxima solidez posible."`,
    slug: "25-licencias-y-permisos-de-actividad-operac",
    pdfUrl: "/dd-luc/25-licencias-y-permisos-de-actividad-operac.pdf",
  },
  {
    numero: 26,
    nivel: '1',
    categoria: "05 · Viabilidad y Operación",
    titulo: "ACUERDOS ESTRATÉGICOS DE SUMINISTRO",
    descripcion: `Utiliza esta sección para aportar los contratos o acuerdos que aseguren la provisión de tus insumos críticos, como energía (gas, electricidad), materias primas o suministros industriales clave.

¿Cuándo es necesaria esta información? Es clave si tu negocio tiene un alto consumo energético o depende de materias primas específicas para producir. Si eres una empresa de servicios o de consultoría sin dependencia de suministros industriales, puedes omitir este apartado.

¿Por qué es importante? Documentar que tienes asegurados tus suministros a precios estables protege tu margen de beneficio frente a la volatilidad del mercado. Para un financiador, esto garantiza que tu capacidad de generar caja es real y no se verá erosionada por subidas inesperadas en los costes de producción.

Documentación recomendada:

1. Contratos de suministro a precio cerrado (Hedging) a largo plazo o acuerdos de acceso a infraestructuras críticas con operadores líderes del sector.

2. Acuerdos de Prioridad: Contratos de exclusividad o prioridad de suministro que incluyan fórmulas de precio predefinidas para mitigar variaciones de mercado.

3. Compromisos de Intención: Cartas de intención (LOI) de proveedores estratégicos o presupuestos oficiales con validez extendida que aseguren el suministro durante la fase de lanzamiento.

Instrucción Específica:

• Suministros Energéticos: Si tu proyecto depende intensamente de la electricidad o el gas, adjuntar un contrato de precio fijo permite validar la estabilidad de tus gastos operativos (OPEX) con total precisión.

• Materias Primas: Asegúrate de que los acuerdos identifiquen claramente al proveedor. Se valora positivamente que tus socios comerciales sean empresas con solvencia contrastada para evitar riesgos en la cadena de suministro.`,
    slug: "26-acuerdos-estrategicos-de-suministro",
    pdfUrl: "/dd-luc/26-acuerdos-estrategicos-de-suministro.pdf",
  },
  {
    numero: 27,
    nivel: '1',
    categoria: "06 · Modelo Financiero",
    titulo: "MODELO FINANCIERO Y PROYECCIONES",
    descripcion: `Sube aquí el modelo económico de tu proyecto. Este archivo es el corazón del análisis, ya que permite validar la viabilidad de tu estrategia y asegurar que tu negocio sea resiliente ante diferentes escenarios de mercado.

Recomendación Fundamental: Para realizar un análisis dinámico y preciso, es recomendable que el archivo esté en formato Excel editable (.xlsx), ya que precisamos verificar la integridad de las fórmulas y la lógica financiera.

¿Por qué es importante? Un modelo financiero profesional demuestra rigor y transparencia. Permite al sistema y a los analistas entender de dónde vienen tus ingresos y cómo planeas gestionar tus gastos, lo que agiliza drásticamente la aprobación de la operación.

Documentación recomendada:

1. Modelo Integral (3-Way): Incluye Cuenta de Resultados (PyG), Balance de Situación y Flujo de Caja (Cash Flow) integrados, acompañados de un análisis de sensibilidad (escenarios base, optimista y pesimista).

2. Modelo Detallado: Proyecciones a mínimo 5 años (60 meses) con todas las hipótesis de crecimiento y costes desglosadas por partidas operativas.

3. Modelo Simplificado: Proyecciones básicas de ingresos y gastos sin balance proyectado y/o sin análisis de escenarios.

Instrucción Específica:

• Trazabilidad de Ingresos: Evita proyecciones basadas en porcentajes genéricos (ej. 'crecer un 10% anual'). Es muy recomendable vincular tus ingresos a métricas reales (ej. Número de Clientes x Ticket Medio). Esto da una solidez total a tu discurso financiero.

• Coherencia con la Inversión: Asegúrate de que las cifras de inversión (CAPEX) que aparecen en tu modelo coincidan exactamente con el importe que has solicitado en la sección de 'Uso de Fondos'.

• Transparencia en Fórmulas: Intenta no utilizar 'cifras escritas' dentro de las fórmulas. Se valora positivamente que la lógica del modelo sea auditable y trazable.`,
    slug: "27-modelo-financiero-y-proyecciones",
    pdfUrl: "/dd-luc/27-modelo-financiero-y-proyecciones.pdf",
  },
  {
    numero: 28,
    nivel: 'seccion',
    categoria: "07 · Tracción Comercial",
    titulo: "EVIDENCIAS Y RESPALDO DOCUMENTAL DE INGRESOS",
    descripcion: `Define la solidez comercial de tu proyecto aportando pruebas tangibles de tu capacidad para generar ingresos. Documentar la tracción de tu negocio es el factor determinante para que el sistema valide tu capacidad de repago y declare la operación como bancable.

¿Por qué es importante? El análisis financiero busca confirmar que tus ventas proyectadas tienen un respaldo real. Al aportar contratos, acuerdos o un plan de captación profesional, demuestras que tu modelo de negocio tiene 'encaje' en el mercado y que los ingresos previstos son suficientes para cubrir cómodamente las cuotas de la financiación.

Tipos de evidencias recomendadas:

1. Compromisos en Firme: Contratos de venta ya firmados, acuerdos de compra garantizada (Off-take) o contratos de ingresos recurrentes con clientes identificados.

2. Acuerdos Preliminares: Cartas de Intención (LOIs) firmadas que detallen volúmenes y precios, o preacuerdos comerciales con alta probabilidad de cierre.

3. Contexto Comercial: Listado de oportunidades en proceso (Sales Pipeline de tu CRM) y una estrategia de lanzamiento o captación de clientes (Go-to-Market) bien estructurada.

Instrucción importante para el Excel: Esta fila es un encabezado de sección para organizar tu documentación. No adjuntes archivos en esta línea. Encontrarás los apartados específicos para contratos, preventas y estrategias comerciales en las filas siguientes.

Requisito mínimo de análisis: Para poder emitir un veredicto de solvencia, es imprescindible aportar al menos una (1) evidencia comercial en cualquiera de las subcategorías de este bloque. Sin una prueba mínima de tracción futura, el análisis de bancabilidad no podrá completarse con éxito.

Nota: Te recomendamos priorizar documentos que demuestren compromisos reales de clientes para garantizar que tu informe refleje la máxima solidez comercial posible.`,
    slug: "28-evidencias-y-respaldo-documental-de-ingr",
    pdfUrl: "/dd-luc/28-evidencias-y-respaldo-documental-de-ingr.pdf",
  },
  {
    numero: 29,
    nivel: '2',
    categoria: "07 · Tracción Comercial",
    titulo: "CONTRATOS DE VENTA Y ACUERDOS EN FIRME",
    descripcion: `Aporta aquí los contratos de venta o servicios a largo plazo que ya han sido firmados con tus clientes. Estos documentos representan la máxima garantía de ingresos, ya que transforman tus proyecciones en compromisos legales de cobro.

¿Por qué es importante? Contar con contratos en firme elimina las dudas sobre la demanda de tu producto. Al existir un compromiso de pago por parte de tus clientes, se valida tu capacidad para generar caja con la mayor solidez posible, lo que genera una gran confianza en el análisis de riesgos.

¿Qué puedes incluir aquí (ejemplos de ingresos)?

• Contratos de Compra Garantizada (Off-take / Take-or-Pay): Donde el cliente se obliga a adquirir tu producción.

• Acuerdos de Venta de Energía (PPAs): Si vendes electricidad o renovables.

• Suscripciones o Servicios Recurrentes: Contratos de mantenimiento o licencias SaaS ya firmados por clientes.

• Contratos de Alquiler / Arrendamiento: Si tu negocio recibe rentas de activos.

Instrucción Específica:

• Diferenciación: Usa esta sección exclusivamente para los contratos donde tú eres el vendedor. Si tienes contratos para asegurar tus compras (luz, gas, materias primas), esos deben ir en la sección de 'Acuerdos Estratégicos de Suministro'.

• Documentación alternativa: Si tus acuerdos comerciales aún no han alcanzado el grado de contrato firmado, deja esta sección vacía y utiliza cualquiera de las categorías posteriores para documentar tu tracción. Ya sea mediante Cartas de Intención (LOIs), tu Pipeline de ventas o tu Plan de Marketing.`,
    slug: "29-contratos-de-venta-y-acuerdos-en-firme",
    pdfUrl: "/dd-luc/29-contratos-de-venta-y-acuerdos-en-firme.pdf",
  },
  {
    numero: 30,
    nivel: '2',
    categoria: "07 · Tracción Comercial",
    titulo: "ÓRDENES DE COMPRA Y COMPROMISOS DE INTENCIÓN (LOIs)",
    descripcion: `Aporta aquí los documentos que demuestren que ya existen clientes listos para comprar tu producto o servicio en el corto plazo. Esta sección es vital para validar que tus previsiones de ventas iniciales tienen un respaldo real en el mercado.

¿Por qué es importante? Contar con órdenes de compra o cartas de intención (LOIs) reduce la incertidumbre sobre el éxito del lanzamiento o la expansión. Al identificar volúmenes y precios pactados, se confirma que existe una demanda real y activa, lo que otorga una alta fiabilidad a tu capacidad de generación de ingresos.

¿Qué puedes incluir aquí?

• Cartas de Intención (LOIs) o Memorandos de Entendimiento (MOUs): Acuerdos preliminares que, aunque no sean contratos definitivos, ya detallan la intención de compra.

• Órdenes de Compra (Purchase Orders - PO): Pedidos específicos recibidos de clientes.

• Facturas Proforma Aceptadas: Presupuestos que ya han recibido el visto bueno del cliente para su ejecución.

Instrucción Específica:

• Detalles del Cliente: Para una valoración óptima, asegúrate de que los documentos identifiquen al cliente (Nombre/Razón Social), el volumen de compra previsto y el precio pactado.

• Documentación alternativa: Si aún no dispones de pedidos concretos o cartas firmadas, deja esta sección vacía y utiliza las categorías siguientes (Pipeline CRM o Estrategia de Marketing) para documentar cómo vas a captar a tus clientes. Emplearemos esa información para valorar tu potencial comercial.`,
    slug: "30-ordenes-de-compra-y-compromisos-de-inten",
    pdfUrl: "/dd-luc/30-ordenes-de-compra-y-compromisos-de-inten.pdf",
  },
  {
    numero: 31,
    nivel: '2',
    categoria: "07 · Tracción Comercial",
    titulo: "PIPELINE COMERCIAL",
    descripcion: `Utiliza esta sección para aportar el listado de oportunidades comerciales que tu equipo está gestionando actualmente. Este documento sirve como evidencia de gestión, demostrando que existe una actividad comercial constante y un interés real del mercado por tu propuesta.

¿Por qué es importante? Contar con un 'Pipeline' activo valida la capacidad de tu empresa para generar demanda. Aunque se trata de una evidencia contextual (ventas aún no cerradas), permite al sistema entender el origen de tus ingresos proyectados y confirma que tienes una estrategia de ventas profesionalizada.

¿Qué puedes incluir aquí?

• Exportación de CRM: Un informe detallado de tu gestor de ventas (Hubspot, Salesforce, Pipedrive, etc.).

• Listado de Oportunidades: Un archivo que identifique al cliente potencial, el importe estimado de la operación y la fase de la negociación (ej. Lead, Oferta Enviada, Negociación Avanzada).

Instrucción Específica:

• Complemento de Ingresos: Utiliza esta categoría para dar contexto a aquellas cifras de tu plan de negocio que aún no tienen respaldo en contratos firmados o pedidos en firme.

• Diferenciación: Al igual que en la sección de Contratos de Venta, aquí solo debes incluir oportunidades de generación de ingresos. Las negociaciones con proveedores para tus compras deben ir en la sección de Acuerdos Estratégicos de Suministro.

• Documentación alternativa: Si ya has cubierto la totalidad de tus ingresos proyectados con contratos o pedidos en las categorías superiores, puedes dejar este espacio vacío. Si no es así, y tampoco dispones de un listado detallado, deberás justificar tu tracción en la siguiente sección: Plan de Marketing.`,
    slug: "31-pipeline-comercial",
    pdfUrl: "/dd-luc/31-pipeline-comercial.pdf",
  },
  {
    numero: 32,
    nivel: '2',
    categoria: "07 · Tracción Comercial",
    titulo: "PLAN DE MARKETING",
    descripcion: `Define aquí tu estrategia de Go-to-Market y la lógica operativa que seguirás para alcanzar los objetivos de ventas de tu modelo financiero. Este documento es la evidencia contextual que explica al sistema de dónde vendrá tu demanda futura y cómo planeas captar a tus clientes de forma estructurada.

¿Por qué es importante? Los números en un Excel necesitan una base estratégica para ser creíbles. Un plan de marketing sólido valida que tu crecimiento es realista y que has calculado correctamente el esfuerzo necesario para multiplicar tus ventas, lo que reduce drásticamente la incertidumbre para los analistas de riesgos.

¿Qué debe incluir este documento?

• Canales de Captación: Detalle de las vías de entrada de clientes (ej. SEO, SEM, Venta Directa, Afiliados o Alianzas).

• Métricas de Eficiencia: Tu presupuesto publicitario previsto y el Coste de Adquisición (CAC) estimado para tu sector.

• Lógica de Retorno: Una explicación de cómo el capital invertido en marketing se traduce en un retorno comercial (ROAS/ROI) que sustente tus proyecciones.

Instrucción Específica:

• Diferenciación de Conceptos: No confundas esta sección con la justificación de costes de inversión. Mientras que en Inversión en Marketing subes el presupuesto o factura, aquí debes subir la estrategia que explica por qué ese gasto generará las ventas previstas.

• Compensación de Ingresos: Utiliza esta categoría para dar soporte a todas aquellas ventas proyectadas que aún no cuentan con el respaldo de Contratos de Venta u Órdenes de Compra.

• Realismo Estratégico: Asegúrate de que tu CAC sea coherente con los márgenes de tu industria. Una estrategia bien fundamentada es la mejor herramienta para evitar dudas sobre la generación de caja de tu proyecto.`,
    slug: "32-plan-de-marketing",
    pdfUrl: "/dd-luc/32-plan-de-marketing.pdf",
  },
  {
    numero: 33,
    nivel: '2',
    categoria: "07 · Tracción Comercial",
    titulo: "ESTUDIO DE MERCADO",
    descripcion: `Utiliza esta sección para aportar los datos y análisis que demuestren que existe una demanda real para tu producto y un espacio competitivo donde crecer.

¿Cuándo es necesaria esta información? Es especialmente valioso para proyectos en fase de lanzamiento o expansión que necesitan demostrar que su sector tiene capacidad para absorber su oferta. Si ya has aportado contratos firmados que cubren el 100% de tus ventas, este apartado es opcional.

¿Por qué es importante? Proporciona el contexto estadístico necesario para validar que tus proyecciones financieras están alineadas con la realidad de tu industria. Reforzar tu propuesta con datos externos fiables transforma las hipótesis en oportunidades contrastadas, reduciendo la percepción de riesgo ante el financiador.

Documentación recomendada:

• Informes de Terceros: Estudios sectoriales de fuentes reconocidas (ej. Gartner, Statista, informes de consultoras o asociaciones industriales líderes).

• Dimensionamiento de Mercado: Análisis detallado que identifique tu TAM (Mercado Total), SAM (Mercado Direccionable) y SOM (Mercado Objetivo que planeas captar).

• Análisis Competitivo: Estudio de la competencia directa e indirecta, identificando tu propuesta de valor diferenciadora y las barreras de entrada del sector.

Instrucción Específica:

• Soporte de Crecimiento: Utiliza esta categoría para dar solidez a tus previsiones de ingresos, especialmente si aún no cuentas con Contratos de Venta u Órdenes de Compra que demuestren tracción directa.

• Aterrizaje de Datos: Intenta que los datos no sean solo genéricos. Para obtener una mejor valoración, conecta las cifras del mercado con tu modelo de negocio específico para demostrar cómo vas a absorber esa cuota de mercado.`,
    slug: "33-estudio-de-mercado",
    pdfUrl: "/dd-luc/33-estudio-de-mercado.pdf",
  },
  {
    numero: 34,
    nivel: '2',
    categoria: "08 · Estructura de Financiación",
    titulo: "ESTRUCTURA DE DEUDA Y POOL BANCARIO",
    descripcion: `Utiliza esta sección para detallar las fuentes de financiación que tu empresa tiene activas en este momento. Proporcionar una visión clara de tus compromisos actuales es el paso fundamental para identificar tu capacidad de crecimiento y asegurar que la nueva operación es viable dentro de tu estructura de pasivo.

¿Por qué es importante? La exactitud en el Pool Bancario permite determinar el 'espacio' de deuda disponible para tu negocio. Una estructura de deuda bien organizada y documentada transmite profesionalidad y facilita que los analistas validen tu capacidad de repago.

Instrucciones de Preparación:

• Formato Obligatorio: Es imprescindible adjuntar un archivo Excel editable (.xlsx). Puedes, de manera adicional, adjuntar informes oficiales (como CIRBE en España o registros de crédito internacionales).

• Contenido Detallado: Para cada producto financiero (préstamos, pólizas de crédito, leasing, etc.), el Excel debe incluir las siguientes columnas:



- Entidad: Nombre de la institución financiera.


- Tipo de Producto: Naturaleza de la deuda (Préstamo, Línea de Crédito, Leasing, etc.).


- Límite Concedido: El importe total original del contrato.


- Importe Dispuesto: El saldo vivo o cantidad pendiente de pago a fecha de hoy.


- Vencimiento: Fecha exacta de finalización del contrato.

Nota: Te recomendamos aportar información actualizada y detallada para garantizar que tu informe de bancabilidad refleje la máxima transparencia y solidez financiera.`,
    slug: "34-estructura-de-deuda-y-pool-bancario",
    pdfUrl: "/dd-luc/34-estructura-de-deuda-y-pool-bancario.pdf",
  },
  {
    numero: 35,
    nivel: '2',
    categoria: "08 · Estructura de Financiación",
    titulo: "CONTRATOS DE FINANCIACIÓN VIGENTES",
    descripcion: `Aporta aquí las escrituras o contratos de tus préstamos y líneas de crédito más importantes que se encuentren actualmente en vigor. Documentar las condiciones legales de tu pasivo permite validar que la nueva operación es totalmente compatible con tu estructura financiera actual.

¿Por qué es importante? Revisar el marco legal de tus deudas vigentes garantiza que no existan restricciones que impidan la entrada de capital nuevo.

¿Qué buscamos en estos documentos?

• Compromisos de Gestión (Covenants): Analizamos si existen acuerdos que requieran informar o solicitar permiso a tus bancos actuales antes de contratar nueva deuda.

• Planificación de Cuotas: Identificamos el calendario exacto de tus pagos para calcular con precisión tu ratio de cobertura y asegurar que tu caja siempre esté saludable.`,
    slug: "35-contratos-de-financiacion-vigentes",
    pdfUrl: "/dd-luc/35-contratos-de-financiacion-vigentes.pdf",
  },
  {
    numero: 36,
    nivel: '1',
    categoria: "08 · Estructura de Financiación",
    titulo: "CONDICIONES DE LA NUEVA FINANCIACIÓN (TERM SHEET)",
    descripcion: `Aporta aquí el documento que define los términos económicos y legales de la operación que estás solicitando o que ya tienes pre-aprobada. Este archivo funciona como la hoja de ruta financiera, permitiendo validar que el préstamo está diseñado para impulsar el éxito de tu activo sin comprometer su operatividad.

¿Por qué es importante? La Term Sheet es el esqueleto que sostiene la viabilidad del proyecto. Documentar con precisión el coste y los plazos de la deuda asegura que el 'servicio de la deuda' (tus cuotas) esté en total armonía con los ingresos previstos en tu Business Plan, garantizando un crecimiento estable y seguro.

Contenido clave que debe incluir el documento:

• Importe del préstamo: El capital total solicitado para la operación.
• Condiciones Económicas: Tipo de interés (fijo o diferencial sobre índices como Euribor, SOFR, etc.).
• Temporalidad: Plazo total de amortización y periodos de carencia si los hubiera.

Nota: Asegúrate de que los intereses y plazos descritos aquí coincidan con los que has modelado en tus Proyecciones Financieras.`,
    slug: "36-condiciones-de-la-nueva-financiacion-ter",
    pdfUrl: "/dd-luc/36-condiciones-de-la-nueva-financiacion-ter.pdf",
  },
  {
    numero: 37,
    nivel: '1',
    categoria: "08 · Estructura de Financiación",
    titulo: "CALENDARIO DE PAGOS Y AMORTIZACIÓN PROPUESTA",
    descripcion: `Define aquí el calendario de pagos detallado para la financiación que estás solicitando. En operaciones de Project Finance, este cuadro debe estar diseñado específicamente según el flujo de caja libre que generará tu activo, asegurando que las cuotas sean realistas y coherentes con la maduración de tu negocio.

¿Por qué es fundamental la sincronización? Un cuadro de amortización bien estructurado es la mejor prueba de que entiendes los tiempos de tu proyecto. Al alinear los pagos con la rampa de ingresos, proteges la tesorería de tu empresa y garantizas que el proyecto tenga siempre el 'oxígeno' financiero necesario para operar con éxito.

Instrucción Específica:

• Periodos de Carencia: Si tu proyecto requiere una fase de construcción o lanzamiento antes de generar ingresos, asegúrate de reflejar los periodos de carencia necesarios para evitar tensiones de caja en las etapas iniciales.`,
    slug: "37-calendario-de-pagos-y-amortizacion-propu",
    pdfUrl: "/dd-luc/37-calendario-de-pagos-y-amortizacion-propu.pdf",
  },
  {
    numero: 38,
    nivel: '1',
    categoria: "08 · Estructura de Financiación",
    titulo: "ACTIVOS Y GARANTÍAS REALES (COLATERALES)",
    descripcion: `Utiliza este apartado para documentar los activos específicos que respaldarán la operación. A diferencia de la visión contable tradicional, aquí puedes acreditar el valor de mercado actual de tus bienes, optimizando así la solidez de tu propuesta de financiación.

¿Por qué es fundamental esta sección? Presentar garantías tangibles y bien documentadas es la forma más directa de reducir la percepción de riesgo.

Calidad de la Documentación:

1. Valoración Profesional: Informes de tasación independientes (ej. RICS o entidades homologadas) con menos de 6 meses de antigüedad. Es la evidencia más sólida para validar el valor de mercado actual.

2. Títulos de Propiedad: Escrituras públicas o facturas de adquisición acompañadas de un certificado de titularidad o Nota Simple reciente.

3. Valoraciones Técnicas Internas: Informes o certificados firmados por la dirección financiera que detallen el valor estimado de los activos.

Nota: Aportar tasaciones oficiales recientes es la mejor estrategia para maximizar el valor de tus garantías.`,
    slug: "38-activos-y-garantias-reales-colaterales",
    pdfUrl: "/dd-luc/38-activos-y-garantias-reales-colaterales.pdf",
  },
  {
    numero: 39,
    nivel: 'seccion',
    categoria: "09 · Información del Holding (Matriz)",
    titulo: "HISTORICO FINANCIERO Y RESULTADOS DE LA MATRIZ (HOLDING)",
    descripcion: `Utiliza este apartado para aportar la información financiera del grupo empresarial al que perteneces. Este bloque solo es necesario si tu empresa cuenta con una sociedad matriz que respalda la operación.

¿Por qué es importante? Aportar la visión global del grupo refuerza la solidez de tu solicitud. Demostrar que cuentas con el respaldo de un grupo fuerte facilita la aprobación de la financiación, ya que ofrece una garantía de estabilidad adicional para el proyecto.

Documentación recomendada (según nivel de oficialidad):

1. Cuentas Auditadas: Es el documento que genera mayor confianza, al contar con una verificación externa independiente.

2. Impuesto de Sociedades: El documento oficial presentado ante la administración tributaria.

3. Cuentas Depositadas: Documentos registrados oficialmente con validez frente a terceros.

4. Estados Financieros Internos: Úsalos exclusivamente para el año en curso o si aún no ha vencido el plazo legal para la presentación oficial del ejercicio anterior.

Instrucción Específica:

• Histórico de Solidez: Para reflejar una trayectoria estable, es muy recomendable aportar la información de los últimos 4 ejercicios cerrados.

• Calendario Oficial: Recuerda que, para ejercicios que ya han superado el plazo legal de presentación (habitualmente a partir de julio), se espera que los documentos aportados sean los oficiales (impuestos o depósitos).

• Diferenciación: Asegúrate de subir aquí solo los datos de la matriz. La información financiera propia de la empresa que solicita el préstamo debe ir en su sección correspondiente para que el análisis sea preciso.`,
    slug: "39-historico-financiero-y-resultados-de-la",
    pdfUrl: "/dd-luc/39-historico-financiero-y-resultados-de-la.pdf",
  },
  {
    numero: 40,
    nivel: '2',
    categoria: "09 · Información del Holding (Matriz)",
    titulo: "ESTADOS FINANCIEROS AUDITADOS DE LA MATRIZ",
    descripcion: `Aporta los informes financieros de tu sociedad matriz que hayan sido revisados y firmados por un auditor externo independiente. Al contar con una verificación de terceros sobre el holding, estos documentos proporcionan el nivel más alto de confianza sobre la solvencia del grupo, facilitando el respaldo a la nueva operación.

¿Cómo completar este apartado?

•  Solo periodos auditados: Adjunta en esta sección únicamente los ejercicios fiscales que dispongan de un informe de auditoría completo.

•  Flexibilidad: Si tu empresa no ha auditado algunos de los años solicitados, simplemente deja este espacio vacío; podrás aportar tus declaraciones fiscales o estados internos en las filas que verás a continuación.

•  Identificación: En la descripción del archivo, indícanos qué años estás incluyendo (ej: 'Auditoría 2022 y 2023').

Nota: Siempre que el grupo disponga de auditorías, prioriza su subida. Estos documentos eliminan dudas técnicas sobre la capacidad de soporte de los socios.`,
    slug: "40-estados-financieros-auditados-de-la-matr",
    pdfUrl: "/dd-luc/40-estados-financieros-auditados-de-la-matr.pdf",
  },
  {
    numero: 41,
    nivel: '2',
    categoria: "09 · Información del Holding (Matriz)",
    titulo: "DECLARACIONES FISCALES OFICIALES DE LA MATRIZ",
    descripcion: ``,
    slug: "41-declaraciones-fiscales-oficiales-de-la-m",
    pdfUrl: "/dd-luc/41-declaraciones-fiscales-oficiales-de-la-m.pdf",
  },
  {
    numero: 42,
    nivel: '2',
    categoria: "09 · Información del Holding (Matriz)",
    titulo: "ESTADOS FINANCIEROS REGISTRADOS DE LA MATRIZ",
    descripcion: `Aporta las cuentas anuales de la sociedad matriz que han sido depositadas o legalizadas ante el registro público o mercantil de su país. Estos documentos tienen validez legal frente a terceros y permiten verificar el histórico financiero del grupo de forma oficial.

¿Por qué es importante? Presentar documentos registrados oficialmente demuestra transparencia y orden en la gestión del holding. Es la alternativa ideal para los ejercicios en los que la matriz no dispone de auditoría externa.

¿Qué puedes incluir aquí (ejemplos según el país)?

•  Cuentas Depositadas en el Registro Mercantil (España/Latinoamérica).

•  Financial Statements filed at Companies House (Reino Unido).

•  Public Filings / Annual Reports ante el registro correspondiente de tu jurisdicción.

Instrucción Específica:

•  Completa tu histórico: Utiliza este apartado para subir los años que no hayas podido cubrir con Auditorías (Fila anterior) o Declaraciones Fiscales.

•  Identificación: En la descripción del archivo, indícanos qué ejercicios estás adjuntando (ej: 'Cuentas Depositadas 2022 y 2023').

Nota: Si no dispones de registros oficiales para años ya cerrados de la matriz, podrás aportar estados internos en la siguiente sección, aunque la documentación oficial siempre agiliza el análisis de solvencia.`,
    slug: "42-estados-financieros-registrados-de-la-ma",
    pdfUrl: "/dd-luc/42-estados-financieros-registrados-de-la-ma.pdf",
  },
  {
    numero: 43,
    nivel: '2',
    categoria: "09 · Información del Holding (Matriz)",
    titulo: "ESTADOS FINANCIEROS DE GESTIÓN (INTERNOS) DE LA MATRIZ",
    descripcion: `Sube aquí los balances y cuentas de resultados de la sociedad matriz generados por su sistema contable o en Excel. Estos reportes son clave para entender el desempeño más reciente del grupo y su evolución en el año en curso.

¿Cuándo es necesario aportar estos documentos?

• Empresas de reciente creación: Si tu sociedad es nueva y aún no ha tenido que presentar cuentas oficiales ante el registro o el fisco.

• Análisis del año en curso: Para que el sistema evalúe tu crecimiento actual y los cambios recientes en tu estructura (ej. nuevas inversiones o líneas de financiación).

• Completar el historial: Si para algún año anterior no dispones de documentación oficial cerrada (Auditada o Registrada).

Instrucción Específica:

•  Contenido: Asegúrate de que el archivo incluya tanto el Balance como la Cuenta de Pérdidas y Ganancias (P&G) de la matriz.

•  Identificación: En la descripción del archivo, especifica qué meses o año cubre el reporte (ej: 'Balance Enero-Agosto 2025' o 'Cierre Provisional 2024').

Nota: Siempre que un ejercicio anual de la matriz esté totalmente oficializado, prioriza el uso de categorías superiores (Auditados, Fiscales o Registrados) para dar la máxima solidez a tu informe final."`,
    slug: "43-estados-financieros-de-gestion-internos",
    pdfUrl: "/dd-luc/43-estados-financieros-de-gestion-internos.pdf",
  },
];
