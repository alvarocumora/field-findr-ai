import avaluo from '@/assets/dossier-isla-maipo/avaluo-fiscal-119-40.pdf.asset.json';
import tasacion from '@/assets/dossier-isla-maipo/tasacion-transsa-F24002-22-13.pdf.asset.json';
import cip from '@/assets/dossier-isla-maipo/cip-y-numero-119-40.pdf.asset.json';
import dominio from '@/assets/dossier-isla-maipo/dominio-vigente.pdf.asset.json';
import compraventa from '@/assets/dossier-isla-maipo/compraventa-rfg.pdf.asset.json';
import plano from '@/assets/dossier-isla-maipo/plano-subdivision.pdf.asset.json';
import anexo1 from '@/assets/dossier-isla-maipo/antecedente-1.pdf.asset.json';
import anexo2 from '@/assets/dossier-isla-maipo/antecedente-2.pdf.asset.json';
import dvJul2026 from '@/assets/dossier-isla-maipo/dominio-vigente-2026.pdf.asset.json';
import copiaVigente from '@/assets/dossier-isla-maipo/copia-vigente-inscripcion-2026.pdf.asset.json';
import estatutoRfg from '@/assets/dossier-isla-maipo/estatuto-rfg-spa.pdf.asset.json';
import avaluo1632 from '@/assets/dossier-isla-maipo/avaluo-fiscal-16-32.pdf.asset.json';
import avaluo1633 from '@/assets/dossier-isla-maipo/avaluo-fiscal-16-33.pdf.asset.json';
import noExp11940 from '@/assets/dossier-isla-maipo/no-expropiacion-119-40.pdf.asset.json';
import noExp1632 from '@/assets/dossier-isla-maipo/no-expropiacion-16-32.pdf.asset.json';
import noExp1633 from '@/assets/dossier-isla-maipo/no-expropiacion-16-33.pdf.asset.json';
import protocolizacion from '@/assets/dossier-isla-maipo/protocolizacion-notarial-2020.pdf.asset.json';
import repLegal from '@/assets/dossier-isla-maipo/antecedentes-representante.pdf.asset.json';
import vigenciaSociedad from '@/assets/dossier-isla-maipo/vigencia-sociedad-rfg.pdf.asset.json';
import vigenciaPoderes from '@/assets/dossier-isla-maipo/vigencia-poderes-rfg.pdf.asset.json';
import hipotecasAguas from '@/assets/dossier-isla-maipo/hipotecas-gravamenes-aguas.pdf.asset.json';
import dominioAguas from '@/assets/dossier-isla-maipo/dominio-vigente-aguas.pdf.asset.json';
import deudaTgr from '@/assets/dossier-isla-maipo/certificado-deuda-tgr.pdf.asset.json';
import antecedentes1632 from '@/assets/dossier-isla-maipo/antecedentes-bien-raiz-16-32.pdf.asset.json';
import antecedentes1633 from '@/assets/dossier-isla-maipo/antecedentes-bien-raiz-16-33.pdf.asset.json';
import cip1632 from '@/assets/dossier-isla-maipo/cip-16-32.pdf.asset.json';
import cip1633 from '@/assets/dossier-isla-maipo/cip-16-33.pdf.asset.json';
import contratoAridos from '@/assets/dossier-isla-maipo/contrato-aridos.pdf.asset.json';
import contratoAridosProt from '@/assets/dossier-isla-maipo/contrato-aridos-protocolizado.pdf.asset.json';
import autorizacionContrato from '@/assets/dossier-isla-maipo/autorizacion-contrato.pdf.asset.json';
import contratoAnexo from '@/assets/dossier-isla-maipo/contrato-anexo.pdf.asset.json';

export interface DossierDoc {
  id: string;
  titulo: string;
  categoria:
    | 'Legal'
    | 'Tributario'
    | 'Urbanístico'
    | 'Valoración'
    | 'Planos'
    | 'Societario'
    | 'Aguas'
    | 'Contratos';
  descripcion: string;
  emisor: string;
  fecha: string;
  url: string;
  filename: string;
}

