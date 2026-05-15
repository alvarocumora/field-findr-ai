import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';
import {
  buildTasacionPdfBlob,
  buildTasacionFilename,
  type TasacionData,
} from './tasacionPdfGenerator';
import { sha256OfBlob, sha256OfJson, sha256OfString, shortHash } from './tasacionHash';

export interface PublishResult {
  id: string;
  validatorUrl: string;
  pdfPath: string;
  pdfFinalPath: string;
  pdfSha256: string;
  pdfFinalSha256: string;
  qrDataUrl: string;
  qrSvg: string;
  version: number;
}

const buildValidatorUrl = (id: string) => {
  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://ofertaterrenos.com';
  return `${origin}/tasacion/v/${id}`;
};

export const publishTasacion = async (
  data: TasacionData,
  opts: { listingId?: string | null } = {}
): Promise<PublishResult> => {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    throw new Error('Debes iniciar sesión para publicar una tasación.');
  }
  const userId = userData.user.id;

  // 1. Reservar id (uuid) — lo necesitamos para construir la URL del QR
  const id = crypto.randomUUID();
  const validatorUrl = buildValidatorUrl(id);

  // 2. Generar QR
  const qrPayload = JSON.stringify({ v: 1, id, url: validatorUrl });
  const [qrDataUrl, qrSvg] = await Promise.all([
    QRCode.toDataURL(validatorUrl, { errorCorrectionLevel: 'M', margin: 1, width: 360 }),
    QRCode.toString(validatorUrl, { type: 'svg', errorCorrectionLevel: 'M', margin: 1 }),
  ]);

  // 3. Primer PDF (sin QR) — sirve como "raw" inmutable
  const rawBlob = buildTasacionPdfBlob({ ...data, publicId: id });
  const rawSha = await sha256OfBlob(rawBlob);

  // 4. PDF final con QR + URL + hash visible
  const finalBlob = buildTasacionPdfBlob({
    ...data,
    qrDataUrl,
    validatorUrl,
    pdfHashShort: shortHash(rawSha),
    publicId: id,
  });
  const finalSha = await sha256OfBlob(finalBlob);

  // 5. Subir ambos al bucket privado
  const baseFilename = buildTasacionFilename(data);
  const pdfPath = `${id}/raw_${baseFilename}`;
  const pdfFinalPath = `${id}/final_${baseFilename}`;

  const upRaw = await supabase.storage
    .from('tasaciones')
    .upload(pdfPath, rawBlob, { contentType: 'application/pdf', upsert: false });
  if (upRaw.error) throw upRaw.error;

  const upFinal = await supabase.storage
    .from('tasaciones')
    .upload(pdfFinalPath, finalBlob, { contentType: 'application/pdf', upsert: false });
  if (upFinal.error) throw upFinal.error;

  // 6. Hashes auxiliares
  const payloadHash = await sha256OfJson(data);
  const firmaHash = data.firmaDataUrl ? await sha256OfString(data.firmaDataUrl) : null;

  // 7. Insertar registro
  const { error: insErr } = await supabase.from('tasaciones_publicadas').insert({
    id,
    listing_id: opts.listingId ?? null,
    publisher_user_id: userId,
    comuna: data.comuna,
    region: data.region,
    direccion: data.direccion,
    rol: data.rol,
    valor_uf: data.valorComercialUF,
    valor_clp: data.valorComercialCLP,
    valor_m2_uf: data.valorM2UF,
    superficie_m2: data.superficieTerreno,
    fecha_emision: data.fecha,
    tasador_nombre: data.firmaTasador || data.tasador,
    lang: data.lang ?? 'es',
    pdf_path: pdfPath,
    pdf_sha256: rawSha,
    pdf_final_path: pdfFinalPath,
    pdf_final_sha256: finalSha,
    firma_data_hash: firmaHash,
    payload_json: data as any,
    payload_hash: payloadHash,
    version: 1,
  });
  if (insErr) {
    // best-effort cleanup
    await supabase.storage.from('tasaciones').remove([pdfPath, pdfFinalPath]).catch(() => {});
    throw insErr;
  }

  return {
    id,
    validatorUrl,
    pdfPath,
    pdfFinalPath,
    pdfSha256: rawSha,
    pdfFinalSha256: finalSha,
    qrDataUrl,
    qrSvg,
    version: 1,
  };
};

export const downloadDataUrl = (dataUrl: string, filename: string) => {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export const downloadText = (text: string, filename: string, mime = 'image/svg+xml') => {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
