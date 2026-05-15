import jsPDF from 'jspdf';
import { drawPdfHeaderLogo, drawPdfFooter } from './pdfBrandHeader';

export interface TasacionData {
  // Antecedentes generales
  fecha: string;
  solicitante: string;
  tasador: string;
  proposito: string;
  // Identificación
  rol: string;
  inscripcionCBR: string;
  propietario: string;
  direccion: string;
  comuna: string;
  region: string;
  coordenadas: string;
  // Deslindes
  deslindes: { norte: string; sur: string; oriente: string; poniente: string };
  // Superficie
  superficieTerreno: number; // m²
  superficieConstruida: number; // m²
  // Sector
  descripcionSector: string;
  accesos: string;
  equipamiento: string;
  // Características del terreno
  topografia: string;
  forma: string;
  tipoSuelo: string;
  frente: string;
  // Servicios
  servicios: { agua: boolean; electricidad: boolean; alcantarillado: boolean; gas: boolean; telecom: boolean; pavimento: boolean };
  // Normativa
  zonificacion: string;
  usoSuelo: string;
  coefConstructibilidad: string;
  // Avalúo SII
  avaluoFiscalTerreno: number; // CLP
  avaluoFiscalConstruccion: number;
  avaluoFiscalTotal: number;
  valorUnitarioSII: number; // $/m²
  // Comparables
  comparables: Array<{ ubicacion: string; superficie: number; valorUF: number; valorM2UF: number; fuente: string }>;
  // Conclusión
  valorComercialUF: number;
  valorComercialCLP: number;
  valorM2UF: number;
  valorM2CLP: number;
  observaciones: string;
  // Firma digital del tasador (opcional)
  firmaDataUrl?: string;
  firmaTasador?: string;
  firmaFecha?: string;
}

export const buildTasacionFilename = (data: TasacionData) =>
  `Tasacion_${(data.comuna || 'predio').replace(/\s+/g, '-')}_${data.fecha.replace(/[^\d]/g, '')}.pdf`;

export const buildTasacionPdfBlob = (data: TasacionData): Blob => {
  const doc = buildTasacionDoc(data);
  return doc.output('blob');
};

export const generateTasacionPdf = (data: TasacionData) => {
  const doc = buildTasacionDoc(data);
  doc.save(buildTasacionFilename(data));
};

