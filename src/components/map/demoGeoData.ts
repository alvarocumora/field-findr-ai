// Demo GeoJSON data for Chile regions - extracted from EnhancedMap for maintainability

export const generateDemoZoningData = (): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { type: 'residential', name: 'Zona Residencial Las Condes' },
      geometry: { type: 'Polygon', coordinates: [[[-70.58, -33.40], [-70.54, -33.40], [-70.54, -33.43], [-70.58, -33.43], [-70.58, -33.40]]] }
    },
    {
      type: 'Feature',
      properties: { type: 'commercial', name: 'Zona Comercial Providencia' },
      geometry: { type: 'Polygon', coordinates: [[[-70.62, -33.42], [-70.58, -33.42], [-70.58, -33.45], [-70.62, -33.45], [-70.62, -33.42]]] }
    },
    {
      type: 'Feature',
      properties: { type: 'industrial', name: 'Zona Industrial Quilicura' },
      geometry: { type: 'Polygon', coordinates: [[[-70.70, -33.35], [-70.65, -33.35], [-70.65, -33.40], [-70.70, -33.40], [-70.70, -33.35]]] }
    },
    {
      type: 'Feature',
      properties: { type: 'agricultural', name: 'Zona Agrícola Casablanca' },
      geometry: { type: 'Polygon', coordinates: [[[-71.45, -33.30], [-71.35, -33.30], [-71.35, -33.40], [-71.45, -33.40], [-71.45, -33.30]]] }
    },
    {
      type: 'Feature',
      properties: { type: 'mixed', name: 'Zona Mixta Ñuñoa' },
      geometry: { type: 'Polygon', coordinates: [[[-70.60, -33.45], [-70.56, -33.45], [-70.56, -33.48], [-70.60, -33.48], [-70.60, -33.45]]] }
    },
    {
      type: 'Feature',
      properties: { type: 'protected', name: 'Reserva Nacional Río Clarillo' },
      geometry: { type: 'Polygon', coordinates: [[[-70.48, -33.72], [-70.38, -33.72], [-70.38, -33.82], [-70.48, -33.82], [-70.48, -33.72]]] }
    },
  ]
});

export const generateRiskZonesData = (): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { type: 'flood', risk: 'high', name: 'Zona Inundable Mapocho' },
      geometry: { type: 'Polygon', coordinates: [[[-70.68, -33.43], [-70.55, -33.43], [-70.55, -33.45], [-70.68, -33.45], [-70.68, -33.43]]] }
    },
    {
      type: 'Feature',
      properties: { type: 'landslide', risk: 'medium', name: 'Riesgo Remoción Lo Barnechea' },
      geometry: { type: 'Polygon', coordinates: [[[-70.45, -33.35], [-70.38, -33.35], [-70.38, -33.42], [-70.45, -33.42], [-70.45, -33.35]]] }
    },
    {
      type: 'Feature',
      properties: { type: 'seismic', risk: 'medium', name: 'Zona Sísmica Central' },
      geometry: { type: 'Polygon', coordinates: [[[-70.75, -33.50], [-70.50, -33.50], [-70.50, -33.55], [-70.75, -33.55], [-70.75, -33.50]]] }
    },
    {
      type: 'Feature',
      properties: { type: 'tsunami', risk: 'high', name: 'Zona Tsunami Valparaíso' },
      geometry: { type: 'Polygon', coordinates: [[[-71.65, -33.02], [-71.60, -33.02], [-71.60, -33.08], [-71.65, -33.08], [-71.65, -33.02]]] }
    },
  ]
});

export const generateInfrastructureData = (): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { coverage: 'full', services: ['water', 'electricity', 'sewage', 'gas'] },
      geometry: { type: 'Polygon', coordinates: [[[-70.68, -33.40], [-70.52, -33.40], [-70.52, -33.50], [-70.68, -33.50], [-70.68, -33.40]]] }
    },
    {
      type: 'Feature',
      properties: { coverage: 'partial', services: ['water', 'electricity'] },
      geometry: { type: 'Polygon', coordinates: [[[-70.80, -33.35], [-70.68, -33.35], [-70.68, -33.45], [-70.80, -33.45], [-70.80, -33.35]]] }
    },
    {
      type: 'Feature',
      properties: { coverage: 'limited', services: ['electricity'] },
      geometry: { type: 'Polygon', coordinates: [[[-70.90, -33.30], [-70.80, -33.30], [-70.80, -33.45], [-70.90, -33.45], [-70.90, -33.30]]] }
    },
  ]
});

export const generateWaterBodiesData = (): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { type: 'river', name: 'Río Mapocho' },
      geometry: { type: 'LineString', coordinates: [[-70.78, -33.42], [-70.70, -33.43], [-70.60, -33.43], [-70.50, -33.44], [-70.40, -33.45]] }
    },
    {
      type: 'Feature',
      properties: { type: 'river', name: 'Río Maipo' },
      geometry: { type: 'LineString', coordinates: [[-70.30, -33.60], [-70.45, -33.62], [-70.60, -33.65], [-70.80, -33.68], [-71.00, -33.70]] }
    },
    {
      type: 'Feature',
      properties: { type: 'lake', name: 'Laguna Carén' },
      geometry: { type: 'Polygon', coordinates: [[[-70.88, -33.45], [-70.86, -33.45], [-70.86, -33.47], [-70.88, -33.47], [-70.88, -33.45]]] }
    },
  ]
});

export const generateGreenAreasData = (): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { type: 'park', name: 'Parque Metropolitano' },
      geometry: { type: 'Polygon', coordinates: [[[-70.64, -33.40], [-70.60, -33.40], [-70.60, -33.44], [-70.64, -33.44], [-70.64, -33.40]]] }
    },
    {
      type: 'Feature',
      properties: { type: 'park', name: "Parque O'Higgins" },
      geometry: { type: 'Polygon', coordinates: [[[-70.66, -33.46], [-70.64, -33.46], [-70.64, -33.48], [-70.66, -33.48], [-70.66, -33.46]]] }
    },
    {
      type: 'Feature',
      properties: { type: 'reserve', name: 'Santuario de la Naturaleza Yerba Loca' },
      geometry: { type: 'Polygon', coordinates: [[[-70.35, -33.28], [-70.25, -33.28], [-70.25, -33.38], [-70.35, -33.38], [-70.35, -33.28]]] }
    },
  ]
});

export const generateRoadsData = (): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { type: 'highway', name: 'Autopista Central' },
      geometry: { type: 'LineString', coordinates: [[-70.65, -33.30], [-70.65, -33.40], [-70.65, -33.50], [-70.65, -33.60]] }
    },
    {
      type: 'Feature',
      properties: { type: 'highway', name: 'Ruta 5' },
      geometry: { type: 'LineString', coordinates: [[-70.70, -33.00], [-70.68, -33.20], [-70.66, -33.40], [-70.68, -33.60], [-70.70, -33.80]] }
    },
    {
      type: 'Feature',
      properties: { type: 'main', name: 'Costanera Norte' },
      geometry: { type: 'LineString', coordinates: [[-70.78, -33.42], [-70.70, -33.42], [-70.60, -33.42], [-70.50, -33.43]] }
    },
  ]
});
