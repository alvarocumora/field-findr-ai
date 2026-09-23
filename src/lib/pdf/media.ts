import type jsPDF from 'jspdf';

/** Bounded, browser-decoded assets: WebP/PNG/JPEG become compact PDF-safe JPEG. */
export async function fetchPdfImage(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  let objectUrl: string | undefined;
  try {
    const parsed = new URL(url, window.location.origin);
    if (!['https:', 'http:'].includes(parsed.protocol)) return null;
    const res = await fetch(parsed.href, { signal: controller.signal, credentials: 'omit' });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/') || blob.size > 12 * 1024 * 1024) return null;
    objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Image decode timeout')), 5_000);
      img.onload = () => { clearTimeout(timeout); resolve(); };
      img.onerror = () => { clearTimeout(timeout); reject(new Error('Invalid image')); };
      img.src = objectUrl!;
    });
    if (!img.naturalWidth || !img.naturalHeight) return null;
    const scale = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.88);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

/** Preserve the aspect ratio; contain plans, crop photographs within their frame. */
export function fittedImage(doc: jsPDF, data: string, x: number, y: number, w: number, h: number, fit: 'contain' | 'cover' = 'contain') {
  const props = doc.getImageProperties(data);
  const ratio = fit === 'cover' ? Math.max(w / props.width, h / props.height) : Math.min(w / props.width, h / props.height);
  const iw = props.width * ratio;
  const ih = props.height * ratio;
  doc.saveGraphicsState();
  try {
    doc.rect(x, y, w, h, null);
    doc.clip();
    doc.discardPath();
    doc.addImage(data, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  } finally {
    doc.restoreGraphicsState();
  }
}

/** PDF link annotations must never accept script/data schemes. */
export function safePdfLink(value: string, origin: string): string | null {
  try {
    const url = new URL(value, origin);
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
