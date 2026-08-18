import avaluo from '@/assets/dossier-isla-maipo/avaluo-fiscal-119-40.pdf.asset.json';
import tasacion from '@/assets/dossier-isla-maipo/tasacion-transsa-F24002-22-13.pdf.asset.json';
import cip from '@/assets/dossier-isla-maipo/cip-y-numero-119-40.pdf.asset.json';
import dominio from '@/assets/dossier-isla-maipo/dominio-vigente.pdf.asset.json';
import compraventa from '@/assets/dossier-isla-maipo/compraventa-rfg.pdf.asset.json';
import plano from '@/assets/dossier-isla-maipo/plano-subdivision.pdf.asset.json';
import anexo1 from '@/assets/dossier-isla-maipo/antecedente-1.pdf.asset.json';
import anexo2 from '@/assets/dossier-isla-maipo/antecedente-2.pdf.asset.json';

export interface DossierDoc {
  id: string;
  titulo: string;
  categoria: 'Legal' | 'Tributario' | 'Urbanístico' | 'Valoración' | 'Planos';
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
  roles: '119-40 / 16-35',
  destinoSii: 'Agrícola',
  propietarios: [
    { nombre: 'Inversiones RFG SpA', rut: '77.033.083-1', pct: '50,00%' },
    { nombre: 'Silvia del Carmen González Villalobos', rut: '5.291.646-1', pct: '50,00%' },
  ],
  superficieTotalM2: 184100,
  superficieUrbanaM2: 76541,
  superficieRuralM2: 107559,
  avaluoFiscal: 377765968,
  avaluoFecha: '1er semestre 2026',
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
  ],
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
];
