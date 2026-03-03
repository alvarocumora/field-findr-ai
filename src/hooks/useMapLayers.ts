import { useEffect, useRef, useCallback, useState, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import { InfoLayerState, InfoLayerConfig } from '@/components/map/MapInfoLayers';
import { buildWMSTileUrl, getProxiedUrl, WMS_BASE_URLS } from '@/services/chileGIS';
import { useIsochrone } from '@/hooks/useIsochrone';
import { Listing } from '@/hooks/useListings';
import {
  generateDemoZoningData,
  generateRiskZonesData,
  generateInfrastructureData,
  generateWaterBodiesData,
  generateGreenAreasData,
  generateRoadsData,
} from '@/components/map/demoGeoData';

// ── Heatmap data generator ──
const generateHeatmapData = (listings: Listing[]): GeoJSON.FeatureCollection => {
  const points: GeoJSON.Feature[] = [];
  const pricesPerM2 = listings
    .filter(l => l.lat && l.lng && l.area_m2 && l.area_m2 > 0)
    .map(l => l.price / l.area_m2!);
  const maxPrice = pricesPerM2.length > 0 ? Math.max(...pricesPerM2) : 100000;
  const minPrice = pricesPerM2.length > 0 ? Math.min(...pricesPerM2) : 0;
  const range = maxPrice - minPrice || 1;

  listings.forEach(listing => {
    if (listing.lat && listing.lng && listing.area_m2 && listing.area_m2 > 0) {
      const pricePerM2 = listing.price / listing.area_m2;
      const weight = Math.max(0.1, (pricePerM2 - minPrice) / range);
      points.push({
        type: 'Feature',
        properties: { weight, pricePerM2: Math.round(pricePerM2), title: listing.title },
        geometry: { type: 'Point', coordinates: [listing.lng, listing.lat] },
      });
      for (let i = 0; i < 3; i++) {
        points.push({
          type: 'Feature',
          properties: { weight: weight * (0.5 + Math.random() * 0.3) },
          geometry: { type: 'Point', coordinates: [listing.lng + (Math.random() - 0.5) * 0.02, listing.lat + (Math.random() - 0.5) * 0.02] },
        });
      }
    }
  });

  return { type: 'FeatureCollection', features: points };
};

// ── Tooltip generator (kept intact from original) ──
const generateLayerTooltipHTML = (layerType: string, properties: Record<string, unknown>): string => {
  const baseStyle = `font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,rgba(15,23,42,.95),rgba(30,41,59,.95));backdrop-filter:blur(12px);border-radius:12px;padding:12px 16px;color:#fff;min-width:200px;max-width:280px;box-shadow:0 10px 40px rgba(0,0,0,.3),0 0 0 1px rgba(255,255,255,.1);`;
  const headerStyle = `display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,.1);`;
  const labelStyle = `font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:rgba(255,255,255,.6);margin-bottom:2px;`;
  const valueStyle = `font-size:13px;font-weight:500;color:#fff;`;
  const badgeStyle = (c: string) => `display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:500;background:${c}20;color:${c};border:1px solid ${c}40;`;

  switch (layerType) {
    case 'zoning': {
      const zoningLabels: Record<string, { label: string; icon: string; color: string; desc: string }> = {
        residential: { label: 'Zona Residencial', icon: '🏠', color: '#22c55e', desc: 'Uso habitacional' },
        commercial: { label: 'Zona Comercial', icon: '🏪', color: '#3b82f6', desc: 'Comercio y servicios' },
        industrial: { label: 'Zona Industrial', icon: '🏭', color: '#f59e0b', desc: 'Actividad industrial' },
        agricultural: { label: 'Zona Agrícola', icon: '🌾', color: '#84cc16', desc: 'Uso agrícola y rural' },
        mixed: { label: 'Zona Mixta', icon: '🏗️', color: '#8b5cf6', desc: 'Uso mixto permitido' },
        protected: { label: 'Zona Protegida', icon: '🛡️', color: '#ef4444', desc: 'Área de conservación' },
      };
      const type = (properties.type as string) || 'mixed';
      const info = zoningLabels[type] || zoningLabels.mixed;
      const name = (properties.name as string) || 'Zona sin nombre';
      return `<div style="${baseStyle}"><div style="${headerStyle}"><span style="font-size:20px">${info.icon}</span><div><div style="font-size:14px;font-weight:600">${info.label}</div><div style="font-size:11px;color:rgba(255,255,255,.6)">Zonificación</div></div></div><div style="margin-bottom:8px"><div style="${labelStyle}">Sector</div><div style="${valueStyle}">${name}</div></div><div style="${badgeStyle(info.color)}"><span style="width:8px;height:8px;border-radius:50%;background:${info.color}"></span>${info.label}</div></div>`;
    }
    case 'risk': {
      const type = (properties.type as string) || 'seismic';
      const risk = (properties.risk as string) || 'medium';
      const name = (properties.name as string) || 'Zona de riesgo';
      const riskLevels: Record<string, { label: string; color: string }> = { high: { label: 'Alto', color: '#ef4444' }, medium: { label: 'Medio', color: '#f59e0b' }, low: { label: 'Bajo', color: '#22c55e' } };
      const ri = riskLevels[risk] || riskLevels.medium;
      return `<div style="${baseStyle}"><div style="${headerStyle}"><span style="font-size:20px">⚠️</span><div><div style="font-size:14px;font-weight:600">${name}</div><div style="font-size:11px;color:rgba(255,255,255,.6)">Análisis de Riesgo</div></div></div><div style="${badgeStyle(ri.color)}"><span style="width:8px;height:8px;border-radius:50%;background:${ri.color}"></span>${ri.label}</div></div>`;
    }
    case 'infrastructure': {
      const coverage = (properties.coverage as string) || 'partial';
      const coverageInfo: Record<string, { label: string; color: string }> = { full: { label: 'Completa', color: '#22c55e' }, partial: { label: 'Parcial', color: '#f59e0b' }, limited: { label: 'Limitada', color: '#ef4444' } };
      const info = coverageInfo[coverage] || coverageInfo.partial;
      return `<div style="${baseStyle}"><div style="${headerStyle}"><span style="font-size:20px">⚡</span><div><div style="font-size:14px;font-weight:600">${info.label}</div><div style="font-size:11px;color:rgba(255,255,255,.6)">Servicios Básicos</div></div></div><div style="${badgeStyle(info.color)}"><span style="width:8px;height:8px;border-radius:50%;background:${info.color}"></span>${info.label}</div></div>`;
    }
    case 'water': {
      const name = (properties.name as string) || 'Cuerpo de agua';
      return `<div style="${baseStyle}"><div style="${headerStyle}"><span style="font-size:20px">💧</span><div><div style="font-size:14px;font-weight:600">${name}</div><div style="font-size:11px;color:rgba(255,255,255,.6)">Recurso hídrico</div></div></div></div>`;
    }
    case 'green': {
      const name = (properties.name as string) || 'Área verde';
      return `<div style="${baseStyle}"><div style="${headerStyle}"><span style="font-size:20px">🌳</span><div><div style="font-size:14px;font-weight:600">${name}</div><div style="font-size:11px;color:rgba(255,255,255,.6)">Área Verde</div></div></div></div>`;
    }
    case 'road': {
      const name = (properties.name as string) || 'Vía';
      return `<div style="${baseStyle}"><div style="${headerStyle}"><span style="font-size:20px">🛣️</span><div><div style="font-size:14px;font-weight:600">${name}</div><div style="font-size:11px;color:rgba(255,255,255,.6)">Red Vial</div></div></div></div>`;
    }
    default:
      return '';
  }
};

// ── Hook ──
interface UseMapLayersOptions {
  map: MutableRefObject<mapboxgl.Map | null>;
  layerTooltipRef: MutableRefObject<mapboxgl.Popup | null>;
  styleLoadedRef: MutableRefObject<boolean>;
  listings: Listing[];
  isLoading: boolean;
}

export function useMapLayers(options: UseMapLayersOptions) {
  const { map, layerTooltipRef, styleLoadedRef, listings, isLoading } = options;

  const [infoLayers, setInfoLayers] = useState<InfoLayerState>({
    zoning: false, heatmap: false, infrastructure: false, riskZones: false,
    waterBodies: false, greenAreas: false, roads: false, hydrology: false,
    mining: false, biodiversity: false, isochrone: false,
  });

  const [layerConfig, setLayerConfig] = useState<InfoLayerConfig>({
    opacity: 0.6, heatmapIntensity: 0.8, useRealData: false,
  });

  const { geojson: isochroneData, center: isochroneCenter, fetchIsochrone, clearIsochrone } = useIsochrone();

  const handleLayerChange = useCallback((layer: keyof InfoLayerState, value: boolean) => {
    setInfoLayers(prev => ({ ...prev, [layer]: value }));
  }, []);

  const handleConfigChange = useCallback((config: Partial<InfoLayerConfig>) => {
    setLayerConfig(prev => ({ ...prev, ...config }));
  }, []);

  // ── Add demo GIS layers ──
  const addInfoLayers = useCallback(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const zoningColors: Record<string, string> = { residential: '#22c55e', commercial: '#3b82f6', industrial: '#f59e0b', agricultural: '#84cc16', mixed: '#8b5cf6', protected: '#ef4444' };
    const riskColors: Record<string, string> = { flood: '#0ea5e9', landslide: '#f59e0b', seismic: '#ef4444', tsunami: '#6366f1' };
    const infraColors: Record<string, string> = { full: '#22c55e', partial: '#f59e0b', limited: '#ef4444' };

    // Sources — wrapped in try-catch for rapid style switches
    const sources: { id: string; data: GeoJSON.FeatureCollection }[] = [
      { id: 'zoning-source', data: generateDemoZoningData() },
      { id: 'risk-source', data: generateRiskZonesData() },
      { id: 'infrastructure-source', data: generateInfrastructureData() },
      { id: 'water-source', data: generateWaterBodiesData() },
      { id: 'green-source', data: generateGreenAreasData() },
      { id: 'roads-source', data: generateRoadsData() },
      { id: 'heatmap-source', data: generateHeatmapData(listings) },
    ];
    sources.forEach(({ id, data }) => {
      try {
        if (!map.current!.getSource(id)) map.current!.addSource(id, { type: 'geojson', data });
      } catch { /* source already exists after rapid style switch */ }
    });

    // Layers (only add if not present)
    const addFill = (id: string, source: string, colorExpr: any, opBase: number, vis: boolean) => {
      try {
        if (!map.current!.getLayer(id)) {
          map.current!.addLayer({ id, type: 'fill', source, paint: { 'fill-color': colorExpr, 'fill-opacity': layerConfig.opacity * opBase }, layout: { visibility: vis ? 'visible' : 'none' } });
        }
      } catch { /* layer already exists */ }
    };
    const addLine = (id: string, source: string, colorExpr: any, width: any, opBase: number, vis: boolean, extra?: object) => {
      try {
        if (!map.current!.getLayer(id)) {
          map.current!.addLayer({ id, type: 'line', source, paint: { 'line-color': colorExpr, 'line-width': width, 'line-opacity': layerConfig.opacity * opBase, ...extra } as any, layout: { visibility: vis ? 'visible' : 'none' } });
        }
      } catch { /* layer already exists */ }
    };

    const matchZoning = ['match', ['get', 'type'], 'residential', zoningColors.residential, 'commercial', zoningColors.commercial, 'industrial', zoningColors.industrial, 'agricultural', zoningColors.agricultural, 'mixed', zoningColors.mixed, 'protected', zoningColors.protected, '#888888'];
    addFill('zoning-layer', 'zoning-source', matchZoning, 0.5, infoLayers.zoning);
    addLine('zoning-outline', 'zoning-source', matchZoning, 2, 1, infoLayers.zoning);

    const matchRisk = ['match', ['get', 'type'], 'flood', riskColors.flood, 'landslide', riskColors.landslide, 'seismic', riskColors.seismic, 'tsunami', riskColors.tsunami, '#888888'];
    addFill('risk-layer', 'risk-source', matchRisk, 0.4, infoLayers.riskZones);
    addLine('risk-outline', 'risk-source', matchRisk, 2, 1, infoLayers.riskZones, { 'line-dasharray': [2, 2] });

    const matchInfra = ['match', ['get', 'coverage'], 'full', infraColors.full, 'partial', infraColors.partial, 'limited', infraColors.limited, '#888888'];
    addFill('infrastructure-layer', 'infrastructure-source', matchInfra, 0.3, infoLayers.infrastructure);

    // Water
    if (!map.current!.getLayer('water-lines')) {
      map.current!.addLayer({ id: 'water-lines', type: 'line', source: 'water-source', filter: ['==', ['geometry-type'], 'LineString'], paint: { 'line-color': '#0ea5e9', 'line-width': 3, 'line-opacity': layerConfig.opacity }, layout: { visibility: infoLayers.waterBodies ? 'visible' : 'none' } });
      map.current!.addLayer({ id: 'water-areas', type: 'fill', source: 'water-source', filter: ['==', ['geometry-type'], 'Polygon'], paint: { 'fill-color': '#0ea5e9', 'fill-opacity': layerConfig.opacity * 0.5 }, layout: { visibility: infoLayers.waterBodies ? 'visible' : 'none' } });
    }

    addFill('green-layer', 'green-source', '#22c55e', 0.4, infoLayers.greenAreas);

    if (!map.current!.getLayer('roads-layer')) {
      map.current!.addLayer({ id: 'roads-layer', type: 'line', source: 'roads-source', paint: { 'line-color': ['match', ['get', 'type'], 'highway', '#64748b', 'main', '#94a3b8', '#cbd5e1'], 'line-width': ['match', ['get', 'type'], 'highway', 4, 'main', 2, 1], 'line-opacity': layerConfig.opacity }, layout: { visibility: infoLayers.roads ? 'visible' : 'none' } });
    }

    if (!map.current!.getLayer('heatmap-layer')) {
      map.current!.addLayer({ id: 'heatmap-layer', type: 'heatmap', source: 'heatmap-source', paint: { 'heatmap-weight': ['get', 'weight'], 'heatmap-intensity': layerConfig.heatmapIntensity, 'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,255,0)', 0.2, 'rgb(0,255,255)', 0.4, 'rgb(0,255,0)', 0.6, 'rgb(255,255,0)', 0.8, 'rgb(255,165,0)', 1, 'rgb(255,0,0)'], 'heatmap-radius': 30, 'heatmap-opacity': layerConfig.opacity }, layout: { visibility: infoLayers.heatmap ? 'visible' : 'none' } });
    }
  }, [infoLayers, layerConfig, listings, map]);

  // ── Setup hover events for layers ──
  const setupLayerHoverEvents = useCallback(() => {
    if (!map.current || !layerTooltipRef.current) return;
    const eventMap = [
      { layerId: 'zoning-layer', type: 'zoning' },
      { layerId: 'risk-layer', type: 'risk' },
      { layerId: 'infrastructure-layer', type: 'infrastructure' },
      { layerId: 'water-areas', type: 'water' },
      { layerId: 'water-lines', type: 'water' },
      { layerId: 'green-layer', type: 'green' },
      { layerId: 'roads-layer', type: 'road' },
    ];
    eventMap.forEach(({ layerId, type }) => {
      map.current?.on('mouseenter', layerId, (e) => {
        if (!map.current || !e.features?.length) return;
        map.current.getCanvas().style.cursor = 'pointer';
        const html = generateLayerTooltipHTML(type, e.features[0].properties || {});
        if (html && layerTooltipRef.current) {
          layerTooltipRef.current.setLngLat(e.lngLat).setHTML(html).addTo(map.current);
        }
      });
      map.current?.on('mousemove', layerId, (e) => {
        if (!layerTooltipRef.current || !e.features?.length) return;
        layerTooltipRef.current.setLngLat(e.lngLat);
      });
      map.current?.on('mouseleave', layerId, () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = '';
        layerTooltipRef.current?.remove();
      });
    });
  }, [map, layerTooltipRef]);

  // ── WMS layers ──
  const addRealWMSLayers = useCallback(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    const wmsSources = [
      { id: 'wms-zonificacion', url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.minvu), 'prms_zonificacion'), attr: '© MINVU' },
      { id: 'wms-riesgo-volcanico', url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.sernageomin), 'amenaza_volcanica'), attr: '© SERNAGEOMIN' },
      { id: 'wms-riesgo-tsunami', url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.shoa), 'cartas_inundacion'), attr: '© SHOA' },
      { id: 'wms-areas-protegidas', url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.conaf), 'snaspe'), attr: '© CONAF' },
      { id: 'wms-red-vial', url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.mop), 'red_vial'), attr: '© MOP' },
      { id: 'wms-hidrografia', url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.dga), 'red_hidrografica'), attr: '© DGA' },
      { id: 'wms-cuencas', url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.dga), 'cuencas'), attr: '© DGA' },
      { id: 'wms-catastro-minero', url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.sernageomin), 'catastro_minero'), attr: '© SERNAGEOMIN' },
      { id: 'wms-faenas-mineras', url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.sernageomin), 'faenas_mineras'), attr: '© SERNAGEOMIN' },
      { id: 'wms-ecosistemas', url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.mma), 'ecosistemas_terrestres'), attr: '© MMA' },
      { id: 'wms-especies-amenazadas', url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.mma), 'especies_amenazadas'), attr: '© MMA' },
    ];
    wmsSources.forEach(({ id, url, attr }) => {
      if (!map.current?.getSource(id)) {
        map.current?.addSource(id, { type: 'raster', tiles: [url], tileSize: 256, attribution: attr });
      }
    });
    const wmsLayers = [
      { id: 'wms-layer-zonificacion', source: 'wms-zonificacion', forLayer: 'zoning' },
      { id: 'wms-layer-riesgo', source: 'wms-riesgo-volcanico', forLayer: 'riskZones' },
      { id: 'wms-layer-areas-protegidas', source: 'wms-areas-protegidas', forLayer: 'greenAreas' },
      { id: 'wms-layer-red-vial', source: 'wms-red-vial', forLayer: 'roads' },
      { id: 'wms-layer-hidrografia', source: 'wms-hidrografia', forLayer: 'hydrology' },
      { id: 'wms-layer-cuencas', source: 'wms-cuencas', forLayer: 'hydrology' },
      { id: 'wms-layer-catastro-minero', source: 'wms-catastro-minero', forLayer: 'mining' },
      { id: 'wms-layer-faenas-mineras', source: 'wms-faenas-mineras', forLayer: 'mining' },
      { id: 'wms-layer-ecosistemas', source: 'wms-ecosistemas', forLayer: 'biodiversity' },
      { id: 'wms-layer-especies-amenazadas', source: 'wms-especies-amenazadas', forLayer: 'biodiversity' },
    ];
    wmsLayers.forEach(({ id, source, forLayer }) => {
      if (!map.current?.getLayer(id)) {
        map.current?.addLayer({ id, type: 'raster', source, paint: { 'raster-opacity': layerConfig.opacity }, layout: { visibility: infoLayers[forLayer as keyof InfoLayerState] && layerConfig.useRealData ? 'visible' : 'none' } });
      }
    });
  }, [infoLayers, layerConfig, map]);

  // ── Toggle demo/real ──
  useEffect(() => {
    if (!map.current || isLoading || !map.current.isStyleLoaded()) return;

    const demoLayers = ['zoning-layer', 'zoning-outline', 'risk-layer', 'risk-outline', 'infrastructure-layer', 'water-lines', 'water-areas', 'green-layer', 'roads-layer'];
    const wmsLayerIds = ['wms-layer-zonificacion', 'wms-layer-riesgo', 'wms-layer-areas-protegidas', 'wms-layer-red-vial', 'wms-layer-hidrografia', 'wms-layer-cuencas', 'wms-layer-catastro-minero', 'wms-layer-faenas-mineras', 'wms-layer-ecosistemas', 'wms-layer-especies-amenazadas'];

    if (layerConfig.useRealData) {
      addRealWMSLayers();
      demoLayers.forEach(id => { if (map.current?.getLayer(id)) map.current.setLayoutProperty(id, 'visibility', 'none'); });
      const wmsMap: Record<string, keyof InfoLayerState> = { 'wms-layer-zonificacion': 'zoning', 'wms-layer-riesgo': 'riskZones', 'wms-layer-areas-protegidas': 'greenAreas', 'wms-layer-red-vial': 'roads', 'wms-layer-hidrografia': 'hydrology', 'wms-layer-cuencas': 'hydrology', 'wms-layer-catastro-minero': 'mining', 'wms-layer-faenas-mineras': 'mining', 'wms-layer-ecosistemas': 'biodiversity', 'wms-layer-especies-amenazadas': 'biodiversity' };
      Object.entries(wmsMap).forEach(([id, key]) => {
        if (map.current?.getLayer(id)) {
          map.current.setLayoutProperty(id, 'visibility', infoLayers[key] ? 'visible' : 'none');
          if (infoLayers[key]) map.current.setPaintProperty(id, 'raster-opacity', layerConfig.opacity);
        }
      });
    } else {
      wmsLayerIds.forEach(id => { if (map.current?.getLayer(id)) map.current.setLayoutProperty(id, 'visibility', 'none'); });
      const layerMappings: Record<keyof InfoLayerState, string[]> = {
        zoning: ['zoning-layer', 'zoning-outline'], riskZones: ['risk-layer', 'risk-outline'],
        infrastructure: ['infrastructure-layer'], waterBodies: ['water-lines', 'water-areas'],
        greenAreas: ['green-layer'], roads: ['roads-layer'], heatmap: ['heatmap-layer'],
        hydrology: [], mining: [], biodiversity: [], isochrone: ['isochrone-fill', 'isochrone-outline'],
      };
      Object.entries(layerMappings).forEach(([key, layers]) => {
        const vis = infoLayers[key as keyof InfoLayerState];
        layers.forEach(id => { if (map.current?.getLayer(id)) map.current.setLayoutProperty(id, 'visibility', vis ? 'visible' : 'none'); });
      });
    }
  }, [layerConfig.useRealData, infoLayers, layerConfig.opacity, isLoading, addRealWMSLayers]);

  // ── Update opacity ──
  useEffect(() => {
    if (!map.current || isLoading || !map.current.isStyleLoaded()) return;
    const opacityLayers = [
      { id: 'zoning-layer', prop: 'fill-opacity', base: 0.5 },
      { id: 'zoning-outline', prop: 'line-opacity', base: 1 },
      { id: 'risk-layer', prop: 'fill-opacity', base: 0.4 },
      { id: 'risk-outline', prop: 'line-opacity', base: 1 },
      { id: 'infrastructure-layer', prop: 'fill-opacity', base: 0.3 },
      { id: 'water-lines', prop: 'line-opacity', base: 1 },
      { id: 'water-areas', prop: 'fill-opacity', base: 0.5 },
      { id: 'green-layer', prop: 'fill-opacity', base: 0.4 },
      { id: 'roads-layer', prop: 'line-opacity', base: 1 },
      { id: 'heatmap-layer', prop: 'heatmap-opacity', base: 1 },
    ];
    opacityLayers.forEach(({ id, prop, base }) => {
      if (map.current?.getLayer(id)) map.current.setPaintProperty(id, prop as any, layerConfig.opacity * base);
    });
    if (map.current?.getLayer('heatmap-layer')) {
      map.current.setPaintProperty('heatmap-layer', 'heatmap-intensity', layerConfig.heatmapIntensity);
    }
  }, [layerConfig, isLoading]);

  // ── Isochrone rendering ──
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    ['isochrone-fill', 'isochrone-outline', 'isochrone-labels'].forEach(id => { if (map.current?.getLayer(id)) map.current.removeLayer(id); });
    if (map.current.getSource('isochrone-source')) map.current.removeSource('isochrone-source');
    if (!isochroneData || !infoLayers.isochrone) return;

    map.current.addSource('isochrone-source', { type: 'geojson', data: isochroneData });
    const isoColors = ['#10b981', '#f59e0b', '#ef4444'];
    map.current.addLayer({ id: 'isochrone-fill', type: 'fill', source: 'isochrone-source', paint: { 'fill-color': ['match', ['get', 'contour'], 5, isoColors[0], 10, isoColors[1], 15, isoColors[2], '#888888'], 'fill-opacity': 0.15 } });
    map.current.addLayer({ id: 'isochrone-outline', type: 'line', source: 'isochrone-source', paint: { 'line-color': ['match', ['get', 'contour'], 5, isoColors[0], 10, isoColors[1], 15, isoColors[2], '#888888'], 'line-width': 2, 'line-dasharray': [3, 2], 'line-opacity': 0.8 } });
    if (isochroneCenter) map.current.flyTo({ center: isochroneCenter, zoom: 12, duration: 1000 });
  }, [isochroneData, isochroneCenter, infoLayers.isochrone]);

  // ── Internal style.load listener — re-add layers after style changes ──
  useEffect(() => {
    if (!map.current) return;
    const onStyleLoad = () => {
      addInfoLayers();
      setupLayerHoverEvents();
      if (layerConfig.useRealData) addRealWMSLayers();
    };
    map.current.on('style.load', onStyleLoad);
    // If style already loaded, run immediately
    if (map.current.isStyleLoaded()) onStyleLoad();
    const m = map.current;
    return () => { m?.off('style.load', onStyleLoad); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map.current, addInfoLayers, setupLayerHoverEvents, addRealWMSLayers, layerConfig.useRealData]);

  return {
    infoLayers,
    layerConfig,
    handleLayerChange,
    handleConfigChange,
    addInfoLayers,
    setupLayerHoverEvents,
    fetchIsochrone,
  };
}