export const PROPIEDAD = {
  nombre: 'Predio Gálvez 1458 — Lotes 4 y 5',
  comuna: 'Isla de Maipo',
  region: 'Región Metropolitana de Santiago',
  sector: 'La Villita',
  direccion: 'Gálvez 1458, Isla de Maipo',
  roles: '119-40 · 16-32 · 16-33',
  destinoSii: 'Agrícola',
  propietarios: [
    { nombre: 'Inversiones RFG SpA', rut: '77.033.083-1', pct: '50,00%' },
    { nombre: 'Silvia del Carmen González Villalobos', rut: '5.291.646-1', pct: '50,00%' },
  ],
  superficieTotalM2: 184100,
  superficieUrbanaM2: 76541,
  superficieRuralM2: 107559,
  avaluoFiscal: 633000120,
  avaluoFecha: 'Suma de 3 roles · 2026',
  avaluosDetalle: [
    { rol: '119-40', direccion: 'Gálvez 1458', destino: 'Agrícola', monto: 377765968, periodo: '1er semestre 2026' },
    { rol: '16-32', direccion: 'Gálvez 1458 Lt. 1', destino: 'Sitio eriazo', monto: 127617076, periodo: '2º semestre 2026' },
    { rol: '16-33', direccion: 'Gálvez 1458 Lt. 2', destino: 'Sitio eriazo', monto: 127617076, periodo: '2º semestre 2026' },
  ],
  sociedad: {
    razonSocial: 'Inversiones RFG SpA',
    rut: '77.033.083-1',
    constitucion: '25 de junio de 2019',
    domicilio: 'Isla de Maipo, Región Metropolitana',
    registro: 'Registro de Empresas y Sociedades (Ley 20.659) · CVE CRsbOwz3ss1G',
    certificadoFecha: '23-07-2026',
  },
  inscripcion: {
    fojas: '1814',
    numero: '1731',
    registro: 'Registro de Propiedad',
    anio: '2019',
    cbr: 'Conservador de Bienes Raíces de Talagante',
    vigenciaAl: '24 de julio de 2026',
  },
  tasacionUf: 184036,
  tasacionClp: 5796946359,
  tasacionFecha: '25 de febrero de 2022',
  tasador: 'Transsa · Informe F24002-22-13 (ISO 9001:2015)',
  lat: -33.7566,
  lng: -70.9047,
  deslindes: [
    { lado: 'Norte', con: 'Propiedad vecina', metros: '473,86 m' },
    { lado: 'Sur', con: 'Propiedad vecina', metros: '608,15 m' },
    { lado: 'Oriente', con: 'Calle Olea', metros: '287,50 m' },
    { lado: 'Poniente', con: 'Calle Gálvez', metros: '181,93 m' },
  ],
  normativa: {
    urbana:
      'Lote 4 dentro del límite urbano del PRC de Isla de Maipo (Zonas Z1 y Z3). Usos permitidos: vivienda, equipamiento comunal, almacenamiento inofensivo y servicios artesanales. Superficie predial mínima 300 / 500 m², ocupación de suelo 80%, constructibilidad 3,2 / 2,0, altura máxima 14 / 10,5 m, densidad bruta máxima 180 hab/há.',
    rural:
      'Lote 5 en zona Agropecuaria Exclusiva del PRMS. Usos permitidos: actividades agropecuarias y agroindustria de procesos de productos frescos. Superficie predial mínima 40.000 m².',
  },
  urbanizacion: [
    'Electricidad: red aérea',
    'Agua potable: red pública (factibilidad Aguas Andinas N°002973)',
    'Alcantarillado: red pública',
    'Calzada de hormigón · acceso por calle Gálvez y calle Olea',
  ],
  antecedentesTecnicos: [
    'Planos CBR lotes N°4 y N°5, inscripción N°905 de 2015, CBR Talagante.',
    'Resolución de subdivisión DOM N°21 del 17-12-2014 (origen de Lote 4 y Lote 5).',
    'Certificados de informaciones previas N°09/2019, N°54/2018 y N°29/2018.',
    'Certificado de número lote 4 N°296 del 06-05-2015.',
    'Certificado de no expropiación SERVIU N°2500535 del 28-02-2022.',
    'Certificados SERVIU RM de no afectación a expropiación para los 3 roles, emitidos el 24-07-2026 (N°3517815, N°3517810 y N°3517797).',
    'Dominio vigente y copia vigente de inscripción fojas 1814 N°1731 de 2019, CBR Talagante (julio 2026).',
    'Derechos de aprovechamiento de aguas de regadío: 25 acciones de la Asociación de Canalistas del Canal Valdés, fojas 148 N°114 Registro de Propiedad de Aguas 2019.',
  ],
  derechosAgua: {
    acciones: 25,
    asociacion: 'Asociación de Canalistas del Canal Valdés',
    inscripcion: 'Fojas 148 N°114 · Registro de Propiedad de Aguas 2019 · CBR Talagante',
    gravamenes: 'Sin hipotecas, gravámenes, prohibiciones ni interdicciones vigentes (revisión 30 años, al 20-07-2026).',
  },
  deudaTgr: {
    monto: 331031,
    rol: '087-00119-040',
    detalle: 'Contribuciones formulario 30, vencimiento 30-06-2026 (neto $328.956 + reajustes e intereses).',
    fecha: '20-07-2026',
  },
};

