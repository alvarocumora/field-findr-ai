export interface DDItem {
  id: string;
  titulo: string;
  detalle: string;
  refDoc: string; // placeholder for physical doc reference
}

export const DUE_DILIGENCE: DDItem[] = [
  {
    id: 'sag',
    titulo: 'Subdivisión aprobada bajo DL 3.516',
    detalle: 'Resolución SAG Región del Maule que autoriza la subdivisión predial rústica.',
    refDoc: 'Ref. Resolución SAG N° ___ / 2025 — archivo físico en carpeta de proyecto.'
  },
  {
    id: 'minvu',
    titulo: 'Plano de loteo timbrado SEREMI MINVU Maule',
    detalle: 'Plano oficial de subdivisión timbrado por SEREMI MINVU Región del Maule.',
    refDoc: 'Ref. Plano N° ___ — archivo CAD + PDF timbrado.'
  },
  {
    id: 'cbr',
    titulo: 'Certificados de dominio vigente CBR Hualañé',
    detalle: 'Dominio vigente del predio matriz y, una vez subdividido, de cada parcela.',
    refDoc: 'Ref. Inscripción Fojas ___ N° ___ Año ___ CBR Hualañé.'
  },
  {
    id: 'sii',
    titulo: 'Roles SII independientes por parcela',
    detalle: 'Cada parcela cuenta con rol de avalúo fiscal individual emitido por SII.',
    refDoc: 'Ref. Roles SII: rango 215-XX a 215-XX, Comuna de Hualañé.'
  },
  {
    id: 'serv',
    titulo: 'Servidumbre de tránsito inscrita',
    detalle: 'Servidumbre legal de tránsito a perpetuidad sobre vialidad interior, inscrita en CBR.',
    refDoc: 'Ref. Escritura pública servidumbre, Notaría ___ Curicó, Fojas ___.'
  },
  {
    id: 'cge',
    titulo: 'Factibilidad eléctrica CGE',
    detalle: 'Certificado de factibilidad técnica de suministro eléctrico emitido por CGE Distribución.',
    refDoc: 'Ref. Carta CGE N° ___ / 2025 — empalme proyectado trifásico.'
  },
  {
    id: 'dga',
    titulo: 'Derechos de aprovechamiento de aguas DGA',
    detalle: 'Derechos de aguas subterráneas inscritos en DGA y en el Registro de Aguas del CBR.',
    refDoc: 'Ref. Resolución DGA N° ___ + inscripción CBR Hualañé Fojas ___.'
  },
];
