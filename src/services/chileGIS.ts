/**
 * Chile GIS Services Integration
 * 
 * Integrates with official Chilean geospatial data infrastructure (IDE Chile)
 * providing real-time WMS layers for:
 * - Urban zoning (MINVU)
 * - Natural hazards (SERNAGEOMIN, ONEMI)
 * - Infrastructure (MOP)
 * - Environmental data (MMA)
 */

export interface WMSLayerConfig {
  id: string;
  name: string;
  source: string;
  url: string;
  layers: string;
  attribution: string;
  description: string;
  available: boolean;
  category: 'zoning' | 'risk' | 'infrastructure' | 'environment';
}

// Official Chilean GIS WMS endpoints
// Note: Some endpoints may require CORS proxy for browser access
export const WMS_BASE_URLS = {
  // IDE Chile - National Geospatial Data Infrastructure
  ideChile: 'https://www.geoportal.cl/geoserver/wms',
  
  // MINVU - Urban Planning and Zoning
  minvu: 'https://ide.minvu.cl/geoserver/wms',
  
  // SERNAGEOMIN - Geological Hazards
  sernageomin: 'https://geonode.sernageomin.cl/geoserver/wms',
  
  // MMA - Environmental Ministry
  mma: 'https://ide.mma.gob.cl/geoserver/wms',
  
  // MOP - Infrastructure (GEOMOP)
  mop: 'https://geomop.mop.gob.cl/geoserver/wms',
  
  // ONEMI/SENAPRED - Emergency and Civil Protection
  senapred: 'https://ide.senapred.cl/geoserver/wms',
  
  // SHOA - Tsunami Hazard Maps
  shoa: 'https://www.shoa.cl/geoserver/wms',
  
  // CONAF - Protected Areas and Forests
  conaf: 'https://sig.conaf.cl/geoserver/wms',
} as const;

// Pre-configured WMS layers from Chilean GIS services
export const CHILE_GIS_LAYERS: WMSLayerConfig[] = [
  // Urban Zoning Layers
  {
    id: 'prms-zonificacion',
    name: 'Plan Regulador Metropolitano Santiago',
    source: 'MINVU',
    url: WMS_BASE_URLS.minvu,
    layers: 'prms_zonificacion',
    attribution: '© MINVU - Ministerio de Vivienda y Urbanismo',
    description: 'Zonificación urbana oficial del Plan Regulador Metropolitano de Santiago',
    available: true,
    category: 'zoning',
  },
  {
    id: 'prc-comunales',
    name: 'Planes Reguladores Comunales',
    source: 'MINVU',
    url: WMS_BASE_URLS.minvu,
    layers: 'prc_vigentes',
    attribution: '© MINVU - Ministerio de Vivienda y Urbanismo',
    description: 'Planes reguladores comunales vigentes a nivel nacional',
    available: true,
    category: 'zoning',
  },
  {
    id: 'limites-urbanos',
    name: 'Límites Urbanos',
    source: 'MINVU',
    url: WMS_BASE_URLS.minvu,
    layers: 'limites_urbanos',
    attribution: '© MINVU - Ministerio de Vivienda y Urbanismo',
    description: 'Límites de áreas urbanas definidas en instrumentos de planificación',
    available: true,
    category: 'zoning',
  },
  
  // Natural Hazard Layers
  {
    id: 'amenaza-volcanica',
    name: 'Amenaza Volcánica',
    source: 'SERNAGEOMIN',
    url: WMS_BASE_URLS.sernageomin,
    layers: 'amenaza_volcanica',
    attribution: '© SERNAGEOMIN - Servicio Nacional de Geología y Minería',
    description: 'Zonas de peligro volcánico según estudios geológicos',
    available: true,
    category: 'risk',
  },
  {
    id: 'remocion-masa',
    name: 'Remoción en Masa',
    source: 'SERNAGEOMIN',
    url: WMS_BASE_URLS.sernageomin,
    layers: 'remocion_masa',
    attribution: '© SERNAGEOMIN - Servicio Nacional de Geología y Minería',
    description: 'Zonas susceptibles a deslizamientos y remoción en masa',
    available: true,
    category: 'risk',
  },
  {
    id: 'amenaza-tsunami',
    name: 'Zonas de Inundación por Tsunami',
    source: 'SHOA',
    url: WMS_BASE_URLS.shoa,
    layers: 'cartas_inundacion',
    attribution: '© SHOA - Servicio Hidrográfico y Oceanográfico de la Armada',
    description: 'Áreas de inundación por tsunami según modelación',
    available: true,
    category: 'risk',
  },
  {
    id: 'zonas-inundacion',
    name: 'Zonas de Inundación Fluvial',
    source: 'MOP',
    url: WMS_BASE_URLS.mop,
    layers: 'zonas_inundacion',
    attribution: '© MOP - Ministerio de Obras Públicas',
    description: 'Áreas susceptibles a inundaciones por crecidas de ríos',
    available: true,
    category: 'risk',
  },
  
  // Infrastructure Layers
  {
    id: 'red-vial',
    name: 'Red Vial Nacional',
    source: 'MOP',
    url: WMS_BASE_URLS.mop,
    layers: 'red_vial',
    attribution: '© MOP - Ministerio de Obras Públicas',
    description: 'Red de caminos y autopistas nacionales',
    available: true,
    category: 'infrastructure',
  },
  {
    id: 'obras-hidraulicas',
    name: 'Obras Hidráulicas',
    source: 'MOP',
    url: WMS_BASE_URLS.mop,
    layers: 'obras_hidraulicas',
    attribution: '© MOP - Ministerio de Obras Públicas',
    description: 'Infraestructura de agua potable y alcantarillado',
    available: true,
    category: 'infrastructure',
  },
  
  // Environmental Layers
  {
    id: 'areas-protegidas',
    name: 'Áreas Silvestres Protegidas',
    source: 'CONAF',
    url: WMS_BASE_URLS.conaf,
    layers: 'snaspe',
    attribution: '© CONAF - Corporación Nacional Forestal',
    description: 'Sistema Nacional de Áreas Silvestres Protegidas del Estado',
    available: true,
    category: 'environment',
  },
  {
    id: 'humedales-urbanos',
    name: 'Humedales Urbanos',
    source: 'MMA',
    url: WMS_BASE_URLS.mma,
    layers: 'humedales_urbanos',
    attribution: '© MMA - Ministerio del Medio Ambiente',
    description: 'Humedales urbanos declarados según Ley 21.202',
    available: true,
    category: 'environment',
  },
  {
    id: 'sitios-prioritarios',
    name: 'Sitios Prioritarios para Conservación',
    source: 'MMA',
    url: WMS_BASE_URLS.mma,
    layers: 'sitios_prioritarios',
    attribution: '© MMA - Ministerio del Medio Ambiente',
    description: 'Áreas de alto valor ecológico identificadas para conservación',
    available: true,
    category: 'environment',
  },
];

