import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useIsochrone, IsochroneProfile } from '@/hooks/useIsochrone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  ZoomIn, 
  ZoomOut, 
  Locate, 
  Compass, 
  Mountain,
  PenTool,
  Trash2,
  Maximize2,
  Layers,
  Satellite,
  Map as MapIcon,
  RotateCcw,
  Ruler,
  Target
} from 'lucide-react';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Listing, formatPrice, formatArea, getListingTypeLabel } from '@/hooks/useListings';
import { useNavigate } from 'react-router-dom';
import MapInfoLayers, { InfoLayerState, InfoLayerConfig } from './MapInfoLayers';
import { buildWMSTileUrl, getProxiedUrl, WMS_BASE_URLS } from '@/services/chileGIS';
import TouchMapControls from './TouchMapControls';
import GestureFeedback from './GestureFeedback';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTouchGestures } from '@/hooks/useTouchGestures';
import { MapMode } from './MapModeSelector';
import CompactMapControls from './CompactMapControls';
import MapToolsDrawer from './MapToolsDrawer';
import {
  generateDemoZoningData,
  generateRiskZonesData,
  generateInfrastructureData,
  generateWaterBodiesData,
  generateGreenAreasData,
  generateRoadsData,
} from './demoGeoData';

interface EnhancedMapProps {
  listings: Listing[];
  hoveredListing?: Listing | null;
  selectedListing?: Listing | null;
  onListingHover?: (listing: Listing | null) => void;
  onListingClick?: (listing: Listing) => void;
  onPolygonDrawn?: (polygon: number[][], area: number) => void;
  className?: string;
  showDrawTools?: boolean;
}

const statusColors = {
  active: '#10b981',
  reserved: '#f59e0b',
  sold: '#ef4444',
};

const statusLabels = {
  active: 'Disponible',
  reserved: 'Reservado',
  sold: 'Vendido',
};

// Demo data generators moved to ./demoGeoData.ts

// Generate heatmap points from real listing data - price per m²
const generateHeatmapData = (listings: Listing[]): GeoJSON.FeatureCollection => {
  const points: GeoJSON.Feature[] = [];
  
  // Calculate price/m² stats for normalization
  const pricesPerM2 = listings
    .filter(l => l.lat && l.lng && l.area_m2 && l.area_m2 > 0)
    .map(l => l.price / l.area_m2!);
  
  const maxPrice = pricesPerM2.length > 0 ? Math.max(...pricesPerM2) : 100000;
  const minPrice = pricesPerM2.length > 0 ? Math.min(...pricesPerM2) : 0;
  const range = maxPrice - minPrice || 1;

  // Add real listing data points
  listings.forEach(listing => {
    if (listing.lat && listing.lng && listing.area_m2 && listing.area_m2 > 0) {
      const pricePerM2 = listing.price / listing.area_m2;
      const weight = Math.max(0.1, (pricePerM2 - minPrice) / range);
      
      points.push({
        type: 'Feature',
        properties: { 
          weight,
          pricePerM2: Math.round(pricePerM2),
          title: listing.title,
        },
        geometry: {
          type: 'Point',
          coordinates: [listing.lng, listing.lat]
        }
      });

      // Add nearby scatter points for better visualization
      for (let i = 0; i < 3; i++) {
        const jitterLng = listing.lng + (Math.random() - 0.5) * 0.02;
        const jitterLat = listing.lat + (Math.random() - 0.5) * 0.02;
        points.push({
          type: 'Feature',
          properties: { weight: weight * (0.5 + Math.random() * 0.3) },
          geometry: {
            type: 'Point',
            coordinates: [jitterLng, jitterLat]
          }
        });
      }
    }
  });

  return {
    type: 'FeatureCollection',
    features: points
  };
};

