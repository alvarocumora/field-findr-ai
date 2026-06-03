// Uso de Fondos · Master Loteo La Palmilla — respaldos individuales por línea de gasto.
// Cada item se publica como PDF en /public/dd-luc/uso-fondos/<slug>.pdf

export type LucMap = '14' | '15' | '16' | '17' | '18' | '19' | '20' | '21' | '22' | '37';

export interface UsoFondosItem {
  numero: number;
  slug: string;
  concepto: string;
  monto_clp_m: number;             // CLP en millones
  pct: number;                     // % del total facilidad (2.080M)
  naturaleza: 'CAPEX' | 'OPEX' | 'PIPELINE' | 'RESERVA';
  luc: LucMap[];                   // mapeo al checklist LUC
  descripcion: string;             // párrafo breve del propósito
  supuestos: string[];             // viñetas de supuestos / unidades / precio unitario
  respaldos: string[];             // documentos soporte a entregar
  proveedores?: string[];          // contrapartes referenciales (Chile)
  pdfUrl: string;
}

export interface UsoFondosPartida {
  numero: number;
  nombre: string;
  monto_clp_m: number;
  pct: number;
  naturaleza: 'CAPEX' | 'OPEX' | 'PIPELINE' | 'RESERVA';
  descripcion: string;
  items: UsoFondosItem[];
}

export const FACILIDAD_TOTAL_EUR = 2_000_000;
export const FACILIDAD_TOTAL_CLP_M = 2_080;
export const FX_EUR_CLP = 1_040;

const baseUrl = '/dd-luc/uso-fondos';