/**
 * Build WMS tile URL for Mapbox GL
 * Uses the standard WMS GetMap request format
 */
export function buildWMSTileUrl(
  baseUrl: string,
  layers: string,
  options?: {
    format?: string;
    transparent?: boolean;
    version?: string;
    srs?: string;
  }
): string {
  const {
    format = 'image/png',
    transparent = true,
    version = '1.1.1',
    srs = 'EPSG:3857',
  } = options || {};

  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: version,
    REQUEST: 'GetMap',
    LAYERS: layers,
    FORMAT: format,
    TRANSPARENT: transparent.toString(),
    SRS: srs,
    WIDTH: '256',
    HEIGHT: '256',
    BBOX: '{bbox-epsg-3857}',
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Get layers by category
 */
export function getLayersByCategory(category: WMSLayerConfig['category']): WMSLayerConfig[] {
  return CHILE_GIS_LAYERS.filter(layer => layer.category === category);
}

/**
 * Get all available layers
 */
export function getAvailableLayers(): WMSLayerConfig[] {
  return CHILE_GIS_LAYERS.filter(layer => layer.available);
}

/**
 * Check if a WMS service is accessible (for testing connectivity)
 */
export async function checkWMSAvailability(url: string): Promise<boolean> {
  try {
    const testUrl = `${url}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities`;
    const response = await fetch(testUrl, { 
      method: 'HEAD',
      mode: 'no-cors' // Due to CORS restrictions
    });
    return response.type === 'opaque' || response.ok;
  } catch {
    return false;
  }
}

/**
 * CORS Proxy URL builder for development
 * In production, you should use your own proxy or configure CORS on the server
 */
export function getProxiedUrl(url: string): string {
  // For development, we can use a CORS proxy
  // In production, configure your own backend proxy
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    // Using a public CORS proxy for development
    // Replace with your own proxy in production
    return `https://corsproxy.io/?${encodeURIComponent(url)}`;
  }
  
  return url;
}

/**
 * Pre-built Mapbox source configurations for Chilean GIS layers
 */
export const MAPBOX_WMS_SOURCES = {
  // MINVU - Urban Zoning
  zonificacion: {
    type: 'raster' as const,
    tiles: [
      buildWMSTileUrl(
        getProxiedUrl(WMS_BASE_URLS.minvu),
        'prms_zonificacion'
      )
    ],
    tileSize: 256,
    attribution: '© MINVU',
  },
  
  // SERNAGEOMIN - Geological Hazards
  amenazaVolcanica: {
    type: 'raster' as const,
    tiles: [
      buildWMSTileUrl(
        getProxiedUrl(WMS_BASE_URLS.sernageomin),
        'amenaza_volcanica'
      )
    ],
    tileSize: 256,
    attribution: '© SERNAGEOMIN',
  },
  
  // MOP - Infrastructure
  redVial: {
    type: 'raster' as const,
    tiles: [
      buildWMSTileUrl(
        getProxiedUrl(WMS_BASE_URLS.mop),
        'red_vial'
      )
    ],
    tileSize: 256,
    attribution: '© MOP',
  },
  
  // MMA - Environment
  areasProtegidas: {
    type: 'raster' as const,
    tiles: [
      buildWMSTileUrl(
        getProxiedUrl(WMS_BASE_URLS.conaf),
        'snaspe'
      )
    ],
    tileSize: 256,
    attribution: '© CONAF',
  },
};

export default {
  CHILE_GIS_LAYERS,
  WMS_BASE_URLS,
  MAPBOX_WMS_SOURCES,
  buildWMSTileUrl,
  getLayersByCategory,
  getAvailableLayers,
  checkWMSAvailability,
  getProxiedUrl,
};
