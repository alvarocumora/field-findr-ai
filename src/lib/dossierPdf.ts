import { DOCUMENTOS, PROPIEDAD } from '@/pages/dossier/islaMaipoData';
import { BRAND, createFichaDoc, fetchImageAsBase64 } from '@/lib/pdf/fichaShell';

const PUBLIC_PATH = '/ficha/isla-de-maipo-galvez-1458';

const clp = (n: number) => '$' + n.toLocaleString('es-CL');
const m2 = (n: number) => n.toLocaleString('es-CL') + ' m2';

/**
 * Resumen ejecutivo (PDF) de la ficha del predio para presentar a una entidad
 * financiera. Construido con el shell único de fichas (logo, QR, pie de marca).
 */
export async function generateIslaMaipoDossierPdf(options: { mapboxToken?: string | null } = {}) {
  const f = createFichaDoc({
    footerNote: 'OFERTA TERRENOS · Expediente confidencial · ofertaterrenos.com',
  });
  const { doc, margin, contentW } = f;

  await f.header({
    eyebrow: 'Expediente de presentacion · entidad financiera',
    title: PROPIEDAD.nombre,
    subtitle: `${PROPIEDAD.direccion} · Sector ${PROPIEDAD.sector} · ${PROPIEDAD.region}`,
    qrUrl: PUBLIC_PATH,
  });

  // ── KPIs ──
  f.kpis([
    ['Superficie total', '18,41 ha', m2(PROPIEDAD.superficieTotalM2)],
    [
      'Tasacion comercial',
      `UF ${PROPIEDAD.tasacionUf.toLocaleString('es-CL')}`,
      `${(PROPIEDAD.tasacionUf / PROPIEDAD.superficieTotalM2).toFixed(2).replace('.', ',')} UF/m2 · ${PROPIEDAD.tasacionFecha}`,
    ],
    ['Avaluo fiscal', clp(PROPIEDAD.avaluoFiscal), PROPIEDAD.avaluoFecha],
    ['ROL(es) SII', PROPIEDAD.roles, `Destino ${PROPIEDAD.destinoSii}`],
  ]);

  // ── Mapa satelital ──
  if (options.mapboxToken) {
    const url = `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/pin-l+22c55e(${PROPIEDAD.lng},${PROPIEDAD.lat})/${PROPIEDAD.lng},${PROPIEDAD.lat},13.6,0/900x420@2x?access_token=${options.mapboxToken}`;
    const img = await fetchImageAsBase64(url);
    if (img) {
      f.image(
        img,
        contentW * (420 / 900),
        `Coordenadas referenciales ${PROPIEDAD.lat.toFixed(5)}, ${PROPIEDAD.lng.toFixed(5)} · Imagen satelital Mapbox`
      );
    }
  }

  // ── Identificacion y dominio ──
  f.section('Identificacion y dominio');
  f.kv('Comuna / Region', `${PROPIEDAD.comuna}, ${PROPIEDAD.region}`);
  f.kv('Sector', PROPIEDAD.sector);
  f.kv('ROL(es) SII', `${PROPIEDAD.roles} · Destino ${PROPIEDAD.destinoSii}`);
  f.kv(
    'Superficies',
    `Total ${m2(PROPIEDAD.superficieTotalM2)} · Urbana ${m2(PROPIEDAD.superficieUrbanaM2)} · Rural ${m2(PROPIEDAD.superficieRuralM2)}`
  );
  f.kv('Propietarios', PROPIEDAD.propietarios.map((p) => `${p.nombre} (RUT ${p.rut}) — ${p.pct}`).join('\n'));
  f.kv(
    'Tasacion',
    `UF ${PROPIEDAD.tasacionUf.toLocaleString('es-CL')} (${clp(PROPIEDAD.tasacionClp)}) · ${PROPIEDAD.tasador}`
  );
  f.y += 2;

  // ── Sociedad e inscripcion ──
  f.section('Sociedad propietaria e inscripcion');
  f.kv('Razon social', `${PROPIEDAD.sociedad.razonSocial} · RUT ${PROPIEDAD.sociedad.rut}`);
  f.kv('Constitucion', `${PROPIEDAD.sociedad.constitucion} · ${PROPIEDAD.sociedad.domicilio}`);
  f.kv('Registro', PROPIEDAD.sociedad.registro);
  f.kv(
    'Inscripcion',
    `Fojas ${PROPIEDAD.inscripcion.fojas} N ${PROPIEDAD.inscripcion.numero}, ${PROPIEDAD.inscripcion.registro} ${PROPIEDAD.inscripcion.anio} · ${PROPIEDAD.inscripcion.cbr} · vigente al ${PROPIEDAD.inscripcion.vigenciaAl}`
  );
  f.kv(
    'Avaluos por rol',
    PROPIEDAD.avaluosDetalle.map((a) => `ROL ${a.rol} (${a.destino}) ${clp(a.monto)} · ${a.periodo}`).join('\n')
  );
  f.y += 2;

  // ── Deslindes ──
  f.section('Deslindes');
  PROPIEDAD.deslindes.forEach((d) => f.kv(d.lado, `${d.con} · ${d.metros}`));
  f.y += 2;

  // ── Predios urbanos de la misma sociedad ──
  const predios = (PROPIEDAD as any).prediosUrbanos as
    | {
        rol: string;
        direccion: string;
        destino: string;
        propietario: string;
        avaluoTotal: number;
        avaluoActualizado: number;
        contribucionSemestral: number;
        periodo: string;
        expropiacion: string;
        docs: string[];
      }[]
    | undefined;

  if (predios && predios.length > 0) {
    f.section('Predios urbanos de la misma sociedad');
    f.paragraph(
      'Inmuebles urbanos adicionales de propiedad de la misma sociedad, con antecedentes tributarios y urbanisticos disponibles en el data room.'
    );
    predios.forEach((p) => {
      const docTitles = p.docs
        .map((id) => DOCUMENTOS.find((d) => d.id === id)?.titulo)
        .filter(Boolean) as string[];
      const docLines = doc.splitTextToSize(
        `Antecedentes: ${docTitles.length ? docTitles.join(' · ') : 'ver data room'}`,
        contentW - 10
      );
      const boxH = 24 + docLines.length * 3.8;
      f.ensure(boxH + 4);
      f.card((x, top, w) => {
        doc.setDrawColor(...BRAND.line);
        doc.setFillColor(...BRAND.soft);
        doc.roundedRect(x, top, w, boxH, 2, 2, 'FD');
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...BRAND.dark);
        doc.text(`ROL ${p.rol} · ${p.direccion}`, x + 5, top + 6.5);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...BRAND.gray);
        doc.text(`${p.destino} · ${p.propietario}`, x + 5, top + 11.5);
        doc.setFontSize(8);
        doc.setTextColor(...BRAND.dark);
        doc.text(
          `Avaluo total ${clp(p.avaluoTotal)} · Actualizado ${clp(p.avaluoActualizado)} · Contribucion ${clp(
            p.contribucionSemestral
          )} (${p.periodo})`,
          x + 5,
          top + 17
        );
        doc.setFontSize(7.5);
        doc.setTextColor(...BRAND.gray);
        doc.text(doc.splitTextToSize(p.expropiacion, w - 10)[0], x + 5, top + 21.5);
        doc.text(docLines, x + 5, top + 25.5);
        return boxH;
      });
    });
    f.y += 2;
  }

  // ── Normativa ──
  f.section('Normativa urbanistica');
  f.ensure(8);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BRAND.dark);
  doc.text(`Lote 4 · Urbano (${m2(PROPIEDAD.superficieUrbanaM2)})`, margin, f.y);
  f.y += 5;
  f.paragraph(PROPIEDAD.normativa.urbana);
  f.ensure(8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.dark);
  doc.text(`Lote 5 · Rural (${m2(PROPIEDAD.superficieRuralM2)})`, margin, f.y);
  f.y += 5;
  f.paragraph(PROPIEDAD.normativa.rural);

  // ── Urbanizacion ──
  f.section('Urbanizacion y servicios');
  f.bullets(PROPIEDAD.urbanizacion);

  // ── Antecedentes tecnicos ──
  f.section('Antecedentes tecnicos');
  f.bullets(PROPIEDAD.antecedentesTecnicos);

  // ── Data room ──
  f.section(`Data room documental (${DOCUMENTOS.length} antecedentes)`);
  DOCUMENTOS.forEach((d, i) => {
    const desc = doc.splitTextToSize(d.descripcion, contentW - 10);
    f.ensure(desc.length * 4.2 + 14);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND.dark);
    doc.text(doc.splitTextToSize(`${i + 1}. ${d.titulo}`, contentW), margin, f.y);
    f.y += 5;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.gray);
    doc.text(`${d.categoria} · ${d.emisor} · ${d.fecha}`, margin + 5, f.y);
    f.y += 4.2;
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.dark);
    doc.text(desc, margin + 5, f.y);
    f.y += desc.length * 4.2 + 4;
  });

  // ── Disclaimer ──
  f.note(
    `Documento de caracter informativo y confidencial, preparado para la evaluacion de una entidad financiera. Las cifras de valoracion provienen de ${PROPIEDAD.tasador} y no constituyen oferta ni compromiso de credito. Los antecedentes completos estan disponibles en el data room digital de la ficha.`
  );

  f.save('Ficha-Resumen-Galvez-1458-Isla-de-Maipo.pdf');
}
