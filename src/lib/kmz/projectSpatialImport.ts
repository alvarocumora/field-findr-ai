import { supabase } from '@/integrations/supabase/client';
import {
  buildPolygonsAdvanced,
  buildPolygonsFromMixedGeometry,
  extractRoadGeometries,
  parseKMLFile,
  parseKMZFile,
} from '@/lib/kmz';
import { planKmzImport, type KmzPricing } from '@/lib/kmz/kmzToLots';

export interface SpatialImportResult {
  inserted: number;
  updated: number;
  roads: number;
  polygons: number;
  sourceUrl: string | null;
  center: { lat: number; lng: number };
  sourceFileName: string;
}

export interface SpatialImportOptions {
  projectId: string;
  userId: string;
  file: File;
  pricing: KmzPricing;
  updateExisting?: boolean;
}

/**
 * Single source of truth for KMZ/KML ingestion across Rural Finder.
 *
 * Responsibilities:
 * - parse / reconstruct lot polygons;
 * - extract roads / servitudes;
 * - upsert lots by lot number;
 * - persist the original source file;
 * - update project centre + kmz_file_url;
 * - persist spatial metadata (roads + parser/source info) in landing_config.spatial.
 *
 * Keeping all entry points on this function prevents CreateProjectWizard,
 * KMZImportDialog and future Spatial Studio flows from drifting apart.
 */
export async function importProjectSpatialSource({
  projectId,
  userId,
  file,
  pricing,
  updateExisting = true,
}: SpatialImportOptions): Promise<SpatialImportResult> {
  const parsed = file.name.toLowerCase().endsWith('.kml')
    ? await parseKMLFile(file)
    : await parseKMZFile(file);

  if (!parsed.placemarks.length) {
    throw new Error('No se encontraron geometrías utilizables en el KMZ/KML.');
  }

  const { data: existingRows, error: existingError } = await supabase
    .from('lots')
    .select('id, lot_number, area')
    .eq('project_id', projectId);

  if (existingError) throw existingError;

  const existing = (existingRows ?? []).map((lot) => ({
    id: lot.id,
    lot_number: lot.lot_number,
    area: Number(lot.area),
  }));

  // Prefer explicit polygons, then reconstruct from mixed KML geometry.
  let polygons = parsed.placemarks.filter((p) => p.isPolygon && p.coordinates.length >= 3);
  const expected = Math.max(existing.length, parsed.placemarks.length);

  if (polygons.length < Math.max(1, expected * 0.5)) {
    const mixed = buildPolygonsFromMixedGeometry(
      parsed.placemarks,
      existing.map((l) => ({ lot_number: l.lot_number, area: l.area })),
    );
    if (mixed.length > polygons.length) polygons = mixed;
  }

  if (polygons.length < Math.max(1, existing.length * 0.3) && existing.length > 0) {
    const aggressive = buildPolygonsAdvanced(
      parsed.placemarks,
      existing.map((l) => ({ lot_number: l.lot_number, area: l.area })),
    );
    if (aggressive.length > polygons.length) polygons = aggressive;
  }

  if (!polygons.length) {
    throw new Error('El archivo contiene geometría, pero no fue posible reconstruir parcelas válidas.');
  }

  const roads = await extractRoadGeometries(file);
  const plan = planKmzImport(
    polygons,
    updateExisting ? existing.map(({ id, lot_number }) => ({ id, lot_number })) : [],
    pricing,
  );

  if (plan.toInsert.length) {
    const rows = plan.toInsert.map((row) => ({
      ...row,
      project_id: projectId,
      user_id: userId,
      polygon: row.polygon as unknown as never,
    }));
    const { error } = await supabase.from('lots').insert(rows);
    if (error) throw error;
  }

  if (updateExisting) {
    for (const item of plan.toUpdate) {
      const { error } = await supabase
        .from('lots')
        .update({
          polygon: item.row.polygon as unknown as never,
          area: item.row.area,
          latitude: item.row.latitude,
          longitude: item.row.longitude,
          name: item.row.name,
          description: item.row.description,
        })
        .eq('id', item.id);
      if (error) throw error;
    }
  }

  // Store the original source file so Restore KMZ / tour / future re-processing
  // always use the same technical source. property-images is public and its
  // policy scopes writes by the first folder (= auth user id).
  const ext = file.name.toLowerCase().endsWith('.kml') ? 'kml' : 'kmz';
  const safeName = file.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const storagePath = `${userId}/projects/${projectId}/spatial/${Date.now()}-${safeName || `source.${ext}`}`;

  let sourceUrl: string | null = null;
  const { error: uploadError } = await supabase.storage
    .from('property-images')
    .upload(storagePath, file, { upsert: false, contentType: file.type || undefined });

  if (!uploadError) {
    sourceUrl = supabase.storage.from('property-images').getPublicUrl(storagePath).data.publicUrl;
  } else {
    // Geometry import should still succeed if archival upload fails.
    console.warn('Spatial source archival upload failed:', uploadError);
  }

  const { data: projectRow } = await supabase
    .from('projects')
    .select('landing_config')
    .eq('id', projectId)
    .single();

  const currentConfig =
    projectRow?.landing_config &&
    typeof projectRow.landing_config === 'object' &&
    !Array.isArray(projectRow.landing_config)
      ? (projectRow.landing_config as Record<string, unknown>)
      : {};

  const spatial = {
    source_file_name: file.name,
    source_file_url: sourceUrl,
    imported_at: new Date().toISOString(),
    parser_version: 'rural-finder-spatial-v1',
    polygons: polygons.length,
    roads: roads.features.length,
    roads_geojson: roads,
    bounds: parsed.bounds,
    center: parsed.center,
  };

  const projectPatch: Record<string, unknown> = {
    latitude: parsed.center.lat,
    longitude: parsed.center.lng,
    landing_config: { ...currentConfig, spatial },
  };
  if (sourceUrl) projectPatch.kmz_file_url = sourceUrl;

  const { error: projectError } = await supabase
    .from('projects')
    .update(projectPatch as never)
    .eq('id', projectId);

  if (projectError) throw projectError;

  return {
    inserted: plan.toInsert.length,
    updated: updateExisting ? plan.toUpdate.length : 0,
    roads: roads.features.length,
    polygons: polygons.length,
    sourceUrl,
    center: parsed.center,
    sourceFileName: file.name,
  };
}
