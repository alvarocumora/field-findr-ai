import jsPDF from 'jspdf';

interface ContractPDFData {
  projectName: string;
  projectLocation: string;
  projectRol?: string;
  lotNumber: string;
  lotArea: number;
  lotPrice: number | null;
  buyerName: string;
  buyerRut?: string;
  buyerEmail: string;
  buyerPhone?: string;
  reservationId: string;
  reservationAmount: number;
  currency: string;
  paidAt?: string;
  createdAt: string;
  generatedAt: Date;
}

const formatCurrency = (value: number, currency = 'CLP'): string =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);

const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);

// Brand colors
const EMERALD: [number, number, number] = [34, 197, 94];
const SKY: [number, number, number] = [14, 165, 233];
const DARK: [number, number, number] = [15, 23, 42];
const GRAY: [number, number, number] = [100, 116, 139];
const LIGHT_BG: [number, number, number] = [248, 250, 252];
const WHITE: [number, number, number] = [255, 255, 255];
const EMERALD_LIGHT: [number, number, number] = [220, 252, 231];

const drawTextLogo = (doc: jsPDF, x: number, y: number) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text('Oferta', x, y);
  const ofertaWidth = doc.getTextWidth('Oferta');
  doc.setFont('helvetica', 'normal');
  doc.text('terrenos', x + ofertaWidth, y);
};

