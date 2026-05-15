import jsPDF from 'jspdf';
import { drawPdfHeaderLogo, drawPdfFooter } from './pdfBrandHeader';
import { getT, type TasacionLang } from './tasacionI18n';

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
  // Idioma del informe
  lang?: TasacionLang;
  // Trazabilidad / validación pública
  qrDataUrl?: string;          // PNG dataURL del QR que apunta al validador
  validatorUrl?: string;       // URL pública del validador
  pdfHashShort?: string;       // hash visible (corto) en portada
  publicId?: string;           // id corto del registro publicado
}

export const buildTasacionFilename = (data: TasacionData) => {
  const prefix = data.lang === 'en' ? 'Appraisal' : 'Tasacion';
  return `${prefix}_${(data.comuna || 'predio').replace(/\s+/g, '-')}_${data.fecha.replace(/[^\d]/g, '')}.pdf`;
};

export const buildTasacionPdfBlob = (data: TasacionData): Blob => {
  const doc = buildTasacionDoc(data);
  return doc.output('blob');
};

export const generateTasacionPdf = (data: TasacionData) => {
  const doc = buildTasacionDoc(data);
  doc.save(buildTasacionFilename(data));
};

const buildTasacionDoc = (data: TasacionData) => {
  const t = getT(data.lang);
  const L = t.labels;
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

  const fmtCLP = t.fmtCLP;
  const fmtUF = t.fmtUF;
  const fmtNum = t.fmtNumber;

  const sectionTitle = (n: number) => {
    const title = t.sections[n] ?? '';
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
    const lines = doc.splitTextToSize(value || t.dash, contentW - 55);
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
  doc.text(t.coverTitle, pageW / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(t.coverSubtitle, pageW / 2, y, { align: 'center' });
  y += 16;

  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentW, 50);
  y += 6;
  doc.setFontSize(10);
  const cover: Array<[string, string]> = [
    [t.coverProperty, `${data.direccion}, ${data.comuna}, ${data.region}`],
    [t.coverRol, data.rol || t.dash],
    [t.coverSurface, `${fmtNum(data.superficieTerreno)} m² (${(data.superficieTerreno / 10000).toFixed(2)} ha)`],
    [t.coverApplicant, data.solicitante],
    [t.coverAppraiser, data.tasador],
    [t.coverDate, data.fecha],
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
  doc.text(t.estimatedCommercialValue, pageW / 2, y + 8, { align: 'center' });
  doc.setFontSize(18);
  doc.text(fmtUF(data.valorComercialUF), pageW / 2, y + 17, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`(≈ ${fmtCLP(data.valorComercialCLP)} · ${fmtUF(data.valorM2UF)} ${t.perM2})`, pageW / 2, y + 23, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  // QR de verificación pública (esquina inferior derecha de la portada)
  if (data.qrDataUrl && data.validatorUrl) {
    const qrSize = 28;
    const qrX = pageW - margin - qrSize;
    const qrY = pageH - margin - qrSize - 12;
    try { doc.addImage(data.qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize); } catch {}
    doc.setFontSize(7);
    doc.setTextColor(80);
    doc.setFont('helvetica', 'bold');
    doc.text('VERIFICAR / VERIFY', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(data.validatorUrl, qrX + qrSize / 2, qrY + qrSize + 6, { align: 'center' });
    if (data.pdfHashShort) {
      doc.text(`SHA-256: ${data.pdfHashShort}`, qrX + qrSize / 2, qrY + qrSize + 9, { align: 'center' });
    }
    doc.setTextColor(0);
  }

  drawPdfFooter(doc);
  doc.addPage();
  y = margin;

  // 1. Antecedentes
  sectionTitle(1);
  kv(L.appraisalDate, data.fecha);
  kv(L.applicant, data.solicitante);
  kv(L.appraiser, data.tasador);
  kv(L.purpose, data.proposito);

  // 2. Identificación
  sectionTitle(2);
  kv(L.owner, data.propietario);
  kv(L.address, data.direccion);
  kv(L.municipalityRegion, `${data.comuna}, ${data.region}`);
  kv(L.rolSII, data.rol || t.dash);
  kv(L.cbrInscription, data.inscripcionCBR);
  kv(L.coordinates, data.coordenadas);

  // 3. Deslindes
  sectionTitle(3);
  kv(L.north, data.deslindes.norte);
  kv(L.south, data.deslindes.sur);
  kv(L.east, data.deslindes.oriente);
  kv(L.west, data.deslindes.poniente);

  // 4. Superficie
  sectionTitle(4);
  kv(L.land, `${fmtNum(data.superficieTerreno)} m² (${(data.superficieTerreno / 10000).toFixed(2)} ha)`);
  kv(L.built, `${fmtNum(data.superficieConstruida)} m²`);

  // 5. Descripción del sector
  sectionTitle(5);
  para(data.descripcionSector);
  kv(L.access, data.accesos);
  kv(L.facilities, data.equipamiento);

  // 6. Características del terreno
  sectionTitle(6);
  kv(L.topography, data.topografia);
  kv(L.shape, data.forma);
  kv(L.soilType, data.tipoSuelo);
  kv(L.frontage, data.frente);

  // 7. Servicios básicos
  sectionTitle(7);
  const s = data.servicios;
  const yes = (b: boolean) => (b ? t.yes : t.no);
  kv(L.water, yes(s.agua));
  kv(L.electricity, yes(s.electricidad));
  kv(L.sewage, yes(s.alcantarillado));
  kv(L.gas, yes(s.gas));
  kv(L.telecom, yes(s.telecom));
  kv(L.pavement, yes(s.pavimento));

  // 8. Normativa
  sectionTitle(8);
  kv(L.zoning, data.zonificacion);
  kv(L.landUse, data.usoSuelo);
  kv(L.buildCoef, data.coefConstructibilidad);

  // 9. Avalúo fiscal SII
  sectionTitle(9);
  kv(L.siiLand, fmtCLP(data.avaluoFiscalTerreno));
  kv(L.siiBuilt, fmtCLP(data.avaluoFiscalConstruccion));
  kv(L.siiTotal, fmtCLP(data.avaluoFiscalTotal));
  kv(L.siiUnit, `${fmtCLP(data.valorUnitarioSII)} ${t.perM2}`);

  // 10. Comparables de mercado
  sectionTitle(10);
  para(t.paragraphs.comparablesIntro);
  ensureSpace(8);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentW, 7, 'F');
  doc.text(L.colLocation, margin + 2, y + 5);
  doc.text(L.colArea, margin + 70, y + 5);
  doc.text(L.colValueUF, margin + 100, y + 5);
  doc.text(L.colUFm2, margin + 130, y + 5);
  doc.text(L.colSource, margin + 155, y + 5);
  y += 8;
  doc.setFont('helvetica', 'normal');
  data.comparables.forEach(c => {
    ensureSpace(6);
    doc.text(doc.splitTextToSize(c.ubicacion, 65), margin + 2, y);
    doc.text(fmtNum(c.superficie), margin + 70, y);
    doc.text(fmtNum(c.valorUF), margin + 100, y);
    doc.text(c.valorM2UF.toFixed(3), margin + 130, y);
    doc.text(c.fuente, margin + 155, y);
    y += 6;
  });

  // 11. Metodología
  sectionTitle(11);
  para(t.paragraphs.methodology);

  // 12. Conclusión
  sectionTitle(12);
  ensureSpace(30);
  doc.setFillColor(34, 197, 94);
  doc.rect(margin, y, contentW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(t.finalCommercialValue, margin + 4, y + 7);
  doc.setFontSize(16);
  doc.text(`${fmtUF(data.valorComercialUF)}  (${fmtCLP(data.valorComercialCLP)})`, margin + 4, y + 16);
  doc.setTextColor(0, 0, 0);
  y += 26;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  kv(L.unitValue, `${fmtUF(data.valorM2UF)} ${t.perM2}  (≈ ${fmtCLP(data.valorM2CLP)} ${t.perM2})`);
  para(data.observaciones);

  // 13. Firma digital del tasador
  sectionTitle(13);
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
      doc.text(L.signatureUnavailable, sigX + 4, sigY + sigBoxH / 2);
      doc.setTextColor(0);
    }
  } else {
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(L.signaturePending, sigX + 4, sigY + sigBoxH / 2);
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
  doc.text(`${L.signatureDate}: ${data.firmaFecha || data.fecha}`, sigX, sigY + sigBoxH + 12);
  if (data.firmaDataUrl) {
    doc.setTextColor(34, 197, 94);
    doc.text(L.signedDigitally, sigX + sigBoxW + 6, sigY + sigBoxH + 7);
    doc.setTextColor(120);
    doc.setFontSize(7);
    doc.text(L.signatureHash, sigX + sigBoxW + 6, sigY + sigBoxH + 12);
    doc.setTextColor(0);
  }
  y = sigY + sigBoxH + 18;

  drawPdfFooter(doc);
  return doc;
};