export const PARTIDAS: UsoFondosPartida[] = [
  {
    numero: 1,
    nombre: 'Urbanización Fase 1',
    monto_clp_m: 900,
    pct: 43,
    naturaleza: 'CAPEX',
    descripcion:
      'Obras de habilitación del loteo rústico (DL 3.516) para hijuelas 7, 8 y 10: caminos, accesos, factibilidad de servicios y demarcación. No incluye edificación.',
    items: [
      {
        numero: 1,
        slug: 'uf-01-caminos-interiores',
        concepto: 'Caminos interiores',
        monto_clp_m: 300,
        pct: 14.4,
        naturaleza: 'CAPEX',
        luc: ['15'],
        descripcion:
          'Movimiento de tierra, sub-base de ripio estabilizado, compactación con rodillo y construcción de cunetas en los ejes interiores que conectan los lotes de las hijuelas 7, 8 y 10.',
        supuestos: [
          'Aprox. 6,5 km lineales de camino interior · ancho faja 6 m',
          'Movimiento de tierras: ~12.000 m³ a CLP 8.500/m³',
          'Estabilizado granular: ~9.500 m³ a CLP 14.000/m³',
          'Cunetas y obras de drenaje menor: CLP 35M',
        ],
        respaldos: [
          'Presupuesto desglosado de constructora local (formato cubicación)',
          'Plano de planta y perfil longitudinal aprobado por ITO',
          '3 cotizaciones comparables de movimiento de tierras',
          'Contrato llave en mano o por administración delegada',
        ],
        proveedores: ['Constructora regional (Curicó / Talca)', 'Empresa de áridos certificada'],
        pdfUrl: `${baseUrl}/uf-01-caminos-interiores.pdf`,
      },
      {
        numero: 2,
        slug: 'uf-02-acceso-ruta-j70',
        concepto: 'Acceso principal Ruta J-70 y obras de arte',
        monto_clp_m: 60,
        pct: 2.9,
        naturaleza: 'CAPEX',
        luc: ['15'],
        descripcion:
          'Empalme del camino principal con la Ruta J-70 (alcantarillas, badenes, manejo de aguas lluvias) y resolución MOP / DV para acceso definitivo.',
        supuestos: [
          'Alcantarilla armco ø 1.000 mm + cabezales: CLP 22M',
          'Carpeta de aproximación asfáltica 60 m × 6 m: CLP 18M',
          'Trámite Resolución de Acceso DV / MOP: CLP 8M',
          'Señalética vial y demarcación: CLP 12M',
        ],
        respaldos: [
          'Permiso/Resolución de Acceso Vialidad MOP',
          'Cotización proveedor alcantarillas (Armco / Tigre)',
          'Presupuesto carpeta asfáltica e instalación de faena',
        ],
        proveedores: ['Vialidad MOP (autorización)', 'Constructora con experiencia vial'],
        pdfUrl: `${baseUrl}/uf-02-acceso-ruta-j70.pdf`,
      },
      {
        numero: 3,
        slug: 'uf-03-electrificacion-cge',
        concepto: 'Electrificación · extensión media tensión CGE',
        monto_clp_m: 300,
        pct: 14.4,
        naturaleza: 'CAPEX',
        luc: ['17'],
        descripcion:
          'Extensión de red de media tensión 15 kV CGE, postación, transformadores y empalmes monofásicos por lote. Partida crítica de plazo (gestión temprana).',
        supuestos: [
          'Extensión MT 15 kV: ~2,8 km a CLP 65M/km',
          '2 transformadores MT/BT 75 kVA: CLP 22M',
          'Postación y herrajes: CLP 38M',
          'Empalmes monofásicos referenciales 177 lotes (proporcional Fase 1)',
        ],
        respaldos: [
          'Carta de factibilidad eléctrica CGE (vigente)',
          'Presupuesto oficial CGE / contratista eléctrico autorizado',
          'Proyecto eléctrico timbrado SEC',
          'Cronograma de ejecución CGE (TAT)',
        ],
        proveedores: ['CGE Distribución', 'Contratista eléctrico autorizado SEC'],
        pdfUrl: `${baseUrl}/uf-03-electrificacion-cge.pdf`,
      },
      {
        numero: 4,
        slug: 'uf-04-solucion-agua',
        concepto: 'Solución de agua · norias / APR / matriz',
        monto_clp_m: 120,
        pct: 5.8,
        naturaleza: 'CAPEX',
        luc: ['17'],
        descripcion:
          'Construcción de norias y/o punteras comunitarias, estanques de acumulación y matriz de distribución, alineado con CIP municipal y derechos DGA.',
        supuestos: [
          '2 norias profundas (40 m) con bomba sumergible: CLP 48M',
          'Estanques elevados 25 m³ × 2: CLP 22M',
          'Matriz HDPE 63 mm: ~3 km a CLP 12M/km',
          'Trámite derechos de aprovechamiento DGA: CLP 14M',
        ],
        respaldos: [
          'Certificado de Informaciones Previas (CIP) municipal',
          'Inscripción de derechos de aprovechamiento DGA',
          'Análisis físico-químico y bacteriológico (Lab. acreditado)',
          'Presupuesto perforación + equipamiento',
        ],
        proveedores: ['Empresa de sondajes regional', 'DGA (autorización)'],
        pdfUrl: `${baseUrl}/uf-04-solucion-agua.pdf`,
      },
      {
        numero: 5,
        slug: 'uf-05-portones-cierre-perimetral',
        concepto: 'Portones, cierre perimetral parcial y señalética',
        monto_clp_m: 50,
        pct: 2.4,
        naturaleza: 'CAPEX',
        luc: ['15'],
        descripcion:
          'Portón principal automatizado, garita de control en acceso, cierre perimetral parcial en frente público y señalética interior del loteo.',
        supuestos: [
          'Portón corredera automatizado + control: CLP 14M',
          'Garita de control prefabricada: CLP 8M',
          'Cierre perimetral frente público ~600 m: CLP 18M',
          'Señalética viaria y de lotes: CLP 10M',
        ],
        respaldos: [
          'Cotización proveedor portón / control de acceso',
          'Cotización cierre perimetral (postes + malla)',
          'Plano de señalética del loteo',
        ],
        proveedores: ['Proveedor de automatización', 'Carpintería metálica local'],
        pdfUrl: `${baseUrl}/uf-05-portones-cierre-perimetral.pdf`,
      },
      {
        numero: 6,
        slug: 'uf-06-deslindes-amojonamiento',
        concepto: 'Deslindes, amojonamiento e hitos georreferenciados',
        monto_clp_m: 30,
        pct: 1.4,
        naturaleza: 'CAPEX',
        luc: ['18'],
        descripcion:
          'Materialización física de los deslindes de cada lote mediante hitos de concreto y placas georreferenciadas con GPS submétrico, base para la inscripción CBR.',
        supuestos: [
          '177 lotes × 4 vértices promedio: ~700 hitos',
          'Hito de concreto + placa: CLP 28.000 c/u',
          'Levantamiento GPS submétrico: CLP 8M',
          'Acta de entrega por lote: CLP 2M',
        ],
        respaldos: [
          'Informe de topógrafo registrado',
          'Archivo CAD / SHP con coordenadas WGS84 y UTM 19S',
          'Acta de entrega por lote firmada',
        ],
        proveedores: ['Topógrafo registrado MOP', 'Proveedor de hitos prefabricados'],
        pdfUrl: `${baseUrl}/uf-06-deslindes-amojonamiento.pdf`,
      },
      {
        numero: 7,
        slug: 'uf-07-topografia-ito',
        concepto: 'Topografía, replanteo e inspección técnica (ITO)',
        monto_clp_m: 40,
        pct: 1.9,
        naturaleza: 'CAPEX',
        luc: ['18'],
        descripcion:
          'Servicios profesionales de topografía y replanteo en obra, más Inspección Técnica de Obra independiente que controla avance físico y desembolsos.',
        supuestos: [
          'Topografía y replanteo: CLP 14M (4 visitas)',
          'ITO mensual durante 12 meses: CLP 22M',
          'Informes técnicos mensuales para desembolsos: CLP 4M',
        ],
        respaldos: [
          'Contrato de prestación de servicios ITO',
          'Plan de inspección con hitos verificables',
          'Estados de pago mensuales firmados por ITO',
        ],
        proveedores: ['Ingeniero civil ITO independiente'],
        pdfUrl: `${baseUrl}/uf-07-topografia-ito.pdf`,
      },
    ],
  },
  {
    numero: 2,
    nombre: 'Capital de Trabajo',
    monto_clp_m: 350,
    pct: 17,
    naturaleza: 'OPEX',
    descripcion:
      'Cubre el ciclo comercial y la operación durante la colocación de los lotes hasta que el flujo de ventas sostiene la operación.',
    items: [
      {
        numero: 8,
        slug: 'uf-08-legales-notariales',
        concepto: 'Gastos legales y notariales',
        monto_clp_m: 90,
        pct: 4.3,
        naturaleza: 'OPEX',
        luc: ['18'],
        descripcion:
          'Escrituras de compraventa, estudios de título, alzamientos de hipoteca por lote vendido, inscripciones CBR y honorarios del estudio jurídico.',
        supuestos: [
          'Escritura + estudio de título por lote: CLP 320.000 × 177 = CLP 57M',
          'Alzamientos por lote vendido: CLP 18M',
          'Honorarios estudio jurídico (retainer 12m): CLP 12M',
          'Gastos notariales y CBR adicionales: CLP 3M',
        ],
        respaldos: [
          'Contrato de servicios con estudio jurídico',
          'Tarifario notarial y CBR Curicó',
          'Modelos de escritura validados',
        ],
        proveedores: ['Estudio jurídico inmobiliario', 'Notaría Hualañé / Curicó', 'CBR Curicó'],
        pdfUrl: `${baseUrl}/uf-08-legales-notariales.pdf`,
      },
      {
        numero: 9,
        slug: 'uf-09-comercializacion-marketing',
        concepto: 'Comercialización · corretaje, marketing digital y sala de ventas',
        monto_clp_m: 140,
        pct: 6.7,
        naturaleza: 'OPEX',
        luc: ['20'],
        descripcion:
          'Plan de medios digital, fichas premium en ofertaterrenos.cl, comisiones de corretaje canalizadas y sala de ventas móvil en sitio.',
        supuestos: [
          'Corretaje 2% s/ ventas estimadas Fase 1: CLP 60M',
          'Marketing digital (Meta Ads + Google): CLP 36M (~CLP 3M/mes × 12)',
          'Fichas premium ofertaterrenos.cl + tour 360°: CLP 14M',
          'Sala de ventas móvil + folletería: CLP 30M',
        ],
        respaldos: [
          'Plan de medios detallado por canal',
          'Contrato con corredora(s) inmobiliaria(s)',
          'Cotización producción audiovisual y tour 360°',
          'Mockup de ficha publicada en portal',
        ],
        proveedores: ['Corredoras inmobiliarias regionales', 'OFERTA TERRENOS (portal)', 'Agencia digital'],
        pdfUrl: `${baseUrl}/uf-09-comercializacion-marketing.pdf`,
      },
      {
        numero: 10,
        slug: 'uf-10-operacion-administracion',
        concepto: 'Operación, administración y seguros',
        monto_clp_m: 80,
        pct: 3.8,
        naturaleza: 'OPEX',
        luc: ['21'],
        descripcion:
          'Equipo de ventas en sitio, gastos generales de oficina, contabilidad mensual y pólizas de seguros (responsabilidad civil, todo riesgo construcción).',
        supuestos: [
          'Equipo de ventas (1 jefe + 2 ejecutivos) × 12m: CLP 36M',
          'Contabilidad y administración: CLP 12M',
          'Seguros TRC + RC + incendio: CLP 18M',
          'Gastos generales (combustibles, oficina, vigilancia): CLP 14M',
        ],
        respaldos: [
          'Contratos laborales / honorarios del equipo',
          'Cotización pólizas (corredor de seguros)',
          'Contrato contabilidad externa',
        ],
        proveedores: ['Corredor de seguros', 'Estudio contable'],
        pdfUrl: `${baseUrl}/uf-10-operacion-administracion.pdf`,
      },
      {
        numero: 11,
        slug: 'uf-11-devex-estudios',
        concepto: 'Estudios técnicos y de factibilidad previos (DEVEX)',
        monto_clp_m: 40,
        pct: 1.9,
        naturaleza: 'OPEX',
        luc: ['18'],
        descripcion:
          'Estudios geotécnicos, hidrogeológicos y arqueológicos referenciales para validar la urbanización y respaldar la factibilidad ante el financiador.',
        supuestos: [
          'Estudio geotécnico + mecánica de suelos: CLP 14M',
          'Estudio hidrogeológico (sondajes de prueba): CLP 12M',
          'Informe arqueológico CMN: CLP 8M',
          'Informe ambiental no DIA / pertinencia SEA: CLP 6M',
        ],
        respaldos: [
          'Informe geotécnico firmado',
          'Informe hidrogeológico con propuesta DGA',
          'Carta CMN de no afectación',
          'Carta SEA de no pertinencia',
        ],
        proveedores: ['Consultora geotécnica', 'Hidrogeólogo registrado', 'Arqueólogo CMN'],
        pdfUrl: `${baseUrl}/uf-11-devex-estudios.pdf`,
      },
    ],
  },
  {
    numero: 3,
    nombre: 'Habilitación del Pipeline',
    monto_clp_m: 500,
    pct: 24,
    naturaleza: 'PIPELINE',
    descripcion:
      'Incorpora las hijuelas adicionales del predio (6, 9, 11 y otras) como colateral y generación de caja incremental que sostiene la facilidad.',
    items: [
      {
        numero: 12,
        slug: 'uf-12-subdivision-hijuelas',
        concepto: 'Subdivisión hijuelas 6, 9 y 11 (DL 3.516)',
        monto_clp_m: 120,
        pct: 5.8,
        naturaleza: 'PIPELINE',
        luc: ['18'],
        descripcion:
          'Planos de parcelación, ingeniería y tramitación SAG/MINVU para incorporar nuevas hijuelas al portafolio bajo el régimen del DL 3.516.',
        supuestos: [
          'Planos de subdivisión por hijuela: CLP 12M × 3 = CLP 36M',
          'Tramitación SAG (Certificado Aptitud Agrícola): CLP 18M',
          'Asesoría legal de subdivisión: CLP 24M',
          'Ingeniería complementaria (caminos, lotes): CLP 42M',
        ],
        respaldos: [
          'Planos timbrados SAG',
          'Resolución SAG de subdivisión',
          'Resolución MINVU de informe favorable',
        ],
        proveedores: ['SAG Región del Maule', 'MINVU SEREMI Maule', 'Arquitecto / Ing. Agrónomo'],
        pdfUrl: `${baseUrl}/uf-12-subdivision-hijuelas.pdf`,
      },
      {
        numero: 13,
        slug: 'uf-13-roles-sii-cbr',
        concepto: 'Asignación de roles SII e inscripciones CBR',
        monto_clp_m: 30,
        pct: 1.4,
        naturaleza: 'PIPELINE',
        luc: ['18'],
        descripcion:
          'Trámite ante el Servicio de Impuestos Internos para asignación de rol de avalúo a cada lote nuevo e inscripción en el Conservador de Bienes Raíces.',
        supuestos: [
          'Solicitud rol SII por lote: ~340 lotes futuros',
          'Honorarios profesional habilitado: CLP 18M',
          'Aranceles CBR (proporcional): CLP 8M',
          'Gastos administrativos / publicación: CLP 4M',
        ],
        respaldos: [
          'Formulario SII de asignación de rol',
          'Tarifario CBR Curicó',
          'Modelo de minuta de inscripción',
        ],
        proveedores: ['SII Curicó', 'CBR Curicó'],
        pdfUrl: `${baseUrl}/uf-13-roles-sii-cbr.pdf`,
      },
      {
        numero: 14,
        slug: 'uf-14-saneamiento-titulos',
        concepto: 'Saneamiento y regularización de títulos',
        monto_clp_m: 80,
        pct: 3.8,
        naturaleza: 'PIPELINE',
        luc: ['18'],
        descripcion:
          'Regularización de servidumbres, alzamiento de gravámenes residuales y reconstitución de títulos en hijuelas históricas del predio.',
        supuestos: [
          'Estudio de títulos retroactivo 30 años: CLP 22M',
          'Constitución/regularización servidumbres tránsito + agua: CLP 28M',
          'Alzamientos hipotecarios y gravámenes históricos: CLP 18M',
          'Honorarios judiciales / DL 2.695 (si aplica): CLP 12M',
        ],
        respaldos: [
          'Informe de estudio de títulos (30 años)',
          'Escrituras de servidumbre inscritas',
          'Certificado de dominio vigente sin gravámenes',
        ],
        proveedores: ['Estudio jurídico inmobiliario', 'Notaría', 'CBR'],
        pdfUrl: `${baseUrl}/uf-14-saneamiento-titulos.pdf`,
      },
      {
        numero: 15,
        slug: 'uf-15-consolidacion-derechos',
        concepto: 'Consolidación de derechos / adquisición hijuelas pendientes',
        monto_clp_m: 200,
        pct: 9.6,
        naturaleza: 'PIPELINE',
        luc: ['14'],
        descripcion:
          'Consolidación de derechos sucesorios menores y adquisición de hijuelas indivisas dentro del mismo predio matriz, cuando corresponda, para liberar el portafolio.',
        supuestos: [
          'Compra de derechos sucesorios residuales: CLP 140M',
          'Gastos notariales y CBR de consolidación: CLP 22M',
          'Tasación independiente (IVS 2022) por hijuela: CLP 18M',
          'Reserva para arbitraje / mediación: CLP 20M',
        ],
        respaldos: [
          'Tasación independiente IVS 2022 por hijuela',
          'Escrituras de cesión de derechos firmadas',
          'Estudio de títulos previo a la consolidación',
        ],
        proveedores: ['Tasador IVS 2022', 'Estudio jurídico', 'CBR Curicó'],
        pdfUrl: `${baseUrl}/uf-15-consolidacion-derechos.pdf`,
      },
      {
        numero: 16,
        slug: 'uf-16-movilizacion-temprana',
        concepto: 'Movilización temprana y reserva de habilitación',
        monto_clp_m: 70,
        pct: 3.4,
        naturaleza: 'PIPELINE',
        luc: ['15'],
        descripcion:
          'Instalación de faenas, accesos provisorios, caseta de obra y movilización del contratista para iniciar las hijuelas del pipeline con plazo cierto.',
        supuestos: [
          'Instalación de faenas + casetas: CLP 24M',
          'Accesos provisorios y limpieza de fajas: CLP 18M',
          'Movilización de maquinaria contratista: CLP 14M',
          'Reserva para imprevistos de habilitación: CLP 14M',
        ],
        respaldos: [
          'Contrato marco con constructora',
          'Plan de instalación de faenas',
          'Certificado MUTUAL / ACHS de obra',
        ],
        proveedores: ['Constructora regional', 'MUTUAL de Seguridad / ACHS'],
        pdfUrl: `${baseUrl}/uf-16-movilizacion-temprana.pdf`,
      },
    ],
  },
  {
    numero: 4,
    nombre: 'Reservas: Servicio de Deuda, Contingencia y Cierre',
    monto_clp_m: 330,
    pct: 16,
    naturaleza: 'RESERVA',
    descripcion:
      'Constituye la reserva de servicio de deuda (DSRA), la contingencia de obra y los costos de cierre de la facilidad LUC.',
    items: [
      {
        numero: 17,
        slug: 'uf-17-dsra-intereses',
        concepto: 'Reserva de servicio de intereses (DSRA · ~12 meses)',
        monto_clp_m: 180,
        pct: 8.7,
        naturaleza: 'RESERVA',
        luc: ['37'],
        descripcion:
          'Reserva equivalente a aproximadamente 12 meses de servicio de intereses al 8% anual sobre EUR 2.000.000, custodiada en cuenta colateral pignorada a favor del financiador.',
        supuestos: [
          'Tasa contractual: 8,0% anual sobre EUR 2.000.000',
          'Servicio anual de intereses: EUR 160.000 ≈ CLP 166M',
          'DSRA objetivo: 12 meses = CLP 180M (incluye holgura FX)',
          'Cuenta escrow en banco local custodiada',
        ],
        respaldos: [
          'Carta-mandato banco custodio',
          'Contrato de cuenta escrow',
          'Modelo financiero con servicio de deuda',
        ],
        proveedores: ['Banco custodio local (Santander / BCI / Itaú)'],
        pdfUrl: `${baseUrl}/uf-17-dsra-intereses.pdf`,
      },
      {
        numero: 18,
        slug: 'uf-18-contingencia-obra',
        concepto: 'Contingencia de obra (~10% s/ urbanización)',
        monto_clp_m: 90,
        pct: 4.3,
        naturaleza: 'RESERVA',
        luc: ['15'],
        descripcion:
          'Reserva del 10% sobre el presupuesto de urbanización Fase 1 (CLP 900M) para absorber imprevistos de obra, variaciones de mercado y ajustes técnicos del proyecto.',
        supuestos: [
          'Base: CLP 900M de urbanización · contingencia 10%',
          'Liberación contra orden de cambio aprobada por ITO',
          'Reporte mensual de uso de contingencia al financiador',
        ],
        respaldos: [
          'Política de manejo de contingencia',
          'Plantilla de orden de cambio (change order)',
          'Reporte ITO mensual',
        ],
        proveedores: ['ITO independiente'],
        pdfUrl: `${baseUrl}/uf-18-contingencia-obra.pdf`,
      },
      {
        numero: 19,
        slug: 'uf-19-cierre-facilidad',
        concepto: 'Costos de cierre de la facilidad',
        monto_clp_m: 60,
        pct: 2.9,
        naturaleza: 'RESERVA',
        luc: ['37'],
        descripcion:
          'Estructuración financiera, tasación oficial IVS 2022, asesoría legal financiera y due diligence externo para el cierre y desembolso de la facilidad LUC.',
        supuestos: [
          'Asesor financiero / arranger: CLP 22M',
          'Tasación oficial IVS 2022 del predio: CLP 14M',
          'Estudio jurídico financiero (cierre): CLP 18M',
          'Due diligence externo / data room: CLP 6M',
        ],
        respaldos: [
          'Contrato con asesor financiero',
          'Informe de tasación IVS 2022',
          'Carta-mandato del estudio jurídico financiero',
        ],
        proveedores: ['Asesor financiero', 'Tasador IVS 2022', 'Estudio jurídico financiero'],
        pdfUrl: `${baseUrl}/uf-19-cierre-facilidad.pdf`,
      },
    ],
  },
];

export const TODOS_ITEMS_UF: UsoFondosItem[] = PARTIDAS.flatMap((p) => p.items);