const addHeaderToPage = (doc: jsPDF, contractNum: string, isFirstPage: boolean) => {
  const pw = doc.internal.pageSize.getWidth();

  if (isFirstPage) {
    // Gradient-like header using multiple rects
    const headerH = 42;
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps;
      const r = Math.round(EMERALD[0] + (SKY[0] - EMERALD[0]) * ratio);
      const g = Math.round(EMERALD[1] + (SKY[1] - EMERALD[1]) * ratio);
      const b = Math.round(EMERALD[2] + (SKY[2] - EMERALD[2]) * ratio);
      doc.setFillColor(r, g, b);
      doc.rect((pw / steps) * i, 0, (pw / steps) + 1, headerH, 'F');
    }

    // Text logo
    drawTextLogo(doc, 14, 19);

    // Subtitle
    doc.setTextColor(...WHITE);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Promesa de Compraventa – Documento Preliminar', 14, 27);


    // Contract number
    doc.setFontSize(8);
    doc.text(contractNum, pw - 15, 18, { align: 'right' });
  } else {
    // Thin colored bar on subsequent pages
    doc.setFillColor(...EMERALD);
    doc.rect(0, 0, pw, 4, 'F');
    doc.setFillColor(...SKY);
    doc.rect(pw / 2, 0, pw / 2, 4, 'F');

    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ofertaterrenos | ${contractNum}`, 15, 12);
  }
};

const addFooterToPage = (doc: jsPDF, contractNum: string, pageNum: number, totalPages: number) => {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const fY = ph - 18;

  // Footer bar
  doc.setFillColor(...LIGHT_BG);
  doc.rect(0, fY - 2, pw, 20, 'F');
  doc.setDrawColor(...EMERALD);
  doc.setLineWidth(0.4);
  doc.line(15, fY - 2, pw - 15, fY - 2);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(
    'Este documento es de carácter preliminar y referencial. No constituye un contrato vinculante hasta la firma ante notario.',
    pw / 2, fY + 4, { align: 'center' }
  );
  doc.text(
    `Ofertaterrenos | ${contractNum} | Página ${pageNum} de ${totalPages}`,
    pw / 2, fY + 10, { align: 'center' }
  );
};

const addWatermark = (doc: jsPDF) => {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  doc.setTextColor(200, 220, 200);
  doc.setFontSize(50);
  doc.setFont('helvetica', 'bold');
  // Diagonal watermark
  const text = 'OFERTATERRENOS';
  doc.text(text, pw / 2, ph / 2, {
    align: 'center',
    angle: 45,
  });
};

export const generateContractPDF = (data: ContractPDFData): void => {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const contractNum = `PROM-${data.reservationId.slice(0, 8).toUpperCase()}`;
  let y = 0;

  // ── Page 1: Header ──
  addWatermark(doc);
  addHeaderToPage(doc, contractNum, true);
  y = 52;

  // Date line
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GRAY);
  doc.text(`Generado el ${formatDate(data.generatedAt)}`, pw - 15, y, { align: 'right' });
  y += 12;

  // ── Section helpers ──
  const sectionTitle = (num: string, title: string) => {
    if (y > 255) {
      doc.addPage();
      addWatermark(doc);
      addHeaderToPage(doc, contractNum, false);
      y = 22;
    }
    doc.setFillColor(...EMERALD);
    doc.roundedRect(15, y - 5, pw - 30, 10, 2, 2, 'F');
    doc.setTextColor(...WHITE);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${num}. ${title}`, 20, y + 2);
    y += 14;
  };

  const row = (label: string, value: string, altBg = false) => {
    if (y > 268) {
      doc.addPage();
      addWatermark(doc);
      addHeaderToPage(doc, contractNum, false);
      y = 22;
    }
    if (altBg) {
      doc.setFillColor(...LIGHT_BG);
      doc.rect(18, y - 4, pw - 36, 7, 'F');
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(label, 22, y);
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.text(value, 78, y);
    y += 7;
  };

  // ── 1. Partes ──
  sectionTitle('I', 'PARTES INTERVINIENTES');

  doc.setDrawColor(...EMERALD_LIGHT);
  doc.setLineWidth(0.3);
  doc.roundedRect(18, y - 3, pw - 36, data.buyerRut && data.buyerPhone ? 32 : 22, 2, 2, 'S');

  row('Comprador:', data.buyerName, false);
  if (data.buyerRut) row('RUT:', data.buyerRut, true);
  row('Email:', data.buyerEmail, !data.buyerRut);
  if (data.buyerPhone) row('Teléfono:', data.buyerPhone, true);
  y += 6;

  // ── 2. Inmueble ──
  sectionTitle('II', 'IDENTIFICACIÓN DEL INMUEBLE');

  doc.setDrawColor(...EMERALD_LIGHT);
  doc.roundedRect(18, y - 3, pw - 36, data.projectRol ? 38 : 32, 2, 2, 'S');

  row('Proyecto:', data.projectName, false);
  row('Ubicación:', data.projectLocation, true);
  if (data.projectRol) row('Rol:', data.projectRol, false);
  row('Lote:', data.lotNumber, !data.projectRol);
  row('Superficie:', `${data.lotArea.toLocaleString('es-CL')} m²`, true);
  if (data.lotPrice) row('Precio:', formatCurrency(data.lotPrice, data.currency), false);
  y += 6;

  // ── 3. Condiciones Económicas ──
  sectionTitle('III', 'CONDICIONES ECONÓMICAS');

  // Highlight box for amount
  const boxH = 24;
  // Gradient-like box
  for (let i = 0; i < 10; i++) {
    const ratio = i / 10;
    const r = Math.round(EMERALD[0] + (SKY[0] - EMERALD[0]) * ratio);
    const g = Math.round(EMERALD[1] + (SKY[1] - EMERALD[1]) * ratio);
    const b = Math.round(EMERALD[2] + (SKY[2] - EMERALD[2]) * ratio);
    doc.setFillColor(r, g, b);
    doc.rect(18 + ((pw - 36) / 10) * i, y, (pw - 36) / 10 + 1, boxH, 'F');
  }
  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Seña abonada', pw / 2, y + 8, { align: 'center' });
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.reservationAmount, data.currency), pw / 2, y + 19, { align: 'center' });
  y += boxH + 8;

  row('Fecha de pago:', data.paidAt ? formatDate(new Date(data.paidAt)) : 'Pendiente', false);
  row('Fecha de reserva:', formatDate(new Date(data.createdAt)), true);
  y += 6;

  // ── 4. Cláusulas ──
  sectionTitle('IV', 'CLÁUSULAS GENERALES');

  const clauses = [
    {
      title: 'Objeto del Contrato',
      text: `Por medio del presente instrumento, las partes acuerdan celebrar una promesa de compraventa respecto del inmueble individualizado en la cláusula II, ubicado en ${data.projectLocation}, correspondiente al Lote ${data.lotNumber} del proyecto "${data.projectName}", con una superficie de ${data.lotArea.toLocaleString('es-CL')} m².`
    },
    {
      title: 'Precio y Forma de Pago',
      text: `El precio total del inmueble es de ${data.lotPrice ? formatCurrency(data.lotPrice, data.currency) : '[por definir]'}. A cuenta de dicho precio, el promitente comprador ha entregado en este acto la suma de ${formatCurrency(data.reservationAmount, data.currency)} a título de seña o arras, la cual será imputada al precio de venta al momento de la escrituración definitiva. El saldo restante deberá ser pagado en la forma y plazos que las partes convengan en el contrato definitivo.`
    },
    {
      title: 'Plazo para Escritura Definitiva',
      text: 'Las partes se obligan a suscribir el contrato definitivo de compraventa mediante escritura pública dentro del plazo de noventa (90) días corridos contados desde la fecha de este documento. Dicho plazo podrá ser prorrogado de común acuerdo por las partes, dejando constancia por escrito de dicha prórroga.'
    },
    {
      title: 'Obligaciones del Vendedor',
      text: 'El promitente vendedor se obliga a: (a) entregar el inmueble libre de todo gravamen, hipoteca, prohibición, embargo y cualquier otro vicio que afecte la libre disposición del bien; (b) proporcionar al comprador toda la documentación legal necesaria para la escrituración, incluyendo certificados de dominio vigente, certificados de hipotecas y gravámenes, y certificado de no expropiación; (c) mantener el inmueble en las mismas condiciones actuales hasta la entrega.'
    },
    {
      title: 'Obligaciones del Comprador',
      text: 'El promitente comprador se obliga a: (a) pagar el precio en la forma y plazos estipulados; (b) comparecer ante notario para la firma de la escritura definitiva en el plazo acordado; (c) asumir los gastos que le correspondan según lo estipulado en la cláusula VIII del presente instrumento.'
    },
    {
      title: 'Cláusula Penal por Incumplimiento',
      text: 'Si el promitente comprador no cumpliere con la obligación de celebrar el contrato definitivo dentro del plazo señalado, perderá la seña entregada, la que quedará en beneficio del vendedor a título de indemnización de perjuicios convencional. Si el incumplimiento fuere del promitente vendedor, éste deberá restituir el doble de la seña recibida al comprador, sin perjuicio de las demás acciones legales que correspondan.'
    },
    {
      title: 'Arras (Arts. 1803–1805 Código Civil)',
      text: 'La suma entregada como seña tendrá el carácter de arras confirmatorias en los términos del artículo 1803 del Código Civil chileno, constituyendo parte del precio y prueba de la celebración del contrato. Las partes renuncian expresamente al derecho de retractación contemplado en el artículo 1804 del mismo cuerpo legal.'
    },
    {
      title: 'Gastos e Impuestos',
      text: 'Los gastos notariales de la escritura definitiva serán de cargo del comprador. Los gastos de inscripción en el Conservador de Bienes Raíces serán igualmente de cargo del comprador. El impuesto a la renta por la utilidad en la enajenación, si correspondiere, será de cargo del vendedor conforme a la legislación tributaria vigente.'
    },
    {
      title: 'Domicilio y Jurisdicción',
      text: `Para todos los efectos legales derivados del presente instrumento, las partes fijan su domicilio en la ciudad de ${data.projectLocation.split(',')[0] || 'Santiago'} y se someten a la competencia de sus tribunales ordinarios de justicia.`
    },
    {
      title: 'Declaración de Buena Fe',
      text: 'Ambas partes declaran que actúan de buena fe en la celebración del presente instrumento, que los datos proporcionados son verídicos y que no existe impedimento legal alguno para la celebración del contrato definitivo de compraventa. Asimismo, declaran conocer y aceptar íntegramente las condiciones aquí estipuladas.'
    },
  ];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);

  clauses.forEach((clause, i) => {
    if (y > 248) {
      doc.addPage();
      addWatermark(doc);
      addHeaderToPage(doc, contractNum, false);
      y = 22;
    }

    // Clause title
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...EMERALD);
    doc.setFontSize(9);
    doc.text(`${i + 1}. ${clause.title}`, 20, y);
    y += 5;

    // Clause text
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(clause.text, pw - 44);
    
    // Check if we need a page break for the text
    if (y + lines.length * 4.2 > 268) {
      doc.addPage();
      addWatermark(doc);
      addHeaderToPage(doc, contractNum, false);
      y = 22;
    }
    
    doc.text(lines, 22, y);
    y += lines.length * 4.2 + 5;
  });

  y += 6;

  // ── 5. Notas Legales ──
  if (y > 230) {
    doc.addPage();
    addWatermark(doc);
    addHeaderToPage(doc, contractNum, false);
    y = 22;
  }

  sectionTitle('V', 'NOTAS LEGALES Y ANEXOS');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GRAY);

  const legalNotes = [
    'Conforme al artículo 1801 del Código Civil chileno, la venta de bienes raíces no se reputa perfecta ante la ley mientras no se haya otorgado escritura pública.',
    'El presente documento constituye una promesa de celebrar un contrato de compraventa en los términos del artículo 1554 del Código Civil.',
    'Se deja constancia que este instrumento preliminar no transfiere dominio ni posesión del inmueble prometido.',
    'Las partes podrán agregar anexos con planos, especificaciones técnicas y condiciones particulares que formarán parte integrante de este acuerdo.',
  ];

  legalNotes.forEach((note, i) => {
    if (y > 264) {
      doc.addPage();
      addWatermark(doc);
      addHeaderToPage(doc, contractNum, false);
      y = 22;
    }
    const prefix = `${String.fromCharCode(97 + i)}) `;
    const lines = doc.splitTextToSize(prefix + note, pw - 44);
    doc.text(lines, 22, y);
    y += lines.length * 4 + 3;
  });

  y += 10;

  // ── 6. Firmas ──
  if (y > 220) {
    doc.addPage();
    addWatermark(doc);
    addHeaderToPage(doc, contractNum, false);
    y = 22;
  }

  sectionTitle('VI', 'FIRMAS');

  y += 5;
  const sigX1 = 28;
  const sigX2 = pw / 2 + 12;
  const sigW = pw / 2 - 40;

  // Signature lines
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.4);
  doc.line(sigX1, y + 20, sigX1 + sigW, y + 20);
  doc.line(sigX2, y + 20, sigX2 + sigW, y + 20);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('EL PROMITENTE COMPRADOR', sigX1 + sigW / 2, y + 27, { align: 'center' });
  doc.text('EL PROMITENTE VENDEDOR', sigX2 + sigW / 2, y + 27, { align: 'center' });

  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(data.buyerName, sigX1 + sigW / 2, y + 34, { align: 'center' });
  doc.text(data.projectName, sigX2 + sigW / 2, y + 34, { align: 'center' });

  if (data.buyerRut) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`RUT: ${data.buyerRut}`, sigX1 + sigW / 2, y + 40, { align: 'center' });
  }

  // ── Apply footers to all pages ──
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addFooterToPage(doc, contractNum, p, totalPages);
  }

  doc.save(`promesa-ofertaterrenos-${data.lotNumber.toLowerCase().replace(/\s+/g, '-')}-${contractNum}.pdf`);
};

export type { ContractPDFData };
