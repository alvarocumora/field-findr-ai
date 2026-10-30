import sharp from 'sharp';

export interface ProjectShareImageInput {
  name: string;
  /** Pre-joined "city, region" or similar; pass '' when unknown. */
  location: string;
  /** Pre-formatted, e.g. "Desde $9.990.000 CLP" or "Consulta precios". */
  priceFromLabel: string;
  /** Pre-formatted, e.g. "52 parcelas disponibles" or "Consulta disponibilidad". */
  availabilityLabel: string;
}

const escapeXml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

/**
 * Greedy word-wrap for SVG <text>, which never wraps on its own. Caps at
 * maxLines; anything left over collapses, truncated, onto the last line.
 */
export const wrapLines = (text: string, maxChars: number, maxLines: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let i = 0;
  // Greedily fill every line except the last normally...
  while (lines.length < maxLines - 1 && i < words.length) {
    let current = words[i];
    i++;
    while (i < words.length) {
      const next = `${current} ${words[i]}`;
      if (next.length > maxChars) break;
      current = next;
      i++;
    }
    lines.push(current);
  }
  // ...and the last line absorbs everything left over, truncated if needed,
  // so no word is ever silently dropped.
  if (i < words.length) {
    const rest = words.slice(i).join(' ');
    lines.push(rest.length > maxChars ? `${rest.slice(0, maxChars - 1)}…` : rest);
  }
  return lines;
};

const LOGO_Y = 76;
const EYEBROW_Y = 184;
const TITLE_Y = [242, 302];
const BOX_Y = 384;
const BOX_H = 118;
const BOX_W = 620;

/**
 * Renders a branded 1200x630 share-card JPEG from real project data, no
 * external asset fetch required. Generic stand-in for projects that lack a
 * manually-curated image in SHARE_IMAGE_BY_SLUG (src/lib/landing/projectSocial.ts).
 */
export async function renderProjectShareImage(input: ProjectShareImageInput): Promise<Buffer> {
  const nameLines = wrapLines(input.name, 22, 2);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b342d"/>
      <stop offset="1" stop-color="#082e25"/>
    </linearGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#051a15" stop-opacity=".92"/>
      <stop offset=".55" stop-color="#051a15" stop-opacity=".55"/>
      <stop offset="1" stop-color="#051a15" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#shade)"/>
  <g font-family="Arial,Helvetica,sans-serif">
    <text x="64" y="${LOGO_Y}" font-size="30" font-weight="800" fill="#ffffff">Oferta<tspan fill="#22C55E">Terrenos</tspan><tspan font-size="17" fill="#d7e7df">.com</tspan></text>
    ${input.location ? `<text x="64" y="${EYEBROW_Y}" font-size="19" font-weight="700" fill="#e7bd61" letter-spacing="2">${escapeXml(input.location.toUpperCase())}</text>` : ''}
    ${nameLines.map((line, i) => `<text x="64" y="${TITLE_Y[i]}" font-size="54" font-weight="900" fill="#ffffff">${escapeXml(line)}</text>`).join('\n    ')}
    <rect x="56" y="${BOX_Y}" width="${BOX_W}" height="${BOX_H}" rx="20" fill="#071f1a" fill-opacity=".86" stroke="#e7bd61" stroke-width="2"/>
    <text x="84" y="${BOX_Y + 44}" font-size="30" font-weight="900" fill="#ffffff">${escapeXml(input.priceFromLabel)}</text>
    <text x="84" y="${BOX_Y + 80}" font-size="17" font-weight="600" fill="#d7e7df">${escapeXml(input.availabilityLabel)}</text>
  </g>
</svg>`;

  return sharp(Buffer.from(svg), { density: 180 })
    .resize(1200, 630)
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}
