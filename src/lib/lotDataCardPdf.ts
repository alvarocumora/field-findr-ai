import { Lot, LotFeatures } from '@/hooks/useLots';
import { BRAND, fetchImageAsBase64, publicUrl } from '@/lib/pdf/fichaShell';
import { renderFicha } from '@/lib/pdf/fichaTemplates';
import type { SentinelImageryResult } from '@/lib/satellite/sentinel';
import { formatSentinelDate, sentinelCloudLabel } from '@/lib/satellite/sentinel';
import { renderLotSatelliteSnapshot } from '@/lib/satellite/renderLotSatelliteSnapshot';

const TERRACOTTA = [184, 80, 66] as [number, number, number];
const SAND = [232, 220, 200] as [number, number, number];

const formatCLP = (n: number | null) => {
  if (!n) return 'Consultar';
  return '$' + n.toLocaleString('es-CL');
};

const buildMapboxStaticUrl = (lot: Lot, token: string, width = 800, height = 450): string | null => {
  const lng = lot.longitude ? Number(lot.longitude) : null;
  const lat = lot.latitude ? Number(lot.latitude) : null;
  if (lng == null || lat == null || Number.isNaN(lng) || Number.isNaN(lat)) return null;

  const polygon = (lot as any).polygon as number[][] | null;
  let overlay = '';
  if (polygon && polygon.length >= 3) {
    const coords = [...polygon];
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first);
    const geojson = {
      type: 'Feature',
      properties: {
        stroke: '#22C55E',
        'stroke-width': 3,
        fill: '#22C55E',
        'fill-opacity': 0.25,
      },
      geometry: { type: 'Polygon', coordinates: [coords] },
    };
    overlay = `geojson(${encodeURIComponent(JSON.stringify(geojson))})`;
  } else {
    overlay = `pin-l+22c55e(${lng},${lat})`;
  }
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${overlay}/${lng},${lat},15,0/${width}x${height}@2x?access_token=${token}`;
};

/** Ficha pública de un lote, generada con el shell único de fichas. */
export const generateLotDataCardPdf = async (
  lot: Lot,
  projectName: string,
  features: LotFeatures,
  options: { mapboxToken?: string | null; sentinelImagery?: SentinelImageryResult | null } = {}
) => {
  const lotPath = `/proyecto/${lot.project_id}?lote=${encodeURIComponent(lot.lot_number)}`;

  await renderFicha({
    template: 'lote',
    eyebrow: `Ficha de lote · ${projectName}`,
    title: `Lote ${lot.lot_number}`,
    subtitle: lot.name && lot.name !== lot.lot_number ? lot.name : undefined,
    qrUrl: lotPath,
    filename: `Ficha-Lote-${lot.lot_number}.pdf`,
    body: async (f) => {
      const { doc, margin, contentW, W } = f;

  // ── Estado + precio ──
  const statusLabel =
    lot.status === 'available' ? 'DISPONIBLE' : lot.status === 'reserved' ? 'RESERVADO' : 'VENDIDO';
  const statusColor: [number, number, number] =
    lot.status === 'available' ? BRAND.emerald : lot.status === 'reserved' ? [200, 150, 30] : [120, 120, 120];

  f.ensure(26);
  doc.setFillColor(...SAND);
  doc.roundedRect(margin, f.y, contentW, 20, 3, 3, 'F');
  doc.setFontSize(19);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TERRACOTTA);
  doc.text(formatCLP(lot.price), margin + 6, f.y + 13);

  const pricePerSqm = lot.price && lot.area ? lot.price / Number(lot.area) : null;
  if (pricePerSqm) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.gray);
    doc.text(`${formatCLP(pricePerSqm)}/m²`, W - margin - 34, f.y + 13, { align: 'right' });
  }

  const statusW = doc.getTextWidth(statusLabel) * 0.55 + 8;
  doc.setFillColor(...statusColor);
  doc.roundedRect(W - margin - statusW - 6, f.y + 6, statusW, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(statusLabel, W - margin - 6 - statusW / 2, f.y + 11.5, { align: 'center' });
  f.y += 26;

  // ── Imagen principal ──
  const images = (lot as any).images as string[] | null;
  if (images && images.length > 0) {
    const base64 = await fetchImageAsBase64(images[0]);
    if (base64) f.image(base64, contentW * (9 / 16));
  }

  // ── Datos tecnicos ──
  f.section('Datos tecnicos');
  f.kv('Superficie', `${Number(lot.area).toLocaleString('es-CL')} m²`);
  f.kv('Numero de lote', lot.lot_number);
  f.kv('Proyecto', projectName);
  if (lot.latitude && lot.longitude) {
    f.kv('Coordenadas', `${Number(lot.latitude).toFixed(5)}, ${Number(lot.longitude).toFixed(5)}`);
  }
  if (lot.elevation_avg) f.kv('Elevacion', `${Math.round(Number(lot.elevation_avg))} m snm`);

  const slopeMap: Record<string, string> = {
    flat: 'Plano',
    gentle: 'Pendiente suave',
    steep: 'Pendiente fuerte',
  };
  if (lot.slope_category && slopeMap[lot.slope_category]) {
    f.kv('Topografia', slopeMap[lot.slope_category]);
  }

  const services: string[] = [];
  if (features.hasWater) services.push('Agua');
  if (features.hasElectricity) services.push('Electricidad');
  if (features.hasRoad) services.push('Acceso vial');
  if (services.length > 0) f.kv('Servicios', services.join(', '));
  if (features.additionalFeatures?.length) {
    f.kv('Caracteristicas', features.additionalFeatures.join(', '));
  }
  f.y += 2;

  // ── Descripcion ──
  if (lot.description) {
    f.section('Descripcion');
    f.paragraph(lot.description);
  }

  // ── Imagen satelital actual ──
  let renderedSatellite = false;
  if (options.sentinelImagery?.available) {
    const sentinelBase64 = await renderLotSatelliteSnapshot(lot, options.sentinelImagery, {
      mapboxToken: options.mapboxToken,
      width: 1000,
      height: 600,
    });
    if (sentinelBase64) {
      f.section('Imagen satelital actual');
      f.image(
        sentinelBase64,
        contentW * (600 / 1000),
        'Sentinel-2 con el deslinde del lote superpuesto',
        'PNG',
      );
      f.paragraph(
        'Sentinel-2 / Microsoft Planetary Computer · adquisición ' +
          formatSentinelDate(options.sentinelImagery.acquisition_datetime) +
          ' · ' +
          sentinelCloudLabel(options.sentinelImagery.cloud_cover) +
          '. El deslinde corresponde a la geometría del proyecto y no se recalcula desde la imagen satelital.',
      );
      renderedSatellite = true;
    }
  }

  // Fallback: mapa satelital Mapbox si Sentinel no está disponible o no pudo renderizarse.
  if (!renderedSatellite && options.mapboxToken) {
    const mapUrl = buildMapboxStaticUrl(lot, options.mapboxToken);
    if (mapUrl) {
      const mapBase64 = await fetchImageAsBase64(mapUrl);
      if (mapBase64) {
        f.section('Ubicacion');
        f.image(mapBase64, contentW * (450 / 800), 'Imagen satelital Mapbox con el poligono del lote', 'PNG');
      }
    }
  }

  // ── Enlaces ──
  f.section('Enlaces');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BRAND.emerald);
  if (lot.latitude && lot.longitude) {
    f.ensure(8);
    doc.textWithLink('Ver ubicacion en Google Maps', margin, f.y, {
      url: `https://www.google.com/maps?q=${lot.latitude},${lot.longitude}`,
    });
    f.y += 6;
  }
  f.ensure(14);
  doc.textWithLink('Ver ficha en linea', margin, f.y, { url: publicUrl(lotPath) });
  f.y += 6;
  doc.textWithLink('Comparar este lote', margin, f.y, {
    url: publicUrl(`/comparar?lotes=${lot.id}`),
  });
  f.y += 8;

    },
  });
};