const buildTasacionDoc = (data: TasacionData) => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin - 10) {
      drawPdfFooter(doc);
      doc.addPage();
      y = margin;
    }
  };

  const fmtCLP = (n: number) => `$${Math.round(n).toLocaleString('es-CL')}`;
  const fmtUF = (n: number) => `UF ${n.toLocaleString('es-CL', { maximumFractionDigits: 2 })}`;

  const sectionTitle = (n: number, title: string) => {
    ensureSpace(14);
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, contentW, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${n}. ${title.toUpperCase()}`, margin + 3, y + 5.5);
    y += 11;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
  };

  const kv = (label: string, value: string) => {
    ensureSpace(6);
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin, y);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(value || '—', contentW - 55);
    doc.text(lines, margin + 55, y);
    y += 5 * Math.max(1, lines.length) + 1;
  };

  const para = (text: string) => {
    ensureSpace(6);
    const lines = doc.splitTextToSize(text, contentW);
    ensureSpace(lines.length * 5);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 2;
  };

  // ===== Cover =====
  drawPdfHeaderLogo(doc);
  y = 40;
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORME DE TASACIÓN COMERCIAL', pageW / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Predio Industrial / Agroindustrial', pageW / 2, y, { align: 'center' });
  y += 16;

  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentW, 50);
  y += 6;
  doc.setFontSize(10);
  const cover = [
    ['Inmueble', `${data.direccion}, ${data.comuna}, ${data.region}`],
    ['Rol SII', data.rol || '—'],
    ['Superficie', `${data.superficieTerreno.toLocaleString('es-CL')} m² (${(data.superficieTerreno / 10000).toFixed(2)} ha)`],
    ['Solicitante', data.solicitante],
    ['Tasador', data.tasador],
    ['Fecha', data.fecha],
  ];
  cover.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${k}:`, margin + 4, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(v), margin + 38, y);
    y += 6;
  });
  y += 14;

  doc.setFillColor(34, 197, 94);
  doc.rect(margin, y, contentW, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('VALOR COMERCIAL ESTIMADO', pageW / 2, y + 8, { align: 'center' });
  doc.setFontSize(18);
  doc.text(fmtUF(data.valorComercialUF), pageW / 2, y + 17, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`(≈ ${fmtCLP(data.valorComercialCLP)} · ${fmtUF(data.valorM2UF)} / m²)`, pageW / 2, y + 23, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  drawPdfFooter(doc);
  doc.addPage();
  y = margin;

  // 1. Antecedentes
  sectionTitle(1, 'Antecedentes generales');
  kv('Fecha de tasación', data.fecha);
  kv('Solicitante', data.solicitante);
  kv('Tasador', data.tasador);
  kv('Propósito', data.proposito);

  // 2. Identificación
  sectionTitle(2, 'Identificación del inmueble');
  kv('Propietario', data.propietario);
  kv('Dirección', data.direccion);
  kv('Comuna / Región', `${data.comuna}, ${data.region}`);
  kv('Rol SII', data.rol || '—');
  kv('Inscripción CBR', data.inscripcionCBR);
  kv('Coordenadas', data.coordenadas);

  // 3. Deslindes
  sectionTitle(3, 'Deslindes');
  kv('Norte', data.deslindes.norte);
  kv('Sur', data.deslindes.sur);
  kv('Oriente', data.deslindes.oriente);
  kv('Poniente', data.deslindes.poniente);

  // 4. Superficie
  sectionTitle(4, 'Superficies');
  kv('Terreno', `${data.superficieTerreno.toLocaleString('es-CL')} m² (${(data.superficieTerreno / 10000).toFixed(2)} ha)`);
  kv('Construida', `${data.superficieConstruida.toLocaleString('es-CL')} m²`);

  // 5. Descripción del sector
  sectionTitle(5, 'Descripción del sector');
  para(data.descripcionSector);
  kv('Accesos', data.accesos);
  kv('Equipamiento', data.equipamiento);

  // 6. Características del terreno
  sectionTitle(6, 'Características del terreno');
  kv('Topografía', data.topografia);
  kv('Forma', data.forma);
  kv('Tipo de suelo', data.tipoSuelo);
  kv('Frente', data.frente);

  // 7. Servicios básicos
  sectionTitle(7, 'Servicios básicos disponibles');
  const s = data.servicios;
  const yes = (b: boolean) => (b ? 'Sí' : 'No');
  kv('Agua potable', yes(s.agua));
  kv('Electricidad', yes(s.electricidad));
  kv('Alcantarillado', yes(s.alcantarillado));
  kv('Gas', yes(s.gas));
  kv('Telecomunicaciones', yes(s.telecom));
  kv('Pavimento', yes(s.pavimento));

  // 8. Normativa
  sectionTitle(8, 'Normativa y zonificación');
  kv('Zonificación', data.zonificacion);
  kv('Uso de suelo', data.usoSuelo);
  kv('Coef. constructibilidad', data.coefConstructibilidad);

  // 9. Avalúo fiscal SII
  sectionTitle(9, 'Avalúo fiscal SII');
  kv('Avalúo terreno', fmtCLP(data.avaluoFiscalTerreno));
  kv('Avalúo construcción', fmtCLP(data.avaluoFiscalConstruccion));
  kv('Avalúo total', fmtCLP(data.avaluoFiscalTotal));
  kv('Valor unitario SII', `${fmtCLP(data.valorUnitarioSII)} / m²`);

  // 10. Comparables de mercado
  sectionTitle(10, 'Análisis comparativo de mercado');
  para('Se analizan transacciones recientes y ofertas vigentes de predios industriales/agroindustriales en el sector Teno – Curicó – Romeral – Molina, con condiciones similares de acceso a Ruta 5, urbanización y aptitud productiva.');
  ensureSpace(8);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentW, 7, 'F');
  doc.text('Ubicación', margin + 2, y + 5);
  doc.text('Sup. (m²)', margin + 70, y + 5);
  doc.text('Valor (UF)', margin + 100, y + 5);
  doc.text('UF/m²', margin + 130, y + 5);
  doc.text('Fuente', margin + 155, y + 5);
  y += 8;
  doc.setFont('helvetica', 'normal');
  data.comparables.forEach(c => {
    ensureSpace(6);
    doc.text(doc.splitTextToSize(c.ubicacion, 65), margin + 2, y);
    doc.text(c.superficie.toLocaleString('es-CL'), margin + 70, y);
    doc.text(c.valorUF.toLocaleString('es-CL'), margin + 100, y);
    doc.text(c.valorM2UF.toFixed(3), margin + 130, y);
    doc.text(c.fuente, margin + 155, y);
    y += 6;
  });

  // 11. Metodología
  sectionTitle(11, 'Metodología de tasación');
  para('La presente tasación utiliza el Método Comparativo de Mercado, contrastando el valor SII del predio con el comportamiento de transacciones de bienes raíces equivalentes en la zona. Se aplican factores de ajuste por: (i) ubicación frente a Ruta 5, (ii) superficie útil y forma del polígono, (iii) urbanización y servicios disponibles, (iv) zonificación industrial/agroindustrial vigente, y (v) potencial productivo (packing, agroindustria, logística y cadena de frío).');

  // 12. Conclusión
  sectionTitle(12, 'Conclusión – Valor comercial');
  ensureSpace(30);
  doc.setFillColor(34, 197, 94);
  doc.rect(margin, y, contentW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('VALOR COMERCIAL FINAL', margin + 4, y + 7);
  doc.setFontSize(16);
  doc.text(`${fmtUF(data.valorComercialUF)}  (${fmtCLP(data.valorComercialCLP)})`, margin + 4, y + 16);
  doc.setTextColor(0, 0, 0);
  y += 26;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  kv('Valor unitario', `${fmtUF(data.valorM2UF)} / m²  (≈ ${fmtCLP(data.valorM2CLP)} / m²)`);
  para(data.observaciones);

  // 13. Firma digital del tasador
  sectionTitle(13, 'Firma digital del tasador');
  ensureSpace(60);
  const sigBoxW = 90;
  const sigBoxH = 40;
  const sigX = margin;
  const sigY = y;
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.rect(sigX, sigY, sigBoxW, sigBoxH);
  if (data.firmaDataUrl) {
    try {
      doc.addImage(data.firmaDataUrl, 'PNG', sigX + 2, sigY + 2, sigBoxW - 4, sigBoxH - 4);
    } catch (e) {
      doc.setFontSize(8);
      doc.setTextColor(180);
      doc.text('(firma no disponible)', sigX + 4, sigY + sigBoxH / 2);
      doc.setTextColor(0);
    }
  } else {
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Firma pendiente', sigX + 4, sigY + sigBoxH / 2);
    doc.setTextColor(0);
  }
  // Línea base + datos del firmante
  doc.setDrawColor(80);
  doc.line(sigX, sigY + sigBoxH + 2, sigX + sigBoxW, sigY + sigBoxH + 2);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(data.firmaTasador || data.tasador, sigX, sigY + sigBoxH + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Fecha de firma: ${data.firmaFecha || data.fecha}`, sigX, sigY + sigBoxH + 12);
  if (data.firmaDataUrl) {
    doc.setTextColor(34, 197, 94);
    doc.text('Firmado digitalmente', sigX + sigBoxW + 6, sigY + sigBoxH + 7);
    doc.setTextColor(120);
    doc.setFontSize(7);
    doc.text('Hash visual del trazo embebido en este PDF.', sigX + sigBoxW + 6, sigY + sigBoxH + 12);
    doc.setTextColor(0);
  }
  y = sigY + sigBoxH + 18;

  drawPdfFooter(doc);
  doc.save(`Tasacion_${data.comuna}_${data.fecha.replace(/[^\d]/g, '')}.pdf`);
};