const EnhancedMap = ({
  listings,
  hoveredListing,
  selectedListing,
  onListingHover,
  onListingClick,
  onPolygonDrawn,
  className = '',
  showDrawTools = true,
}: EnhancedMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const layerTooltipRef = useRef<mapboxgl.Popup | null>(null);
  const addInfoLayersRef = useRef<() => void>(() => {});
  const setupLayerHoverEventsRef = useRef<() => void>(() => {});
  const showDrawToolsRef = useRef(showDrawTools);
  const initialFitDoneRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnArea, setDrawnArea] = useState<number | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>('3d');
  const mapModeRef = useRef<MapMode>(mapMode);
  const [showClusters, setShowClusters] = useState(true); // Clustering enabled by default for clean UI
  const [showLabels, setShowLabels] = useState(true);
  const [controlsExpanded, setControlsExpanded] = useState(false);
  const [showToolsDrawer, setShowToolsDrawer] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const { token: mapboxToken, loading: tokenLoading, error: tokenError } = useMapboxToken();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Isochrone hook
  const { 
    geojson: isochroneData, 
    center: isochroneCenter, 
    profile: isochroneProfile,
    isLoading: isochroneLoading, 
    fetchIsochrone, 
    clearIsochrone 
  } = useIsochrone();

  // Touch gestures hook for mobile
  const { gestureFeedback } = useTouchGestures(map, mapContainer, {
    enableFeedback: isMobile,
  });

  // Info layers state
  const [infoLayers, setInfoLayers] = useState<InfoLayerState>({
    zoning: false,
    heatmap: false,
    infrastructure: false,
    riskZones: false,
    waterBodies: false,
    greenAreas: false,
    roads: false,
    hydrology: false,
    mining: false,
    biodiversity: false,
    isochrone: false,
  });

  const [layerConfig, setLayerConfig] = useState<InfoLayerConfig>({
    opacity: 0.6,
    heatmapIntensity: 0.8,
    useRealData: false,
  });

  const handleLayerChange = (layer: keyof InfoLayerState, value: boolean) => {
    setInfoLayers(prev => ({ ...prev, [layer]: value }));
  };

  const handleConfigChange = (config: Partial<InfoLayerConfig>) => {
    setLayerConfig(prev => ({ ...prev, ...config }));
  };

  // Calculate center from listings
  const getCenter = useCallback((): [number, number] => {
    if (listings.length === 0) return [-70.6693, -33.4489];
    const validListings = listings.filter((l) => l.lat && l.lng);
    if (validListings.length === 0) return [-70.6693, -33.4489];
    const sumLat = validListings.reduce((acc, l) => acc + (l.lat || 0), 0);
    const sumLng = validListings.reduce((acc, l) => acc + (l.lng || 0), 0);
    return [sumLng / validListings.length, sumLat / validListings.length];
  }, [listings]);

  // Create enhanced popup HTML
  const createPopupHTML = (listing: Listing) => `
    <div class="enhanced-map-popup" style="font-family: system-ui, -apple-system, sans-serif; min-width: 260px;">
      <div style="position: relative; height: 120px; border-radius: 12px 12px 0 0; overflow: hidden;">
        <img 
          src="${listing.images[0] || '/placeholder.svg'}" 
          alt="${listing.title}"
          style="width: 100%; height: 100%; object-fit: cover;"
        />
        <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);"></div>
        <div style="position: absolute; bottom: 8px; left: 8px; right: 8px;">
          <span style="
            font-size: 10px; 
            padding: 3px 8px; 
            border-radius: 20px; 
            background: ${statusColors[listing.status as keyof typeof statusColors] || statusColors.active};
            color: white;
            font-weight: 500;
          ">
            ${statusLabels[listing.status as keyof typeof statusLabels] || 'Disponible'}
          </span>
        </div>
      </div>
      <div style="padding: 12px;">
        <h4 style="font-weight: 600; font-size: 14px; margin-bottom: 6px; color: #1e293b; line-height: 1.3;">
          ${listing.title}
        </h4>
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
          <span style="
            font-size: 10px; 
            padding: 2px 8px; 
            border-radius: 12px; 
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
            color: #0284c7;
            font-weight: 500;
          ">
            ${getListingTypeLabel(listing.type)}
          </span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 12px;">📍</span>
            <span style="font-size: 12px; color: #64748b;">${listing.location}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 12px;">📐</span>
            <span style="font-size: 12px; color: #64748b;">${formatArea(listing.area_m2, listing.area_ha)}</span>
          </div>
        </div>
        <div style="
          padding: 8px;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border-radius: 8px;
          text-align: center;
        ">
          <span style="font-weight: 700; color: #16a34a; font-size: 16px;">
            ${formatPrice(listing.price, listing.currency)}
          </span>
        </div>
      </div>
    </div>
  `;

  // Get color by property type
  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      parcela_rural: '#22c55e',
      campo_agricola: '#84cc16',
      terreno_urbano: '#3b82f6',
      sitio_industrial: '#f59e0b',
      terreno_costero: '#06b6d4',
      terreno_montana: '#8b5cf6',
      inversion: '#ec4899',
    };
    return colors[type] || '#10b981';
  };

  // Create enhanced marker element
  const createMarkerElement = (listing: Listing, isHovered: boolean = false) => {
    const el = document.createElement('div');
    el.className = 'enhanced-map-marker';
    el.setAttribute('data-listing-id', listing.id);

    const color = getTypeColor(listing.type);
    const priceLabel = formatCompactPrice(listing.price);

    // Price-first marker design
    el.style.cssText = `
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      transform: ${isHovered ? 'scale(1.15) translateY(-8px)' : 'scale(1)'};
      z-index: ${isHovered ? 1000 : 1};
      filter: ${isHovered ? 'drop-shadow(0 8px 20px rgba(0,0,0,0.35))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'};
    `;

    el.innerHTML = `
      <div style="
        position: relative;
        background: ${isHovered ? color : 'white'};
        color: ${isHovered ? 'white' : '#1e293b'};
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        font-family: system-ui, -apple-system, sans-serif;
        white-space: nowrap;
        border: 2.5px solid ${color};
        box-shadow: ${isHovered ? `0 0 0 3px ${color}40` : 'none'};
        transition: all 0.2s ease;
      ">
        ${priceLabel}
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 7px solid ${isHovered ? color : color};
        margin-top: -1px;
      "></div>
    `;

    return el;
  };

  // Get emoji for property type
  const getTypeEmoji = (type: string): string => {
    const emojis: Record<string, string> = {
      parcela_rural: '🌳',
      sitio_industrial: '🏭',
      campo_agricola: '🌾',
      terreno_urbano: '🏗️',
      terreno_costero: '🏖️',
      terreno_montana: '⛰️',
      inversion: '💎',
    };
    return emojis[type] || '📍';
  };

  // Format compact price
  const formatCompactPrice = (price: number): string => {
    if (price >= 1000000000) return `${(price / 1000000000).toFixed(1)}B`;
    if (price >= 1000000) return `${(price / 1000000).toFixed(0)}M`;
    if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
    return price.toString();
  };

  // Adjust color brightness
  function adjustColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return `#${(0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)}`;
  }

  // Calculate polygon area in m²
  const calculatePolygonArea = (coordinates: number[][]): number => {
    if (coordinates.length < 3) return 0;
    
    let area = 0;
    const n = coordinates.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const x1 = coordinates[i][0] * 111320 * Math.cos(coordinates[i][1] * Math.PI / 180);
      const y1 = coordinates[i][1] * 110540;
      const x2 = coordinates[j][0] * 111320 * Math.cos(coordinates[j][1] * Math.PI / 180);
      const y2 = coordinates[j][1] * 110540;
      
      area += x1 * y2 - x2 * y1;
    }
    
    return Math.abs(area / 2);
  };

  // Generate tooltip HTML for different layer types
  const generateLayerTooltipHTML = (
    layerType: string,
    properties: Record<string, unknown>
  ): string => {
    const baseStyle = `
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
      backdrop-filter: blur(12px);
      border-radius: 12px;
      padding: 12px 16px;
      color: white;
      min-width: 200px;
      max-width: 280px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1);
    `;

    const headerStyle = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    `;

    const labelStyle = `
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: rgba(255,255,255,0.6);
      margin-bottom: 2px;
    `;

    const valueStyle = `
      font-size: 13px;
      font-weight: 500;
      color: white;
    `;

    const badgeStyle = (color: string) => `
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 500;
      background: ${color}20;
      color: ${color};
      border: 1px solid ${color}40;
    `;

    switch (layerType) {
      case 'zoning': {
        const zoningLabels: Record<string, { label: string; icon: string; color: string; description: string }> = {
          residential: { label: 'Zona Residencial', icon: '🏠', color: '#22c55e', description: 'Uso habitacional permitido' },
          commercial: { label: 'Zona Comercial', icon: '🏪', color: '#3b82f6', description: 'Comercio y servicios' },
          industrial: { label: 'Zona Industrial', icon: '🏭', color: '#f59e0b', description: 'Actividad industrial' },
          agricultural: { label: 'Zona Agrícola', icon: '🌾', color: '#84cc16', description: 'Uso agrícola y rural' },
          mixed: { label: 'Zona Mixta', icon: '🏗️', color: '#8b5cf6', description: 'Uso mixto permitido' },
          protected: { label: 'Zona Protegida', icon: '🛡️', color: '#ef4444', description: 'Área de conservación' },
        };
        const type = properties.type as string || 'mixed';
        const info = zoningLabels[type] || zoningLabels.mixed;
        const name = properties.name as string || 'Zona sin nombre';
        
        return `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <span style="font-size: 20px;">${info.icon}</span>
              <div>
                <div style="font-size: 14px; font-weight: 600;">${info.label}</div>
                <div style="font-size: 11px; color: rgba(255,255,255,0.6);">Zonificación Urbana</div>
              </div>
            </div>
            <div style="margin-bottom: 8px;">
              <div style="${labelStyle}">Nombre del Sector</div>
              <div style="${valueStyle}">${name}</div>
            </div>
            <div style="margin-bottom: 8px;">
              <div style="${labelStyle}">Uso Permitido</div>
              <div style="${valueStyle}">${info.description}</div>
            </div>
            <div style="${badgeStyle(info.color)}">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${info.color};"></span>
              ${info.label}
            </div>
          </div>
        `;
      }

      case 'risk': {
        const riskLabels: Record<string, { label: string; icon: string; color: string; description: string; recommendation: string }> = {
          flood: { label: 'Riesgo de Inundación', icon: '🌊', color: '#0ea5e9', description: 'Zona susceptible a inundaciones', recommendation: 'Verificar historial de anegamientos' },
          landslide: { label: 'Riesgo de Remoción', icon: '⛰️', color: '#f59e0b', description: 'Riesgo de deslizamiento de tierra', recommendation: 'Evaluar estabilidad del terreno' },
          seismic: { label: 'Zona Sísmica', icon: '📈', color: '#ef4444', description: 'Actividad sísmica elevada', recommendation: 'Construcción antisísmica requerida' },
          tsunami: { label: 'Riesgo de Tsunami', icon: '🌊', color: '#6366f1', description: 'Zona de riesgo por maremoto', recommendation: 'Revisar rutas de evacuación' },
        };
        const type = properties.type as string || 'seismic';
        const info = riskLabels[type] || riskLabels.seismic;
        const risk = properties.risk as string || 'medium';
        const name = properties.name as string || 'Zona de riesgo';
        const riskLevels: Record<string, { label: string; color: string }> = {
          high: { label: 'Alto', color: '#ef4444' },
          medium: { label: 'Medio', color: '#f59e0b' },
          low: { label: 'Bajo', color: '#22c55e' },
        };
        const riskInfo = riskLevels[risk] || riskLevels.medium;
        
        return `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <span style="font-size: 20px;">${info.icon}</span>
              <div>
                <div style="font-size: 14px; font-weight: 600;">${info.label}</div>
                <div style="font-size: 11px; color: rgba(255,255,255,0.6);">Análisis de Riesgo</div>
              </div>
            </div>
            <div style="margin-bottom: 8px;">
              <div style="${labelStyle}">Zona</div>
              <div style="${valueStyle}">${name}</div>
            </div>
            <div style="margin-bottom: 8px;">
              <div style="${labelStyle}">Nivel de Riesgo</div>
              <div style="${badgeStyle(riskInfo.color)}">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: ${riskInfo.color};"></span>
                ${riskInfo.label}
              </div>
            </div>
            <div style="margin-bottom: 8px;">
              <div style="${labelStyle}">Descripción</div>
              <div style="${valueStyle}">${info.description}</div>
            </div>
            <div style="padding: 8px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-top: 8px;">
              <div style="font-size: 10px; color: #f59e0b; margin-bottom: 4px;">⚠️ Recomendación</div>
              <div style="font-size: 12px; color: rgba(255,255,255,0.8);">${info.recommendation}</div>
            </div>
          </div>
        `;
      }

      case 'infrastructure': {
        const coverage = properties.coverage as string || 'partial';
        const services = (properties.services as string[]) || ['electricity'];
        const coverageInfo: Record<string, { label: string; color: string; icon: string }> = {
          full: { label: 'Cobertura Completa', color: '#22c55e', icon: '✅' },
          partial: { label: 'Cobertura Parcial', color: '#f59e0b', icon: '⚡' },
          limited: { label: 'Cobertura Limitada', color: '#ef4444', icon: '⚠️' },
        };
        const info = coverageInfo[coverage] || coverageInfo.partial;
        const serviceLabels: Record<string, { label: string; icon: string }> = {
          water: { label: 'Agua Potable', icon: '💧' },
          electricity: { label: 'Electricidad', icon: '⚡' },
          sewage: { label: 'Alcantarillado', icon: '🚰' },
          gas: { label: 'Gas Natural', icon: '🔥' },
        };
        
        return `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <span style="font-size: 20px;">${info.icon}</span>
              <div>
                <div style="font-size: 14px; font-weight: 600;">${info.label}</div>
                <div style="font-size: 11px; color: rgba(255,255,255,0.6);">Servicios Básicos</div>
              </div>
            </div>
            <div style="margin-bottom: 8px;">
              <div style="${labelStyle}">Servicios Disponibles</div>
              <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
                ${services.map(s => {
                  const svc = serviceLabels[s] || { label: s, icon: '📍' };
                  return `<div style="${badgeStyle('#22c55e')}">${svc.icon} ${svc.label}</div>`;
                }).join('')}
              </div>
            </div>
            <div style="${badgeStyle(info.color)}">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${info.color};"></span>
              ${info.label}
            </div>
          </div>
        `;
      }

      case 'water': {
        const type = properties.type as string || 'river';
        const name = properties.name as string || 'Cuerpo de agua';
        const waterInfo: Record<string, { label: string; icon: string }> = {
          river: { label: 'Río', icon: '🏞️' },
          lake: { label: 'Lago', icon: '🌊' },
          wetland: { label: 'Humedal', icon: '🌿' },
        };
        const info = waterInfo[type] || waterInfo.river;
        
        return `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <span style="font-size: 20px;">${info.icon}</span>
              <div>
                <div style="font-size: 14px; font-weight: 600;">${name}</div>
                <div style="font-size: 11px; color: rgba(255,255,255,0.6);">${info.label}</div>
              </div>
            </div>
            <div style="${badgeStyle('#0ea5e9')}">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #0ea5e9;"></span>
              Cuerpo de Agua
            </div>
          </div>
        `;
      }

      case 'green': {
        const type = properties.type as string || 'park';
        const name = properties.name as string || 'Área verde';
        const greenInfo: Record<string, { label: string; icon: string; description: string }> = {
          park: { label: 'Parque', icon: '🌳', description: 'Espacio público de recreación' },
          reserve: { label: 'Reserva Natural', icon: '🦜', description: 'Área de conservación ecológica' },
          forest: { label: 'Bosque', icon: '🌲', description: 'Zona forestal' },
        };
        const info = greenInfo[type] || greenInfo.park;
        
        return `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <span style="font-size: 20px;">${info.icon}</span>
              <div>
                <div style="font-size: 14px; font-weight: 600;">${name}</div>
                <div style="font-size: 11px; color: rgba(255,255,255,0.6);">${info.label}</div>
              </div>
            </div>
            <div style="margin-bottom: 8px;">
              <div style="${labelStyle}">Descripción</div>
              <div style="${valueStyle}">${info.description}</div>
            </div>
            <div style="${badgeStyle('#22c55e')}">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></span>
              Área Verde
            </div>
          </div>
        `;
      }

      case 'road': {
        const type = properties.type as string || 'main';
        const name = properties.name as string || 'Vía sin nombre';
        const roadInfo: Record<string, { label: string; icon: string }> = {
          highway: { label: 'Autopista', icon: '🛣️' },
          main: { label: 'Vía Principal', icon: '🚗' },
          secondary: { label: 'Vía Secundaria', icon: '🚙' },
        };
        const info = roadInfo[type] || roadInfo.main;
        
        return `
          <div style="${baseStyle}">
            <div style="${headerStyle}">
              <span style="font-size: 20px;">${info.icon}</span>
              <div>
                <div style="font-size: 14px; font-weight: 600;">${name}</div>
                <div style="font-size: 11px; color: rgba(255,255,255,0.6);">${info.label}</div>
              </div>
            </div>
            <div style="${badgeStyle('#64748b')}">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #64748b;"></span>
              Red Vial
            </div>
          </div>
        `;
      }

      default:
        return '';
    }
  };

  // Setup layer hover events
  const setupLayerHoverEvents = useCallback(() => {
    if (!map.current || !layerTooltipRef.current) return;

    const layerEventMap: { layerId: string; type: string }[] = [
      { layerId: 'zoning-layer', type: 'zoning' },
      { layerId: 'risk-layer', type: 'risk' },
      { layerId: 'infrastructure-layer', type: 'infrastructure' },
      { layerId: 'water-areas', type: 'water' },
      { layerId: 'water-lines', type: 'water' },
      { layerId: 'green-layer', type: 'green' },
      { layerId: 'roads-layer', type: 'road' },
    ];

    layerEventMap.forEach(({ layerId, type }) => {
      // Mouse enter - show tooltip
      map.current?.on('mouseenter', layerId, (e) => {
        if (!map.current || !e.features?.length) return;
        
        map.current.getCanvas().style.cursor = 'pointer';
        
        const properties = e.features[0].properties || {};
        const html = generateLayerTooltipHTML(type, properties);
        
        if (html && layerTooltipRef.current) {
          layerTooltipRef.current
            .setLngLat(e.lngLat)
            .setHTML(html)
            .addTo(map.current);
        }
      });

      // Mouse move - update tooltip position
      map.current?.on('mousemove', layerId, (e) => {
        if (!layerTooltipRef.current || !e.features?.length) return;
        layerTooltipRef.current.setLngLat(e.lngLat);
      });

      // Mouse leave - hide tooltip
      map.current?.on('mouseleave', layerId, () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = '';
        layerTooltipRef.current?.remove();
      });
    });
  }, []);

  // Get map style URL
  const getMapStyle = useCallback(() => {
    switch (mapMode) {
      case 'satellite':
        return 'mapbox://styles/mapbox/satellite-streets-v12';
      case '3d':
        return 'mapbox://styles/mapbox/outdoors-v12';
      default:
        return 'mapbox://styles/mapbox/light-v11';
    }
  }, [mapMode]);

  // Add info layers to map
  const addInfoLayers = useCallback(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const zoningColors: Record<string, string> = {
      residential: '#22c55e',
      commercial: '#3b82f6',
      industrial: '#f59e0b',
      agricultural: '#84cc16',
      mixed: '#8b5cf6',
      protected: '#ef4444',
    };

    const riskColors: Record<string, string> = {
      flood: '#0ea5e9',
      landslide: '#f59e0b',
      seismic: '#ef4444',
      tsunami: '#6366f1',
    };

    const infrastructureColors: Record<string, string> = {
      full: '#22c55e',
      partial: '#f59e0b',
      limited: '#ef4444',
    };

    // Add sources if not exists
    if (!map.current.getSource('zoning-source')) {
      map.current.addSource('zoning-source', {
        type: 'geojson',
        data: generateDemoZoningData()
      });
    }

    if (!map.current.getSource('risk-source')) {
      map.current.addSource('risk-source', {
        type: 'geojson',
        data: generateRiskZonesData()
      });
    }

    if (!map.current.getSource('infrastructure-source')) {
      map.current.addSource('infrastructure-source', {
        type: 'geojson',
        data: generateInfrastructureData()
      });
    }

    if (!map.current.getSource('water-source')) {
      map.current.addSource('water-source', {
        type: 'geojson',
        data: generateWaterBodiesData()
      });
    }

    if (!map.current.getSource('green-source')) {
      map.current.addSource('green-source', {
        type: 'geojson',
        data: generateGreenAreasData()
      });
    }

    if (!map.current.getSource('roads-source')) {
      map.current.addSource('roads-source', {
        type: 'geojson',
        data: generateRoadsData()
      });
    }

    if (!map.current.getSource('heatmap-source')) {
      map.current.addSource('heatmap-source', {
        type: 'geojson',
        data: generateHeatmapData(listings)
      });
    }

    // Add zoning layer
    if (!map.current.getLayer('zoning-layer')) {
      map.current.addLayer({
        id: 'zoning-layer',
        type: 'fill',
        source: 'zoning-source',
        paint: {
          'fill-color': [
            'match',
            ['get', 'type'],
            'residential', zoningColors.residential,
            'commercial', zoningColors.commercial,
            'industrial', zoningColors.industrial,
            'agricultural', zoningColors.agricultural,
            'mixed', zoningColors.mixed,
            'protected', zoningColors.protected,
            '#888888'
          ],
          'fill-opacity': layerConfig.opacity * 0.5
        },
        layout: {
          visibility: infoLayers.zoning ? 'visible' : 'none'
        }
      });

      map.current.addLayer({
        id: 'zoning-outline',
        type: 'line',
        source: 'zoning-source',
        paint: {
          'line-color': [
            'match',
            ['get', 'type'],
            'residential', zoningColors.residential,
            'commercial', zoningColors.commercial,
            'industrial', zoningColors.industrial,
            'agricultural', zoningColors.agricultural,
            'mixed', zoningColors.mixed,
            'protected', zoningColors.protected,
            '#888888'
          ],
          'line-width': 2,
          'line-opacity': layerConfig.opacity
        },
        layout: {
          visibility: infoLayers.zoning ? 'visible' : 'none'
        }
      });
    }

    // Add risk zones layer
    if (!map.current.getLayer('risk-layer')) {
      map.current.addLayer({
        id: 'risk-layer',
        type: 'fill',
        source: 'risk-source',
        paint: {
          'fill-color': [
            'match',
            ['get', 'type'],
            'flood', riskColors.flood,
            'landslide', riskColors.landslide,
            'seismic', riskColors.seismic,
            'tsunami', riskColors.tsunami,
            '#888888'
          ],
          'fill-opacity': layerConfig.opacity * 0.4,
          'fill-pattern': ['literal', '']
        },
        layout: {
          visibility: infoLayers.riskZones ? 'visible' : 'none'
        }
      });

      map.current.addLayer({
        id: 'risk-outline',
        type: 'line',
        source: 'risk-source',
        paint: {
          'line-color': [
            'match',
            ['get', 'type'],
            'flood', riskColors.flood,
            'landslide', riskColors.landslide,
            'seismic', riskColors.seismic,
            'tsunami', riskColors.tsunami,
            '#888888'
          ],
          'line-width': 2,
          'line-dasharray': [2, 2],
          'line-opacity': layerConfig.opacity
        },
        layout: {
          visibility: infoLayers.riskZones ? 'visible' : 'none'
        }
      });
    }

    // Add infrastructure layer
    if (!map.current.getLayer('infrastructure-layer')) {
      map.current.addLayer({
        id: 'infrastructure-layer',
        type: 'fill',
        source: 'infrastructure-source',
        paint: {
          'fill-color': [
            'match',
            ['get', 'coverage'],
            'full', infrastructureColors.full,
            'partial', infrastructureColors.partial,
            'limited', infrastructureColors.limited,
            '#888888'
          ],
          'fill-opacity': layerConfig.opacity * 0.3
        },
        layout: {
          visibility: infoLayers.infrastructure ? 'visible' : 'none'
        }
      });
    }

    // Add water bodies layer
    if (!map.current.getLayer('water-lines')) {
      map.current.addLayer({
        id: 'water-lines',
        type: 'line',
        source: 'water-source',
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: {
          'line-color': '#0ea5e9',
          'line-width': 3,
          'line-opacity': layerConfig.opacity
        },
        layout: {
          visibility: infoLayers.waterBodies ? 'visible' : 'none'
        }
      });

      map.current.addLayer({
        id: 'water-areas',
        type: 'fill',
        source: 'water-source',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'fill-color': '#0ea5e9',
          'fill-opacity': layerConfig.opacity * 0.5
        },
        layout: {
          visibility: infoLayers.waterBodies ? 'visible' : 'none'
        }
      });
    }

    // Add green areas layer
    if (!map.current.getLayer('green-layer')) {
      map.current.addLayer({
        id: 'green-layer',
        type: 'fill',
        source: 'green-source',
        paint: {
          'fill-color': '#22c55e',
          'fill-opacity': layerConfig.opacity * 0.4
        },
        layout: {
          visibility: infoLayers.greenAreas ? 'visible' : 'none'
        }
      });
    }

    // Add roads layer
    if (!map.current.getLayer('roads-layer')) {
      map.current.addLayer({
        id: 'roads-layer',
        type: 'line',
        source: 'roads-source',
        paint: {
          'line-color': [
            'match',
            ['get', 'type'],
            'highway', '#64748b',
            'main', '#94a3b8',
            '#cbd5e1'
          ],
          'line-width': [
            'match',
            ['get', 'type'],
            'highway', 4,
            'main', 2,
            1
          ],
          'line-opacity': layerConfig.opacity
        },
        layout: {
          visibility: infoLayers.roads ? 'visible' : 'none'
        }
      });
    }

    // Add heatmap layer
    if (!map.current.getLayer('heatmap-layer')) {
      map.current.addLayer({
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'heatmap-source',
        paint: {
          'heatmap-weight': ['get', 'weight'],
          'heatmap-intensity': layerConfig.heatmapIntensity,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 255, 0)',
            0.2, 'rgb(0, 255, 255)',
            0.4, 'rgb(0, 255, 0)',
            0.6, 'rgb(255, 255, 0)',
            0.8, 'rgb(255, 165, 0)',
            1, 'rgb(255, 0, 0)'
          ],
          'heatmap-radius': 30,
          'heatmap-opacity': layerConfig.opacity
        },
        layout: {
          visibility: infoLayers.heatmap ? 'visible' : 'none'
        }
      });
    }
  }, [infoLayers, layerConfig, listings]);

  // Add real WMS layers from Chilean GIS services
  const addRealWMSLayers = useCallback(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    // WMS sources configuration for Chilean public data
    const wmsSources = [
      // Existing sources
      {
        id: 'wms-zonificacion',
        url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.minvu), 'prms_zonificacion'),
        attribution: '© MINVU',
      },
      {
        id: 'wms-riesgo-volcanico',
        url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.sernageomin), 'amenaza_volcanica'),
        attribution: '© SERNAGEOMIN',
      },
      {
        id: 'wms-riesgo-tsunami',
        url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.shoa), 'cartas_inundacion'),
        attribution: '© SHOA',
      },
      {
        id: 'wms-areas-protegidas',
        url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.conaf), 'snaspe'),
        attribution: '© CONAF',
      },
      {
        id: 'wms-red-vial',
        url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.mop), 'red_vial'),
        attribution: '© MOP',
      },
      // Hydrology sources (DGA)
      {
        id: 'wms-hidrografia',
        url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.dga), 'red_hidrografica'),
        attribution: '© DGA',
      },
      {
        id: 'wms-cuencas',
        url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.dga), 'cuencas'),
        attribution: '© DGA',
      },
      // Mining sources (SERNAGEOMIN)
      {
        id: 'wms-catastro-minero',
        url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.sernageomin), 'catastro_minero'),
        attribution: '© SERNAGEOMIN',
      },
      {
        id: 'wms-faenas-mineras',
        url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.sernageomin), 'faenas_mineras'),
        attribution: '© SERNAGEOMIN',
      },
      // Biodiversity sources (MMA)
      {
        id: 'wms-ecosistemas',
        url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.mma), 'ecosistemas_terrestres'),
        attribution: '© MMA',
      },
      {
        id: 'wms-especies-amenazadas',
        url: buildWMSTileUrl(getProxiedUrl(WMS_BASE_URLS.mma), 'especies_amenazadas'),
        attribution: '© MMA',
      },
    ];

    // Add WMS sources
    wmsSources.forEach(({ id, url, attribution }) => {
      if (!map.current?.getSource(id)) {
        map.current?.addSource(id, {
          type: 'raster',
          tiles: [url],
          tileSize: 256,
          attribution,
        });
      }
    });

    // Add WMS layers (raster type)
    const wmsLayers = [
      // Original layers
      { id: 'wms-layer-zonificacion', source: 'wms-zonificacion', forLayer: 'zoning' },
      { id: 'wms-layer-riesgo', source: 'wms-riesgo-volcanico', forLayer: 'riskZones' },
      { id: 'wms-layer-areas-protegidas', source: 'wms-areas-protegidas', forLayer: 'greenAreas' },
      { id: 'wms-layer-red-vial', source: 'wms-red-vial', forLayer: 'roads' },
      // Hydrology layers
      { id: 'wms-layer-hidrografia', source: 'wms-hidrografia', forLayer: 'hydrology' },
      { id: 'wms-layer-cuencas', source: 'wms-cuencas', forLayer: 'hydrology' },
      // Mining layers
      { id: 'wms-layer-catastro-minero', source: 'wms-catastro-minero', forLayer: 'mining' },
      { id: 'wms-layer-faenas-mineras', source: 'wms-faenas-mineras', forLayer: 'mining' },
      // Biodiversity layers
      { id: 'wms-layer-ecosistemas', source: 'wms-ecosistemas', forLayer: 'biodiversity' },
      { id: 'wms-layer-especies-amenazadas', source: 'wms-especies-amenazadas', forLayer: 'biodiversity' },
    ];

    wmsLayers.forEach(({ id, source, forLayer }) => {
      if (!map.current?.getLayer(id)) {
        map.current?.addLayer({
          id,
          type: 'raster',
          source,
          paint: {
            'raster-opacity': layerConfig.opacity,
          },
          layout: {
            visibility: infoLayers[forLayer as keyof InfoLayerState] && layerConfig.useRealData 
              ? 'visible' 
              : 'none',
          },
        });
      }
    });
  }, [infoLayers, layerConfig]);

  // Toggle between demo and real data layers
  useEffect(() => {
    if (!map.current || isLoading || !map.current.isStyleLoaded()) return;

    // Demo layer IDs
    const demoLayers = [
      'zoning-layer', 'zoning-outline',
      'risk-layer', 'risk-outline',
      'infrastructure-layer',
      'water-lines', 'water-areas',
      'green-layer',
      'roads-layer',
    ];

    // WMS layer IDs
    const wmsLayers = [
      'wms-layer-zonificacion',
      'wms-layer-riesgo',
      'wms-layer-areas-protegidas',
      'wms-layer-red-vial',
      'wms-layer-hidrografia',
      'wms-layer-cuencas',
      'wms-layer-catastro-minero',
      'wms-layer-faenas-mineras',
      'wms-layer-ecosistemas',
      'wms-layer-especies-amenazadas',
    ];

    // Show/hide based on useRealData setting
    if (layerConfig.useRealData) {
      // Add WMS layers if not present
      addRealWMSLayers();

      // Hide demo layers
      demoLayers.forEach(layerId => {
        if (map.current?.getLayer(layerId)) {
          map.current.setLayoutProperty(layerId, 'visibility', 'none');
        }
      });

      // Show active WMS layers
      const wmsLayerMappings: Record<string, keyof InfoLayerState> = {
        'wms-layer-zonificacion': 'zoning',
        'wms-layer-riesgo': 'riskZones',
        'wms-layer-areas-protegidas': 'greenAreas',
        'wms-layer-red-vial': 'roads',
        'wms-layer-hidrografia': 'hydrology',
        'wms-layer-cuencas': 'hydrology',
        'wms-layer-catastro-minero': 'mining',
        'wms-layer-faenas-mineras': 'mining',
        'wms-layer-ecosistemas': 'biodiversity',
        'wms-layer-especies-amenazadas': 'biodiversity',
      };

      Object.entries(wmsLayerMappings).forEach(([layerId, stateKey]) => {
        if (map.current?.getLayer(layerId)) {
          const isVisible = infoLayers[stateKey];
          map.current.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
          if (isVisible) {
            map.current.setPaintProperty(layerId, 'raster-opacity', layerConfig.opacity);
          }
        }
      });
    } else {
      // Hide WMS layers
      wmsLayers.forEach(layerId => {
        if (map.current?.getLayer(layerId)) {
          map.current.setLayoutProperty(layerId, 'visibility', 'none');
        }
      });

      // Show active demo layers
      const layerMappings: Record<keyof InfoLayerState, string[]> = {
        zoning: ['zoning-layer', 'zoning-outline'],
        riskZones: ['risk-layer', 'risk-outline'],
        infrastructure: ['infrastructure-layer'],
        waterBodies: ['water-lines', 'water-areas'],
        greenAreas: ['green-layer'],
        roads: ['roads-layer'],
        heatmap: ['heatmap-layer'],
        hydrology: [],
        mining: [],
        biodiversity: [],
        isochrone: ['isochrone-fill', 'isochrone-outline'],
      };

      Object.entries(layerMappings).forEach(([key, layers]) => {
        const isVisible = infoLayers[key as keyof InfoLayerState];
        layers.forEach(layerId => {
          if (map.current?.getLayer(layerId)) {
            map.current.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
          }
        });
      });
    }
  }, [layerConfig.useRealData, infoLayers, layerConfig.opacity, isLoading, addRealWMSLayers]);

  // Update layer visibility
  useEffect(() => {
    if (!map.current || isLoading || !map.current.isStyleLoaded()) return;

    // Skip if useRealData is true - handled by the toggle effect above
    if (layerConfig.useRealData) return;

    const layerMappings: Record<keyof InfoLayerState, string[]> = {
      zoning: ['zoning-layer', 'zoning-outline'],
      riskZones: ['risk-layer', 'risk-outline'],
      infrastructure: ['infrastructure-layer'],
      waterBodies: ['water-lines', 'water-areas'],
      greenAreas: ['green-layer'],
      roads: ['roads-layer'],
      heatmap: ['heatmap-layer'],
      hydrology: [],
      mining: [],
      biodiversity: [],
      isochrone: ['isochrone-fill', 'isochrone-outline'],
    };

    Object.entries(layerMappings).forEach(([key, layers]) => {
      const isVisible = infoLayers[key as keyof InfoLayerState];
      layers.forEach(layerId => {
        if (map.current?.getLayer(layerId)) {
          map.current.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
        }
      });
    });
  }, [infoLayers, isLoading, layerConfig.useRealData]);

  // Update layer opacity
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
      if (map.current?.getLayer(id)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.current.setPaintProperty(id, prop as any, layerConfig.opacity * base);
      }
    });

    if (map.current?.getLayer('heatmap-layer')) {
      map.current.setPaintProperty('heatmap-layer', 'heatmap-intensity', layerConfig.heatmapIntensity);
    }
  }, [layerConfig, isLoading]);

  // Keep refs in sync with latest callbacks
  useEffect(() => { addInfoLayersRef.current = addInfoLayers; }, [addInfoLayers]);
  useEffect(() => { setupLayerHoverEventsRef.current = setupLayerHoverEvents; }, [setupLayerHoverEvents]);
  useEffect(() => { showDrawToolsRef.current = showDrawTools; });
  useEffect(() => { mapModeRef.current = mapMode; }, [mapMode]);

  // Initialize map - ONLY depends on token availability
  useEffect(() => {
    if (!mapContainer.current || tokenLoading || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const currentMode = mapModeRef.current;
    const styleUrl = currentMode === 'satellite'
      ? 'mapbox://styles/mapbox/satellite-streets-v12'
      : currentMode === '3d'
      ? 'mapbox://styles/mapbox/outdoors-v12'
      : 'mapbox://styles/mapbox/light-v11';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [-70.6693, -33.4489],
      zoom: 6,
      pitch: currentMode === '3d' ? 50 : 0,
      bearing: currentMode === '3d' ? -17 : 0,
      antialias: true,
    });

    popupRef.current = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: 30,
      maxWidth: '300px',
      className: 'enhanced-map-popup-container',
    });

    layerTooltipRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 15,
      maxWidth: '320px',
      className: 'layer-tooltip-popup',
    });

    if (showDrawToolsRef.current) {
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {},
        defaultMode: 'simple_select',
        styles: [
          {
            id: 'gl-draw-polygon-fill',
            type: 'fill',
            filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            paint: { 'fill-color': '#10b981', 'fill-opacity': 0.2 },
          },
          {
            id: 'gl-draw-polygon-stroke',
            type: 'line',
            filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            paint: { 'line-color': '#10b981', 'line-width': 3, 'line-dasharray': [2, 2] },
          },
          {
            id: 'gl-draw-point',
            type: 'circle',
            filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
            paint: { 'circle-radius': 6, 'circle-color': '#10b981', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
          },
        ],
      });
      map.current.addControl(draw.current);
    }

    map.current.on('load', () => {
      if (currentMode === '3d' && map.current) {
        map.current.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
        map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
        map.current.addLayer({
          id: 'sky',
          type: 'sky',
          paint: { 'sky-type': 'atmosphere', 'sky-atmosphere-sun': [0, 75], 'sky-atmosphere-sun-intensity': 15 },
        });
      }

      addInfoLayersRef.current();
      setupLayerHoverEventsRef.current();

      setTimeout(() => { map.current?.resize(); }, 100);
      setIsLoading(false);
    });

    if (showDrawToolsRef.current) {
      map.current.on('draw.create', (e: { features: GeoJSON.Feature[] }) => {
        const polygon = e.features[0];
        if (polygon.geometry.type === 'Polygon') {
          const coords = (polygon.geometry as GeoJSON.Polygon).coordinates[0];
          const area = calculatePolygonArea(coords as number[][]);
          setDrawnArea(area);
          onPolygonDrawn?.(coords as number[][], area);
        }
      });

      map.current.on('draw.update', (e: { features: GeoJSON.Feature[] }) => {
        const polygon = e.features[0];
        if (polygon.geometry.type === 'Polygon') {
          const coords = (polygon.geometry as GeoJSON.Polygon).coordinates[0];
          const area = calculatePolygonArea(coords as number[][]);
          setDrawnArea(area);
          onPolygonDrawn?.(coords as number[][], area);
        }
      });

      map.current.on('draw.delete', () => {
        setDrawnArea(null);
        setIsDrawing(false);
      });
    }

    return () => {
      Object.values(markersRef.current).forEach((marker) => marker.remove());
      markersRef.current = {};
      popupRef.current?.remove();
      layerTooltipRef.current?.remove();

      if (draw.current && map.current) {
        try { map.current.removeControl(draw.current); } catch (e) { /* ignore */ }
        draw.current = null;
      }

      if (map.current) {
        try { map.current.remove(); } catch (e) { /* ignore */ }
        map.current = null;
      }
    };
  }, [mapboxToken, tokenLoading]);

  // Update markers when listings change (only when not using clusters)
  useEffect(() => {
    if (!map.current || isLoading || showClusters) return;

    const currentListingIds = new Set(listings.map((l) => l.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentListingIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    listings.forEach((listing) => {
      if (!listing.lat || !listing.lng) return;

      const isHovered = hoveredListing?.id === listing.id;

      if (markersRef.current[listing.id]) {
        const existingEl = markersRef.current[listing.id].getElement();
        const newEl = createMarkerElement(listing, isHovered);
        existingEl.replaceWith(newEl);
        attachMarkerEvents(newEl, listing);
        return;
      }

      const el = createMarkerElement(listing, isHovered);
      attachMarkerEvents(el, listing);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([listing.lng, listing.lat])
        .addTo(map.current!);

      markersRef.current[listing.id] = marker;
    });

    // Fit bounds only on initial load
    if (!initialFitDoneRef.current && listings.length > 0) {
      const validListings = listings.filter((l) => l.lat && l.lng);
      if (validListings.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        validListings.forEach((l) => bounds.extend([l.lng!, l.lat!]));
        map.current.fitBounds(bounds, { padding: 80, maxZoom: 10 });
        initialFitDoneRef.current = true;
      }
    }
  }, [listings, isLoading, hoveredListing, showClusters]);

  // Setup and update cluster source when listings change
  useEffect(() => {
    if (!map.current || isLoading || !showClusters) return;
    
    // Wait for style to be loaded
    const setupClusters = () => {
      if (!map.current?.isStyleLoaded()) return;
      
      const validListings = listings.filter(l => l.lat && l.lng);
      const geoJsonData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: validListings.map(l => ({
          type: 'Feature' as const,
          properties: { id: l.id, price: l.price, status: l.status, type: l.type },
          geometry: { type: 'Point' as const, coordinates: [l.lng!, l.lat!] },
        })),
      };
      
      // Update existing source or create new one
      const existingSource = map.current?.getSource('listings-cluster') as mapboxgl.GeoJSONSource;
      if (existingSource) {
        existingSource.setData(geoJsonData);
      } else if (validListings.length > 0) {
        // Add new source
        map.current?.addSource('listings-cluster', {
          type: 'geojson',
          data: geoJsonData,
          cluster: true,
          clusterMaxZoom: 12,
          clusterRadius: 60,
        });

        // Cluster circles
        map.current?.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'listings-cluster',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#10b981',
              5,
              '#f59e0b',
              10,
              '#ef4444',
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              20,
              5,
              30,
              10,
              40,
            ],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
          },
        });

        // Cluster count
        map.current?.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'listings-cluster',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 14,
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        // Unclustered individual points
        map.current?.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'listings-cluster',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#10b981',
            'circle-radius': 8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });

        // Click on cluster to zoom
        map.current?.on('click', 'clusters', (e) => {
          if (!e.features?.length) return;
          
          const clusterId = e.features[0].properties?.cluster_id;
          const source = map.current?.getSource('listings-cluster') as mapboxgl.GeoJSONSource;
          
          source?.getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err || !e.features?.length) return;
            const geometry = e.features[0].geometry as GeoJSON.Point;
            map.current?.easeTo({
              center: geometry.coordinates as [number, number],
              zoom: zoom || 10,
            });
          });
        });

        // Click on unclustered point to show popup
        map.current?.on('click', 'unclustered-point', (e) => {
          if (!e.features?.length) return;
          const props = e.features[0].properties;
          if (!props?.id) return;
          const listing = listings.find(l => l.id === props.id);
          if (listing) {
            onListingClick?.(listing);
          }
        });

        // Change cursor on cluster/point hover
        map.current?.on('mouseenter', 'clusters', () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current?.on('mouseleave', 'clusters', () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });
        map.current?.on('mouseenter', 'unclustered-point', () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        map.current?.on('mouseleave', 'unclustered-point', () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });
      }
      
      // Fit bounds only on initial load
      if (!initialFitDoneRef.current && validListings.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        validListings.forEach((l) => bounds.extend([l.lng!, l.lat!]));
        map.current?.fitBounds(bounds, { padding: 80, maxZoom: 10 });
        initialFitDoneRef.current = true;
      }
    };
    
    // If style is already loaded, setup immediately
    if (map.current?.isStyleLoaded()) {
      setupClusters();
    } else {
      // Wait for style load
      map.current?.once('style.load', setupClusters);
    }
  }, [listings, isLoading, showClusters]);

  const attachMarkerEvents = (el: HTMLElement, listing: Listing) => {
    el.addEventListener('mouseenter', () => {
      onListingHover?.(listing);
      el.style.transform = 'scale(1.15) translateY(-10px)';
      el.style.zIndex = '1000';
      popupRef.current
        ?.setLngLat([listing.lng!, listing.lat!])
        .setHTML(createPopupHTML(listing))
        .addTo(map.current!);
    });

    el.addEventListener('mouseleave', () => {
      onListingHover?.(null);
      el.style.transform = 'scale(1)';
      el.style.zIndex = '1';
      popupRef.current?.remove();
    });

    el.addEventListener('click', () => {
      // If isochrone mode is active, fetch isochrone for this listing
      if (infoLayers.isochrone && listing.lat && listing.lng) {
        fetchIsochrone(listing.lng, listing.lat);
      }
      
      if (onListingClick) {
        onListingClick(listing);
      } else {
        navigate(`/propiedad/${listing.id}`);
      }
    });
  };

  // Highlight hovered listing - NO camera movement, only visual highlight + popup
  useEffect(() => {
    if (!map.current || isLoading) return;
    if (!map.current.isStyleLoaded()) return;

    // Handle marker-based hover sync (no clusters)
    if (!showClusters) {
      Object.entries(markersRef.current).forEach(([id, marker]) => {
        const el = marker.getElement();
        const listing = listings.find((l) => l.id === id);
        if (!listing) return;

        const isHovered = hoveredListing?.id === id;

        el.style.transform = isHovered ? 'scale(1.15) translateY(-10px)' : 'scale(1)';
        el.style.zIndex = isHovered ? '1000' : '1';

        if (isHovered && listing.lat && listing.lng) {
          popupRef.current
            ?.setLngLat([listing.lng, listing.lat])
            .setHTML(createPopupHTML(listing))
            .addTo(map.current!);
        }
      });
    } else {
      // Cluster mode: show popup at hovered listing position without moving camera
      if (hoveredListing && hoveredListing.lat && hoveredListing.lng) {
        popupRef.current
          ?.setLngLat([hoveredListing.lng, hoveredListing.lat])
          .setHTML(createPopupHTML(hoveredListing))
          .addTo(map.current!);
      }
    }

    if (!hoveredListing) {
      popupRef.current?.remove();
    }
  }, [hoveredListing, listings, isLoading, showClusters]);

  // Selected listing: smooth easeTo camera movement (only on click)
  useEffect(() => {
    if (!map.current || isLoading || !selectedListing) return;
    if (!selectedListing.lat || !selectedListing.lng) return;

    // Cancel any in-progress animation
    map.current.stop();

    map.current.easeTo({
      center: [selectedListing.lng, selectedListing.lat],
      zoom: Math.max(map.current.getZoom(), 13),
      duration: 600,
    });

    // Show popup for selected listing
    popupRef.current
      ?.setLngLat([selectedListing.lng, selectedListing.lat])
      .setHTML(createPopupHTML(selectedListing))
      .addTo(map.current!);
  }, [selectedListing, isLoading]);

  // Render isochrone data on map
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    // Remove existing isochrone layers
    ['isochrone-fill', 'isochrone-outline', 'isochrone-labels'].forEach(id => {
      if (map.current?.getLayer(id)) map.current.removeLayer(id);
    });
    if (map.current.getSource('isochrone-source')) {
      map.current.removeSource('isochrone-source');
    }

    if (!isochroneData || !infoLayers.isochrone) return;

    // Add isochrone source
    map.current.addSource('isochrone-source', {
      type: 'geojson',
      data: isochroneData,
    });

    // Isochrone fill with gradient colors per contour
    const isoColors = ['#10b981', '#f59e0b', '#ef4444']; // 5min green, 10min yellow, 15min red

    map.current.addLayer({
      id: 'isochrone-fill',
      type: 'fill',
      source: 'isochrone-source',
      paint: {
        'fill-color': [
          'match',
          ['get', 'contour'],
          5, isoColors[0],
          10, isoColors[1],
          15, isoColors[2],
          '#888888'
        ],
        'fill-opacity': 0.15,
      },
    });

    map.current.addLayer({
      id: 'isochrone-outline',
      type: 'line',
      source: 'isochrone-source',
      paint: {
        'line-color': [
          'match',
          ['get', 'contour'],
          5, isoColors[0],
          10, isoColors[1],
          15, isoColors[2],
          '#888888'
        ],
        'line-width': 2,
        'line-dasharray': [3, 2],
        'line-opacity': 0.8,
      },
    });

    // Fly to isochrone center
    if (isochroneCenter) {
      map.current.flyTo({
        center: isochroneCenter,
        zoom: 12,
        duration: 1000,
      });
    }
  }, [isochroneData, isochroneCenter, infoLayers.isochrone]);

  // Clear isochrone when layer is toggled off
  useEffect(() => {
    if (!infoLayers.isochrone) {
      clearIsochrone();
    }
  }, [infoLayers.isochrone, clearIsochrone]);

  // Control handlers
  const handleZoomIn = () => map.current?.zoomIn();
  const handleZoomOut = () => map.current?.zoomOut();

  const handleLocate = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.current?.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 12,
            pitch: mapMode === '3d' ? 50 : 0,
          });
        },
        () => console.warn('Geolocation denied')
      );
    }
  };

  const handleFitAll = () => {
    const validListings = listings.filter((l) => l.lat && l.lng);
    if (validListings.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validListings.forEach((l) => bounds.extend([l.lng!, l.lat!]));
      map.current?.fitBounds(bounds, { padding: 80, maxZoom: 10 });
    }
  };

  const handleResetView = () => {
    map.current?.easeTo({
      pitch: mapMode === '3d' ? 50 : 0,
      bearing: mapMode === '3d' ? -17 : 0,
      duration: 800,
    });
    handleFitAll();
  };

  const handleResetNorth = () => {
    map.current?.easeTo({ bearing: 0, duration: 500 });
  };

  const startDrawing = () => {
    if (draw.current) {
      draw.current.changeMode('draw_polygon');
      setIsDrawing(true);
    }
  };

  const clearDrawing = () => {
    if (draw.current) {
      draw.current.deleteAll();
      setDrawnArea(null);
      setIsDrawing(false);
    }
  };

  const changeMapMode = (mode: 'streets' | 'satellite' | '3d') => {
    setMapMode(mode);
    if (map.current) {
      map.current.setStyle(
        mode === 'satellite'
          ? 'mapbox://styles/mapbox/satellite-streets-v12'
          : mode === '3d'
          ? 'mapbox://styles/mapbox/outdoors-v12'
          : 'mapbox://styles/mapbox/light-v11'
      );

      map.current.once('style.load', () => {
        if (mode === '3d') {
          map.current?.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14,
          });
          map.current?.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
          map.current?.easeTo({ pitch: 50, bearing: -17, duration: 800 });
        } else {
          map.current?.setTerrain(null);
          map.current?.easeTo({ pitch: 0, bearing: 0, duration: 500 });
        }

        // Re-add info layers after style change
        addInfoLayersRef.current();
        setupLayerHoverEventsRef.current();
      });
    }
  };

  const toggleClusters = () => {
    setShowClusters(!showClusters);
  };

  if (tokenError) {
    return (
      <Card className={`relative overflow-hidden flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <p className="text-muted-foreground">Error al cargar el mapa</p>
          <p className="text-sm text-muted-foreground/70 mt-1">{tokenError}</p>
        </div>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className={`relative overflow-hidden ${className}`}>
        {(isLoading || tokenLoading) && (
          <div className="absolute inset-0 z-10">
            <Skeleton className="w-full h-full" />
          </div>
        )}

        <div ref={mapContainer} className="w-full h-full" />

        {/* Desktop: Compact Controls */}
        {!isMobile && (
          <CompactMapControls
            mapMode={mapMode}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onChangeMapMode={changeMapMode}
            onOpenTools={() => setShowToolsDrawer(!showToolsDrawer)}
            activeLayersCount={Object.values(infoLayers).filter(Boolean).length}
            listingsCount={listings.filter((l) => l.lat && l.lng).length}
            drawnArea={drawnArea}
          />
        )}

        {/* Desktop: Tools Drawer */}
        {!isMobile && (
          <MapToolsDrawer
            open={showToolsDrawer}
            onClose={() => setShowToolsDrawer(false)}
            infoLayers={infoLayers}
            layerConfig={layerConfig}
            onLayerChange={handleLayerChange}
            onConfigChange={handleConfigChange}
            showDrawTools={showDrawTools}
            isDrawing={isDrawing}
            drawnArea={drawnArea}
            onStartDrawing={startDrawing}
            onClearDrawing={clearDrawing}
          />
        )}

        {/* Touch-Optimized Mobile Controls */}
        <TouchMapControls
          mapMode={mapMode}
          isDrawing={isDrawing}
          drawnArea={drawnArea}
          showDrawTools={showDrawTools}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onLocate={handleLocate}
          onFitAll={handleFitAll}
          onResetNorth={handleResetNorth}
          onResetView={handleResetView}
          onChangeMapMode={changeMapMode}
          onStartDrawing={startDrawing}
          onClearDrawing={clearDrawing}
          onOpenLayers={() => setShowLayersPanel(true)}
          activeLayersCount={Object.values(infoLayers).filter(Boolean).length}
        />

        {/* Touch Gesture Feedback Overlay */}
        {isMobile && (
          <GestureFeedback
            type={gestureFeedback.type}
            position={gestureFeedback.position}
            scale={gestureFeedback.scale}
            visible={gestureFeedback.visible}
          />
        )}

        {/* Mobile Layers Panel */}
        {showLayersPanel && isMobile && (
          <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-md md:hidden overflow-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Capas de Información</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowLayersPanel(false)}
                  className="h-10 px-4"
                >
                  Cerrar
                </Button>
              </div>
              <div className="space-y-4">
                {[
                  { key: 'heatmap', label: 'Heatmap Precio/m²', desc: 'Precio real por m² de la plataforma' },
                  { key: 'isochrone', label: 'Isócronas de Conectividad', desc: 'Click en propiedad → 5/10/15 min' },
                  { key: 'zoning', label: 'Zonificación Urbana', desc: 'Uso de suelo permitido' },
                  { key: 'infrastructure', label: 'Servicios Básicos', desc: 'Agua, luz, alcantarillado' },
                  { key: 'roads', label: 'Red Vial', desc: 'Carreteras y caminos' },
                  { key: 'riskZones', label: 'Zonas de Riesgo', desc: 'Inundaciones, deslizamientos' },
                  { key: 'waterBodies', label: 'Cuerpos de Agua', desc: 'Ríos, lagos, humedales' },
                  { key: 'greenAreas', label: 'Áreas Verdes', desc: 'Parques, reservas' },
                  { key: 'hydrology', label: 'Red Hidrográfica', desc: 'DGA - Cuencas, acuíferos' },
                  { key: 'mining', label: 'Catastro Minero', desc: 'Concesiones, faenas' },
                  { key: 'biodiversity', label: 'Biodiversidad', desc: 'Ecosistemas, especies' },
                ].map(({ key, label, desc }) => (
                  <button
                    key={key}
                    onClick={() => handleLayerChange(key as keyof InfoLayerState, !infoLayers[key as keyof InfoLayerState])}
                    className={`w-full p-4 rounded-xl border transition-all touch-manipulation ${
                      infoLayers[key as keyof InfoLayerState]
                        ? 'bg-primary/10 border-primary'
                        : 'bg-muted/50 border-transparent hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">{desc}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        infoLayers[key as keyof InfoLayerState] ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        {infoLayers[key as keyof InfoLayerState] && (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                <button
                  onClick={() => handleConfigChange({ useRealData: !layerConfig.useRealData })}
                  className="w-full flex items-center justify-between touch-manipulation"
                >
                  <div className="text-left">
                    <p className="font-medium">{layerConfig.useRealData ? 'Datos Reales' : 'Datos Demo'}</p>
                    <p className="text-sm text-muted-foreground">
                      {layerConfig.useRealData ? 'IDE Chile / MINVU' : 'Datos de demostración'}
                    </p>
                  </div>
                  <div className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${
                    layerConfig.useRealData ? 'bg-primary justify-end' : 'bg-muted justify-start'
                  }`}>
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drawing mode indicator */}
        {isDrawing && (
          <div className="absolute bottom-36 md:bottom-16 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg animate-pulse">
              <div className="flex items-center gap-2 text-xs md:text-sm">
                <PenTool className="h-4 w-4" />
                <span className="hidden md:inline">Dibujando área • Haz clic para agregar puntos</span>
                <span className="md:hidden">Toca para agregar puntos</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default EnhancedMap;
