import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { DOCUMENTOS, PROPIEDAD } from '@/pages/dossier/islaMaipoData';

const PUBLIC_PATH = '/ficha/isla-de-maipo-galvez-1458';

const GREEN = [34, 94, 62] as const;
const DARK = [30, 35, 32] as const;
const GRAY = [110, 118, 114] as const;

const clp = (n: number) => '$' + n.toLocaleString('es-CL');
const m2 = (n: number) => n.toLocaleString('es-CL') + ' m2';

const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

/**
 * Resumen ejecutivo (PDF) de la ficha del predio para presentar a una entidad
 * financiera: identificación, valoración, dominio, deslindes, normativa,
 * urbanización y listado de antecedentes del data room.
 */
export async function generateIslaMaipoDossierPdf(options: { mapboxToken?: string | null } = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const H = 297;
  const margin = 16;
  const contentW = W - margin * 2;
  let y = 0;
  let page = 1;

  const footer = () => {
    doc.setDrawColor(225, 228, 226);
    doc.line(margin, H - 16, W - margin, H - 16);
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.text('OFERTA TERRENOS · Expediente confidencial · ofertaterrenos.com', margin, H - 11);
    doc.text(`Pagina ${page}`, W - margin, H - 11, { align: 'right' });
  };

  const newPage = () => {
    footer();
    doc.addPage();
    page += 1;
    y = margin + 4;
  };

  const ensure = (needed: number) => {
    if (y + needed > H - 22) newPage();
  };

  const section = (title: string) => {
    ensure(16);
    doc.setFillColor(...GREEN);
    doc.rect(margin, y, 3, 6, 'F');
    doc.setFontSize(11.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(title.toUpperCase(), margin + 6, y + 4.8);
    y += 11;
  };

  const kv = (label: string, value: string) => {
    const lines = doc.splitTextToSize(value, contentW - 52);
    ensure(lines.length * 4.6 + 3);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GRAY);
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(lines, margin + 50, y);
    y += lines.length * 4.6 + 2.2;
  };

  const paragraph = (text: string) => {
    const lines = doc.splitTextToSize(text, contentW);
    ensure(lines.length * 4.4 + 3);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(lines, margin, y);
    y += lines.length * 4.4 + 3;
  };

  const bullets = (items: string[]) => {
    items.forEach((it) => {
      const lines = doc.splitTextToSize(it, contentW - 6);
      ensure(lines.length * 4.4 + 2);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...DARK);
      doc.text('•', margin, y);
      doc.text(lines, margin + 5, y);
      y += lines.length * 4.4 + 1.8;
    });
    y += 2;
  };

  // ── Portada / cabecera ──
  const publicUrl =
    (typeof window !== 'undefined' ? window.location.origin : 'https://ofertaterrenos.com') + PUBLIC_PATH;

  doc.setFillColor(...GREEN);
  doc.rect(0, 0, W, 52, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('EXPEDIENTE DE PRESENTACION · ENTIDAD FINANCIERA', margin, 14);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.text(doc.splitTextToSize(PROPIEDAD.nombre, contentW - 36), margin, 24);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${PROPIEDAD.direccion} · Sector ${PROPIEDAD.sector} · ${PROPIEDAD.region}`, margin, 36);
  doc.setFontSize(7.5);
  doc.text(`Ficha digital: ${publicUrl}`, margin, 44);

  // QR al link publico de la ficha
  try {
    const qr = await QRCode.toDataURL(publicUrl, { margin: 1, width: 320 });
    const qrSize = 28;
    const qx = W - margin - qrSize;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qx - 2, 8, qrSize + 4, qrSize + 4, 2, 2, 'F');
    doc.addImage(qr, 'PNG', qx, 10, qrSize, qrSize);
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Escanear ficha online', qx + qrSize / 2, 45, { align: 'center' });
  } catch {
    // QR opcional
  }

  y = 62;

  // ── KPIs ──
  const kpis: [string, string, string][] = [
    ['Superficie total', '18,41 ha', m2(PROPIEDAD.superficieTotalM2)],
    [
      'Tasacion comercial',
      `UF ${PROPIEDAD.tasacionUf.toLocaleString('es-CL')}`,
      `${(PROPIEDAD.tasacionUf / PROPIEDAD.superficieTotalM2).toFixed(2).replace('.', ',')} UF/m2 · ${PROPIEDAD.tasacionFecha}`,
    ],
    ['Avaluo fiscal', clp(PROPIEDAD.avaluoFiscal), PROPIEDAD.avaluoFecha],
    ['ROL(es) SII', PROPIEDAD.roles, `Destino ${PROPIEDAD.destinoSii}`],
  ];
  const boxW = (contentW - 6) / 2;
  kpis.forEach((k, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = margin + col * (boxW + 6);
    const by = y + row * 24;
    doc.setDrawColor(226, 230, 227);
    doc.setFillColor(248, 250, 248);
    doc.roundedRect(bx, by, boxW, 20, 2, 2, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.text(k[0].toUpperCase(), bx + 4, by + 6);
    doc.setFontSize(11.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(k[1], bx + 4, by + 12.5);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(doc.splitTextToSize(k[2], boxW - 8)[0], bx + 4, by + 17.5);
  });
  y += 24 * Math.ceil(kpis.length / 2) + 4;

  // ── Mapa satelital ──
  if (options.mapboxToken) {
    const url = `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/pin-l+22c55e(${PROPIEDAD.lng},${PROPIEDAD.lat})/${PROPIEDAD.lng},${PROPIEDAD.lat},13.6,0/900x420@2x?access_token=${options.mapboxToken}`;
    const img = await fetchImageAsBase64(url);
    if (img) {
      const imgH = contentW * (420 / 900);
      ensure(imgH + 8);
      doc.addImage(img, 'JPEG', margin, y, contentW, imgH);
      y += imgH + 3;
      doc.setFontSize(7);
      doc.setTextColor(...GRAY);
      doc.text(
        `Coordenadas referenciales ${PROPIEDAD.lat.toFixed(5)}, ${PROPIEDAD.lng.toFixed(5)} · Imagen satelital Mapbox`,
        margin,
        y
      );
      y += 7;
    }
  }

  // ── Identificacion y dominio ──
  section('Identificacion y dominio');
  kv('Comuna / Region', `${PROPIEDAD.comuna}, ${PROPIEDAD.region}`);
  kv('Sector', PROPIEDAD.sector);
  kv('ROL(es) SII', `${PROPIEDAD.roles} · Destino ${PROPIEDAD.destinoSii}`);
  kv(
    'Superficies',
    `Total ${m2(PROPIEDAD.superficieTotalM2)} · Urbana ${m2(PROPIEDAD.superficieUrbanaM2)} · Rural ${m2(PROPIEDAD.superficieRuralM2)}`
  );
  kv(
    'Propietarios',
    PROPIEDAD.propietarios.map((p) => `${p.nombre} (RUT ${p.rut}) — ${p.pct}`).join('\n')
  );
  kv('Tasacion', `UF ${PROPIEDAD.tasacionUf.toLocaleString('es-CL')} (${clp(PROPIEDAD.tasacionClp)}) · ${PROPIEDAD.tasador}`);
  y += 2;

  // ── Sociedad e inscripcion ──
  section('Sociedad propietaria e inscripcion');
  kv('Razon social', `${PROPIEDAD.sociedad.razonSocial} · RUT ${PROPIEDAD.sociedad.rut}`);
  kv('Constitucion', `${PROPIEDAD.sociedad.constitucion} · ${PROPIEDAD.sociedad.domicilio}`);
  kv('Registro', PROPIEDAD.sociedad.registro);
  kv(
    'Inscripcion',
    `Fojas ${PROPIEDAD.inscripcion.fojas} N ${PROPIEDAD.inscripcion.numero}, ${PROPIEDAD.inscripcion.registro} ${PROPIEDAD.inscripcion.anio} · ${PROPIEDAD.inscripcion.cbr} · vigente al ${PROPIEDAD.inscripcion.vigenciaAl}`
  );
  kv(
    'Avaluos por rol',
    PROPIEDAD.avaluosDetalle
      .map((a) => `ROL ${a.rol} (${a.destino}) ${clp(a.monto)} · ${a.periodo}`)
      .join('\n')
  );
  y += 2;

  // ── Deslindes ──
  section('Deslindes');
  PROPIEDAD.deslindes.forEach((d) => kv(d.lado, `${d.con} · ${d.metros}`));
  y += 2;

  // ── Normativa ──
  section('Normativa urbanistica');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  ensure(8);
  doc.text(`Lote 4 · Urbano (${m2(PROPIEDAD.superficieUrbanaM2)})`, margin, y);
  y += 5;
  paragraph(PROPIEDAD.normativa.urbana);
  ensure(8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.text(`Lote 5 · Rural (${m2(PROPIEDAD.superficieRuralM2)})`, margin, y);
  y += 5;
  paragraph(PROPIEDAD.normativa.rural);

  // ── Urbanizacion ──
  section('Urbanizacion y servicios');
  bullets(PROPIEDAD.urbanizacion);

  // ── Antecedentes tecnicos ──
  section('Antecedentes tecnicos');
  bullets(PROPIEDAD.antecedentesTecnicos);

  // ── Data room ──
  section(`Data room documental (${DOCUMENTOS.length} antecedentes)`);
  DOCUMENTOS.forEach((d, i) => {
    const desc = doc.splitTextToSize(d.descripcion, contentW - 10);
    ensure(desc.length * 4.2 + 14);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(doc.splitTextToSize(`${i + 1}. ${d.titulo}`, contentW), margin, y);
    y += 5;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(`${d.categoria} · ${d.emisor} · ${d.fecha}`, margin + 5, y);
    y += 4.2;
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text(desc, margin + 5, y);
    y += desc.length * 4.2 + 4;
  });

  // ── Disclaimer ──
  ensure(20);
  doc.setDrawColor(226, 230, 227);
  doc.setFillColor(248, 250, 248);
  const disc = doc.splitTextToSize(
    `Documento de caracter informativo y confidencial, preparado para la evaluacion de una entidad financiera. Las cifras de valoracion provienen de ${PROPIEDAD.tasador} y no constituyen oferta ni compromiso de credito. Los antecedentes completos estan disponibles en el data room digital de la ficha.`,
    contentW - 8
  );
  doc.roundedRect(margin, y, contentW, disc.length * 4 + 8, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text(disc, margin + 4, y + 6);
  y += disc.length * 4 + 12;

  footer();
  doc.save('Ficha-Resumen-Galvez-1458-Isla-de-Maipo.pdf');
}