export const DOCUMENTOS: DossierDoc[] = [
  {
    id: 'tasacion',
    titulo: 'Informe de tasación comercial — Transsa F24002-22-13',
    categoria: 'Valoración',
    descripcion:
      'Tasación de terreno de Lotes 4 y 5 por metodología de comparación de mercado y residual de terreno. Valor total UF 184.036.',
    emisor: 'Transsa (ISO 9001:2015)',
    fecha: '25-02-2022',
    url: tasacion.url,
    filename: 'Tasacion-Transsa-F24002-22-13.pdf',
  },
  {
    id: 'avaluo',
    titulo: 'Certificado de avalúo fiscal detallado — ROL 119-40',
    categoria: 'Tributario',
    descripcion:
      'Avalúo fiscal total $377.765.968, superficie 10,76 ha, suelo segunda de riego. Folio V2744838.',
    emisor: 'Servicio de Impuestos Internos',
    fecha: '16-02-2026',
    url: avaluo.url,
    filename: 'Certificado-Avaluo-Fiscal-119-40.pdf',
  },
  {
    id: 'dominio',
    titulo: 'Certificado de dominio vigente',
    categoria: 'Legal',
    descripcion: 'Acredita la inscripción de dominio vigente del predio en el Conservador de Bienes Raíces.',
    emisor: 'Conservador de Bienes Raíces de Talagante',
    fecha: 'Vigente',
    url: dominio.url,
    filename: 'Dominio-Vigente.pdf',
  },
  {
    id: 'compraventa',
    titulo: 'Escritura de compraventa — Inversiones RFG SpA',
    categoria: 'Legal',
    descripcion: 'Título de adquisición del inmueble por parte de la sociedad propietaria.',
    emisor: 'Notaría / CBR',
    fecha: 'Título vigente',
    url: compraventa.url,
    filename: 'Compraventa-RFG.pdf',
  },
  {
    id: 'cip',
    titulo: 'Certificado de informaciones previas y número — ROL 119-40',
    categoria: 'Urbanístico',
    descripcion: 'Normativa urbanística aplicable al predio y certificado de número municipal.',
    emisor: 'I. Municipalidad de Isla de Maipo',
    fecha: 'Vigente',
    url: cip.url,
    filename: 'CIP-y-Numero-119-40.pdf',
  },
  {
    id: 'plano',
    titulo: 'Plano de subdivisión y antecedentes gráficos',
    categoria: 'Planos',
    descripcion: 'Plano archivado que da origen a los Lotes 4 y 5 conforme a resolución DOM N°21/2014.',
    emisor: 'DOM Isla de Maipo / CBR Talagante',
    fecha: '2014-2015',
    url: plano.url,
    filename: 'Plano-Subdivision.pdf',
  },
  {
    id: 'anexo-1',
    titulo: 'Antecedente complementario 1',
    categoria: 'Legal',
    descripcion: 'Documentación de respaldo adicional del expediente de la propiedad.',
    emisor: 'Expediente propietario',
    fecha: '—',
    url: anexo1.url,
    filename: 'Antecedente-1.pdf',
  },
  {
    id: 'anexo-2',
    titulo: 'Antecedente complementario 2',
    categoria: 'Legal',
    descripcion: 'Documentación de respaldo adicional del expediente de la propiedad.',
    emisor: 'Expediente propietario',
    fecha: '—',
    url: anexo2.url,
    filename: 'Antecedente-2.pdf',
  },
  {
    id: 'dominio-vigente-2026',
    titulo: 'Certificado de dominio vigente — CBR Talagante (julio 2026)',
    categoria: 'Legal',
    descripcion:
      'Dominio vigente de la inscripción de fojas 1814 N°1731 del Registro de Propiedad 2019, vigente al 20-07-2026. Carátula N°152730, certificado N°123457021378 (verificable en fojas.cl).',
    emisor: 'Conservador de Bienes Raíces de Talagante',
    fecha: '20-07-2026',
    url: dvJul2026.url,
    filename: 'Dominio-Vigente-CBR-Jul2026.pdf',
  },
  {
    id: 'copia-vigente-2026',
    titulo: 'Copia vigente de inscripción fojas 1814 N°1731 (2019)',
    categoria: 'Legal',
    descripcion:
      'Copia autorizada y vigente de la inscripción de dominio al 24-07-2026. Carátula N°153015, certificado N°123457022106.',
    emisor: 'Conservador de Bienes Raíces de Talagante',
    fecha: '24-07-2026',
    url: copiaVigente.url,
    filename: 'Copia-Vigente-Inscripcion-2026.pdf',
  },
  {
    id: 'estatuto-rfg',
    titulo: 'Certificado de estatuto actualizado — Inversiones RFG SpA',
    categoria: 'Societario',
    descripcion:
      'Estatuto vigente de la sociedad propietaria (RUT 77.033.083-1), constituida el 25-06-2019. Valor probatorio de instrumento público (art. 22 Ley 20.659). CVE CRsbOwz3ss1G.',
    emisor: 'Registro de Empresas y Sociedades · Ministerio de Economía',
    fecha: '23-07-2026',
    url: estatutoRfg.url,
    filename: 'Estatuto-Actualizado-RFG-SpA.pdf',
  },
  {
    id: 'avaluo-16-32',
    titulo: 'Certificado de avalúo fiscal detallado — ROL 16-32',
    categoria: 'Tributario',
    descripcion:
      'Gálvez 1458 Lt. 1, destino sitio eriazo, a nombre de Inversiones RFG SpA. Avalúo total $127.617.076 (2º semestre 2026).',
    emisor: 'Servicio de Impuestos Internos',
    fecha: '24-07-2026',
    url: avaluo1632.url,
    filename: 'Avaluo-Fiscal-16-32.pdf',
  },
  {
    id: 'avaluo-16-33',
    titulo: 'Certificado de avalúo fiscal detallado — ROL 16-33',
    categoria: 'Tributario',
    descripcion:
      'Gálvez 1458 Lt. 2, destino sitio eriazo, a nombre de Inversiones RFG SpA. Avalúo total $127.617.076 (2º semestre 2026).',
    emisor: 'Servicio de Impuestos Internos',
    fecha: '24-07-2026',
    url: avaluo1633.url,
    filename: 'Avaluo-Fiscal-16-33.pdf',
  },
  {
    id: 'no-exp-119-40',
    titulo: 'Certificado de no expropiación SERVIU — ROL 119-40',
    categoria: 'Urbanístico',
    descripcion:
      'Informe situación de inmueble N°3517815: Gálvez 1458 NO AFECTO A EXPROPIACIÓN por SERVIU RM.',
    emisor: 'SERVIU Región Metropolitana · MINVU',
    fecha: '24-07-2026',
    url: noExp11940.url,
    filename: 'No-Expropiacion-119-40.pdf',
  },
  {
    id: 'no-exp-16-32',
    titulo: 'Certificado de no expropiación SERVIU — ROL 16-32',
    categoria: 'Urbanístico',
    descripcion:
      'Informe situación de inmueble N°3517810: Gálvez 1458 Lt. 1 NO AFECTO A EXPROPIACIÓN por SERVIU RM.',
    emisor: 'SERVIU Región Metropolitana · MINVU',
    fecha: '24-07-2026',
    url: noExp1632.url,
    filename: 'No-Expropiacion-16-32.pdf',
  },
  {
    id: 'no-exp-16-33',
    titulo: 'Certificado de no expropiación SERVIU — ROL 16-33',
    categoria: 'Urbanístico',
    descripcion:
      'Informe situación de inmueble N°3517797: Gálvez 1458 Lt. 2 NO AFECTO A EXPROPIACIÓN por SERVIU RM.',
    emisor: 'SERVIU Región Metropolitana · MINVU',
    fecha: '24-07-2026',
    url: noExp1633.url,
    filename: 'No-Expropiacion-16-33.pdf',
  },
  {
    id: 'protocolizacion-2020',
    titulo: 'Instrumento protocolizado N°1.068 (repertorio 3.710/2020)',
    categoria: 'Legal',
    descripcion:
      'Documento protocolizado el 10-12-2020 ante Notaría de San Fernando, Alberto Ortega Jirón. Certificado N°123456811407, verificable en fojas.cl.',
    emisor: 'Primera Notaría de San Fernando',
    fecha: '11-12-2020',
    url: protocolizacion.url,
    filename: 'Protocolizacion-Notarial-1068-2020.pdf',
  },
  {
    id: 'rep-legal',
    titulo: 'Antecedentes del representante legal',
    categoria: 'Societario',
    descripcion:
      'Documentación de identificación y respaldo del representante legal de la sociedad propietaria, para verificación KYC de la entidad financiera.',
    emisor: 'Expediente propietario',
    fecha: '24-07-2026',
    url: repLegal.url,
    filename: 'Antecedentes-Representante-Legal.pdf',
  },
  {
    id: 'vigencia-sociedad',
    titulo: 'Certificado de vigencia — Inversiones RFG SpA',
    categoria: 'Societario',
    descripcion:
      'La sociedad se encuentra inscrita y sin disolución registrada. Valor probatorio de instrumento público (art. 22 Ley 20.659). CVE CRyjscMQFmyi.',
    emisor: 'Registro de Empresas y Sociedades · Ministerio de Economía',
    fecha: '14-01-2026',
    url: vigenciaSociedad.url,
    filename: 'Vigencia-Sociedad-RFG-SpA.pdf',
  },
  {
    id: 'vigencia-poderes',
    titulo: 'Certificado de vigencia de poderes — Inversiones RFG SpA',
    categoria: 'Societario',
    descripcion:
      'Acredita que no consta revocación de designaciones, poderes ni delegaciones de facultades de representación de la sociedad propietaria.',
    emisor: 'Registro de Empresas y Sociedades · Ministerio de Economía',
    fecha: '23-07-2026',
    url: vigenciaPoderes.url,
    filename: 'Vigencia-Poderes-RFG-SpA.pdf',
  },
  {
    id: 'hipotecas-aguas',
    titulo: 'Certificado de hipotecas y gravámenes — Derechos de agua',
    categoria: 'Aguas',
    descripcion:
      '25 acciones del Canal Valdés a nombre de Inversiones RFG SpA: sin inscripciones vigentes de hipotecas, gravámenes, prohibiciones ni interdicciones (revisión 30 años). Certificado N°123457021375.',
    emisor: 'Conservador de Bienes Raíces de Talagante',
    fecha: '20-07-2026',
    url: hipotecasAguas.url,
    filename: 'Hipotecas-Gravamenes-Aguas.pdf',
  },
  {
    id: 'dominio-aguas',
    titulo: 'Dominio vigente de derechos de aprovechamiento de aguas',
    categoria: 'Aguas',
    descripcion:
      'Copia vigente de la inscripción de fojas 148 N°114 del Registro de Propiedad de Aguas 2019, vigente al 20-07-2026. Certificado N°123457021376.',
    emisor: 'Conservador de Bienes Raíces de Talagante',
    fecha: '20-07-2026',
    url: dominioAguas.url,
    filename: 'Dominio-Vigente-Aguas.pdf',
  },
  {
    id: 'deuda-tgr',
    titulo: 'Certificado de deuda de contribuciones — ROL 119-40',
    categoria: 'Tributario',
    descripcion:
      'Tesorería General de la República: deuda morosa liquidada de $331.031 (formulario 30, vencimiento 30-06-2026). Sin otras obligaciones vencidas.',
    emisor: 'Tesorería General de la República',
    fecha: '20-07-2026',
    url: deudaTgr.url,
    filename: 'Certificado-Deuda-TGR-119-40.pdf',
  },
  {
    id: 'antecedentes-16-32',
    titulo: 'Documento de antecedentes de bien raíz — ROL 16-32',
    categoria: 'Tributario',
    descripcion:
      'Gálvez 1458 Lt. 1, urbano, sitio eriazo. Avalúo actualizado $124.141.101 y contribución total semestral $775.650. Folio V2744722.',
    emisor: 'Servicio de Impuestos Internos',
    fecha: '16-02-2026',
    url: antecedentes1632.url,
    filename: 'Antecedentes-Bien-Raiz-16-32.pdf',
  },
  {
    id: 'antecedentes-16-33',
    titulo: 'Documento de antecedentes de bien raíz — ROL 16-33',
    categoria: 'Tributario',
    descripcion:
      'Gálvez 1458 Lt. 2, urbano, sitio eriazo. Avalúo actualizado $124.141.101 y contribución total semestral $775.650. Folio V2744750.',
    emisor: 'Servicio de Impuestos Internos',
    fecha: '16-02-2026',
    url: antecedentes1633.url,
    filename: 'Antecedentes-Bien-Raiz-16-33.pdf',
  },
  {
    id: 'cip-16-32',
    titulo: 'Certificado de informaciones previas — ROL 16-32',
    categoria: 'Urbanístico',
    descripcion: 'Normativa urbanística aplicable al Lote 1 (Gálvez 1458 Lt. 1) según PRC de Isla de Maipo.',
    emisor: 'I. Municipalidad de Isla de Maipo',
    fecha: 'Vigente',
    url: cip1632.url,
    filename: 'CIP-16-32.pdf',
  },
  {
    id: 'cip-16-33',
    titulo: 'Certificado de informaciones previas — ROL 16-33',
    categoria: 'Urbanístico',
    descripcion: 'Normativa urbanística aplicable al Lote 2 (Gálvez 1458 Lt. 2) según PRC de Isla de Maipo.',
    emisor: 'I. Municipalidad de Isla de Maipo',
    fecha: 'Vigente',
    url: cip1633.url,
    filename: 'CIP-16-33.pdf',
  },
  {
    id: 'contrato-aridos',
    titulo: 'Contrato de explotación de áridos',
    categoria: 'Contratos',
    descripcion:
      'Contrato vigente sobre explotación de áridos en el predio, reducido a escritura ante notaría. CVE 034-2025123014073487.',
    emisor: 'Primera Notaría y Conservador de Minas de San Vicente',
    fecha: '30-12-2025',
    url: contratoAridos.url,
    filename: 'Contrato-Aridos.pdf',
  },
  {
    id: 'contrato-aridos-prot',
    titulo: 'Contrato de áridos — copia protocolizada',
    categoria: 'Contratos',
    descripcion: 'Copia autorizada y protocolizada del contrato de áridos, con verificación electrónica notarial.',
    emisor: 'Primera Notaría y Conservador de Minas de San Vicente',
    fecha: '30-12-2025',
    url: contratoAridosProt.url,
    filename: 'Contrato-Aridos-Protocolizado.pdf',
  },
  {
    id: 'autorizacion-contrato',
    titulo: 'Autorización de contrato',
    categoria: 'Contratos',
    descripcion:
      'Autorización notarial asociada al contrato sobre el predio. CVE 034-2025072815181932, verificable en ajs.cl.',
    emisor: 'Primera Notaría y Conservador de Minas de San Vicente',
    fecha: '28-07-2025',
    url: autorizacionContrato.url,
    filename: 'Autorizacion-Contrato.pdf',
  },
  {
    id: 'contrato-anexo',
    titulo: 'Anexo de contrato',
    categoria: 'Contratos',
    descripcion:
      'Anexo que modifica y complementa el contrato principal sobre el predio. CVE 034-2025072815181932.',
    emisor: 'Primera Notaría y Conservador de Minas de San Vicente',
    fecha: '28-07-2025',
    url: contratoAnexo.url,
    filename: 'Contrato-Anexo.pdf',
  },
];
