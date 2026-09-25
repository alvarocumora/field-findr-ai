import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const OUT = resolve('public/social/valle-hualane-og.png');
const MASTERPLAN = resolve('public/projects/caone-hualane-168-921-masterplan.svg');
const LOGO = resolve('public/brands/valle-de-hualane-logo.svg');

await mkdir(resolve('public/social'), { recursive: true });

const [masterplanSvg, logoSvg] = await Promise.all([
  readFile(MASTERPLAN),
  readFile(LOGO),
]);

const background = await sharp(masterplanSvg, { density: 180 })
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .png()
  .toBuffer();

const logo = await sharp(logoSvg, { density: 180 })
  .resize({ width: 430, withoutEnlargement: true })
  .png()
  .toBuffer();

const overlay = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#082e25" stop-opacity=".96"/>
      <stop offset=".48" stop-color="#082e25" stop-opacity=".76"/>
      <stop offset=".76" stop-color="#082e25" stop-opacity=".12"/>
      <stop offset="1" stop-color="#082e25" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#shade)"/>
  <rect x="52" y="405" width="420" height="122" rx="24" fill="#071f1a" fill-opacity=".86" stroke="#e7bd61" stroke-width="2"/>
  <text x="82" y="444" font-family="Arial,Helvetica,sans-serif" font-size="19" font-weight="700" fill="#e7bd61" letter-spacing="2">PARCELAS DESDE 1 HECTÁREA</text>
  <text x="82" y="486" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="900" fill="#ffffff">$12.990.000 / ha</text>
  <text x="82" y="516" font-family="Arial,Helvetica,sans-serif" font-size="17" font-weight="600" fill="#d7e7df">Sector Caone · Hualañé · Región del Maule</text>
</svg>`);

await sharp(background)
  .composite([
    { input: overlay, top: 0, left: 0 },
    { input: logo, top: 64, left: 48 },
  ])
  .png({ compressionLevel: 9, quality: 95 })
  .toFile(OUT);

console.log('Generated public/social/valle-hualane-og.png (1200x630)');
