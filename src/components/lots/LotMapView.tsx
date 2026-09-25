import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { usePolygonDrawing } from '@/hooks/usePolygonDrawing';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Layers, Mountain, Upload, Image, PenTool, ArrowLeftRight, Hash, RefreshCw, Minimize2, RotateCcw, Route, Settings2, ChevronDown, Play, Map as MapIcon, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { parseKMZFile, parseKMLFile, generatePolygonsFromPoints, buildPolygonsAdvanced, buildPolygonsFromMixedGeometry, extractRoadGeometries } from '@/lib/kmz';
import { importProjectSpatialSource } from '@/lib/kmz/projectSpatialImport';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MasterPlanOverlay } from './MasterPlanOverlay';
import { LotDrawingTool } from './LotDrawingTool';
import { LotRenumberTool } from './LotRenumberTool';
import { normalizePolygon } from '@/lib/polygonUtils';

interface Lot {
  id: string;
  lot_number: string;
  area: number;
  price: number | null;
  status: string | null;
  latitude: number | null;
  longitude: number | null;
  polygon: any;
}

interface LotMapViewProps {
  lots: Lot[];
  projectCenter: { lat: number; lng: number };
  onLotClick: (lot: Lot) => void;
  selectedLotId?: string | null;
  projectId?: string;
  kmzFileUrl?: string | null;
  planImages?: string[];
  onLotsUpdated?: () => void;
  readOnly?: boolean;
  showAdminControls?: boolean;
  onOpenCompare?: () => void;
  /** Commercial tour mode: satellite + terrain relief + cinematic camera controls. */
  tourMode?: boolean;
  /** Optional road/servitude geometry already extracted from the source KMZ. */
  externalRoads?: GeoJSON.FeatureCollection<GeoJSON.LineString> | null;
}

// Generate GeoJSON from lots - uses real polygons if available, otherwise generates grid
const generateLotGeoJSON = (lots: Lot[], center: { lat: number; lng: number }) => {
  const features: GeoJSON.Feature[] = [];
  
  // Separate lots with valid polygons (>=3 points) from those without
  const normalizedLots = lots.map((lot) => ({ lot, normalized: normalizePolygon(lot.polygon) }));
  const lotsWithValidPolygons = normalizedLots.filter(({ normalized }) => normalized.valid);
  const lotsWithoutPolygons = normalizedLots.filter(({ normalized }) => !normalized.valid).map(({ lot }) => lot);
  
  // Add real polygon features
  lotsWithValidPolygons.forEach(({ lot, normalized }) => {
    const coords = [...normalized.coords, normalized.coords[0]];
    
    features.push({
      type: 'Feature',
      id: lot.id,
      properties: {
        id: lot.id,
        lot_number: lot.lot_number,
        area: lot.area,
        price: lot.price,
        status: lot.status || 'available',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [coords],
      },
    });
  });
  
  // Generate grid rectangles for lots without valid polygons
  if (lotsWithoutPolygons.length > 0) {
    const cols = Math.min(9, Math.ceil(Math.sqrt(lotsWithoutPolygons.length)));
    const lotWidth = 0.0012;
    const lotHeight = 0.0008;
    const gap = 0.0001;
    
    lotsWithoutPolygons.forEach((lot, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      const baseLng = center.lng - (cols * (lotWidth + gap)) / 2;
      const baseLat = center.lat + 0.002;
      
      const lng = baseLng + col * (lotWidth + gap);
      const lat = baseLat - row * (lotHeight + gap);
      
      features.push({
        type: 'Feature',
        id: lot.id,
        properties: {
          id: lot.id,
          lot_number: lot.lot_number,
          area: lot.area,
          price: lot.price,
          status: lot.status || 'available',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [lng, lat],
            [lng + lotWidth, lat],
            [lng + lotWidth, lat - lotHeight],
            [lng, lat - lotHeight],
            [lng, lat]
          ]],
        },
      });
    });
  }

  return {
    type: 'FeatureCollection' as const,
    features,
  };
};

// Align elongated master plans with the viewport while preserving geographic geometry.
// Mapbox bearing rotates only the camera; stored [lng, lat] coordinates remain untouched.
const calculatePlanBearing = (lots: Lot[]): number => {
  const coordinates = lots.flatMap((lot) => normalizePolygon(lot.polygon).coords);
  if (coordinates.length < 3) return 0;

  const centerLng = coordinates.reduce((sum, coordinate) => sum + coordinate[0], 0) / coordinates.length;
  const centerLat = coordinates.reduce((sum, coordinate) => sum + coordinate[1], 0) / coordinates.length;
  const lngScale = Math.cos((centerLat * Math.PI) / 180);

  let xx = 0;
  let xy = 0;
  let yy = 0;
  coordinates.forEach(([lng, lat]) => {
    const x = (lng - centerLng) * lngScale;
    const y = lat - centerLat;
    xx += x * x;
    xy += x * y;
    yy += y * y;
  });

  const principalAngleFromEast = 0.5 * Math.atan2(2 * xy, xx - yy);
  const axisBearingFromNorth = 90 - (principalAngleFromEast * 180) / Math.PI;
  return axisBearingFromNorth - 90;
};

const getStatusFillColor = (status: string): string => {
  if (status === 'sold') return '#64748b';
  if (status === 'reserved') return '#d97706';
  return '#059669';
};

// Color expressions for different visualization modes
const getColorExpression = (mode: 'status' | 'price' | 'area', lots: Lot[]): any => {
  if (mode === 'price') {
    const prices = lots.filter(l => l.price).map(l => l.price!);
    const minP = Math.min(...prices) || 0;
    const maxP = Math.max(...prices) || 1;
    const mid = (minP + maxP) / 2;
    return [
      'interpolate', ['linear'], ['coalesce', ['get', 'price'], 0],
      0, '#94a3b8',
      minP, '#22c55e',
      mid, '#eab308',
      maxP, '#ef4444',
    ];
  }
  if (mode === 'area') {
    const areas = lots.map(l => l.area);
    const minA = Math.min(...areas) || 0;
    const maxA = Math.max(...areas) || 1;
    const mid = (minA + maxA) / 2;
    return [
      'interpolate', ['linear'], ['get', 'area'],
      minA, '#bfdbfe',
      mid, '#3b82f6',
      maxA, '#1e3a5f',
    ];
  }
  // Default: status
  return [
    'case',
    ['==', ['get', 'status'], 'sold'], '#475569',
    ['==', ['get', 'status'], 'reserved'], '#d97706',
    '#059669',
  ];
};

/**
 * Aplica la vista del masterplan sobre las capas ya montadas.
 * only=true (plano comercial): solo disponibles con relleno verde y número;
 * el resto del loteo queda como deslinde blanco fino sobre el satélite.
 * only=false: todos los lotes pintados según el modo de color activo.
 */
const applyAvailabilityView = (
  m: mapboxgl.Map,
  only: boolean,
  mode: 'status' | 'price' | 'area',
  lots: Lot[],
) => {
  if (!m.getLayer('lots-fill')) return;
  const setHotspotFilter = (filter: any) => {
    if (m.getLayer('lots-hotspot')) m.setFilter('lots-hotspot', filter);
  };
  if (only) {
    m.setFilter('lots-fill', ['==', ['get', 'status'], 'available']);
    m.setFilter('lots-labels', ['==', ['get', 'status'], 'available']);
    setHotspotFilter(['==', ['get', 'status'], 'available']);
    m.setPaintProperty('lots-fill', 'fill-color', '#3fae49');
    // Velo mínimo: el satélite (vegetación, caminos, relieve) debe verse.
    m.setPaintProperty('lots-fill', 'fill-opacity', 0.1);
    m.setPaintProperty('lots-outline', 'line-width', 1.8);
    m.setPaintProperty('lots-outline', 'line-opacity', 0.95);
  } else {
    m.setFilter('lots-fill', null);
    m.setFilter('lots-labels', null);
    setHotspotFilter(null);
    m.setPaintProperty('lots-fill', 'fill-color', getColorExpression(mode, lots));
    m.setPaintProperty('lots-fill', 'fill-opacity', mode === 'status' ? 0.12 : 0.35);
    m.setPaintProperty('lots-outline', 'line-width', 1.8);
    m.setPaintProperty('lots-outline', 'line-opacity', 0.95);
  }
  // El número siempre va dentro del hotspot de estado.
  m.setLayoutProperty('lots-labels', 'text-field', ['get', 'lot_number']);
};


const formatPrice = (price: number | null) => {
  if (!price) return 'Consultar';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(price);
};

export const LotMapView = ({ lots, projectCenter, onLotClick, selectedLotId, projectId, kmzFileUrl, planImages, onLotsUpdated, readOnly = false, showAdminControls = false, onOpenCompare, tourMode = false, externalRoads = null }: LotMapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reimportFileInputRef = useRef<HTMLInputElement>(null);
  const renumberModeRef = useRef(false);
  const { token, loading: tokenLoading, error: tokenError } = useMapboxToken();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets'>('satellite');
  const [showContours, setShowContours] = useState(false);
  // El cambio de estilo re-crea el mapa: el handler de load lee el ref para
  // restaurar la visibilidad de las curvas sin depender del ciclo de React.
  const showContoursRef = useRef(false);
  // Vista "solo disponibles" (estilo plano comercial): deslindes de todo el
  // loteo en línea fina y SOLO las parcelas disponibles pintadas de verde con
  // su número — evita la nube de polígonos en loteos grandes. Por defecto ON.
  const [onlyAvailable, setOnlyAvailable] = useState(!tourMode);
  const onlyAvailableRef = useRef(!tourMode);
  const cinematicTimerRef = useRef<number | null>(null);
  const [terrainEnabled, setTerrainEnabled] = useState(tourMode);
  const [importing, setImporting] = useState(false);
  const [loadingKmz, setLoadingKmz] = useState(false);
  const [kmzLoaded, setKmzLoaded] = useState(false);
  const [showMasterPlanOverlay, setShowMasterPlanOverlay] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showDrawingPanel, setShowDrawingPanel] = useState(false);
  const [renumberMode, setRenumberMode] = useState(false);
  const [renumberSelectedLot, setRenumberSelectedLot] = useState<{ id: string; lot_number: string } | null>(null);
  const [compacting, setCompacting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [roadGeojson, setRoadGeojson] = useState<GeoJSON.FeatureCollection<GeoJSON.LineString> | null>(externalRoads);
  const [showRoads, setShowRoads] = useState(true);
  const [colorMode, setColorMode] = useState<'status' | 'price' | 'area'>('status');

  useEffect(() => {
    if (externalRoads) setRoadGeojson(externalRoads);
  }, [externalRoads]);

  // Keep ref in sync with state for use inside map event handlers
  useEffect(() => {
    renumberModeRef.current = renumberMode;
  }, [renumberMode]);
  
  // Build master plan images from project's plan_images
  const masterPlanImagesList = (planImages && planImages.length > 0)
    ? planImages.map((url, idx) => ({ label: `Lámina ${idx + 1}`, url }))
    : [];

  // Polygon drawing hook
  const {
    isDrawingMode,
    currentMode,
    currentPolygon,
    selectedLotId: drawingSelectedLotId,
    isSaving,
    setSelectedLotId: setDrawingSelectedLotId,
    initializeDraw,
    startDrawing,
    startEditing,
    startDeleting,
    cancelDrawing,
    exitDrawingMode,
    savePolygonToLot,
    deletePolygonFromLot,
  } = usePolygonDrawing({
    map: map.current,
    lots: lots.map(l => ({ id: l.id, lot_number: l.lot_number, area: l.area, polygon: l.polygon })),
    onLotsUpdated,
  });

  // Enable drawing mode
  const handleEnableDrawingMode = useCallback(() => {
    if (map.current && mapLoaded) {
      setShowDrawingPanel(true);
      setShowMasterPlanOverlay(true); // Show master plan for reference
      initializeDraw();
    }
  }, [mapLoaded, initializeDraw]);

  // Disable drawing mode
  const handleDisableDrawingMode = useCallback(() => {
    exitDrawingMode();
    setShowDrawingPanel(false);
  }, [exitDrawingMode]);

  // Auto-load KMZ from URL if lots don't have polygons yet (skip in readOnly mode)
  useEffect(() => {
    const loadKmzFromUrl = async () => {
      if (!kmzFileUrl || !projectId || kmzLoaded || readOnly) return;
      
      // Check if lots already have VALID polygon data (at least 3 points)
      const hasValidPolygons = lots.some(lot => 
        lot.polygon && 
        Array.isArray(lot.polygon) && 
        lot.polygon.length >= 3
      );
      if (hasValidPolygons) {
        setKmzLoaded(true);
        return;
      }
      
      setLoadingKmz(true);
      try {
        // Fetch the KMZ file from the public URL
        const response = await fetch(kmzFileUrl);
        if (!response.ok) throw new Error('Failed to fetch KMZ file');
        
        const blob = await response.blob();
        const file = new File([blob], 'project.kmz', { type: 'application/vnd.google-earth.kmz' });
        
        const parsed = kmzFileUrl.endsWith('.kml') 
          ? await parseKMLFile(file)
          : await parseKMZFile(file);
        
        console.log('=== KMZ AUTO-IMPORT ===');
        console.log('Parsed placemarks:', parsed.placemarks.length);
        
        if (parsed.placemarks.length === 0) {
          console.warn('No placemarks found in KMZ');
          return;
        }
        
        // Use smart polygon builder that tries multiple strategies:
        // 1. Real Polygons from KML
        // 2. Connect LineStrings to form polygons
        // 3. Closed LineStrings (hidden polygons)
        // 4. Advanced reconstruction as fallback
        let placemarksToUse = buildPolygonsFromMixedGeometry(
          parsed.placemarks,
          lots.map(l => ({ lot_number: l.lot_number, area: l.area }))
        );
        
        console.log(`Smart builder produced: ${placemarksToUse.length} polygons`);
        
        // If still not enough, use the more aggressive advanced builder
        if (placemarksToUse.length < lots.length * 0.3) {
          console.log('Still not enough polygons, using aggressive builder...');
          placemarksToUse = buildPolygonsAdvanced(
            parsed.placemarks,
            lots.map(l => ({ lot_number: l.lot_number, area: l.area }))
          );
          console.log('Aggressive builder generated:', placemarksToUse.length, 'polygons');
        }
        
        // Sort lots by lot_number for sequential assignment
        const sortedLots = [...lots].sort((a, b) => {
          const numA = parseInt(a.lot_number) || 0;
          const numB = parseInt(b.lot_number) || 0;
          return numA - numB;
        });
        
        // Match placemarks to existing lots
        let updatedCount = 0;
        const usedPlacemarkIndices = new Set<number>();
        
        for (const lot of sortedLots) {
          // Strategy 1: Try to match by name containing lot number
          let matchingPlacemark = placemarksToUse.find((p, idx) => {
            if (usedPlacemarkIndices.has(idx)) return false;
            const match = p.name.match(/(\d+)/);
            return match && (match[1] === lot.lot_number || p.name === lot.lot_number);
          });
          
          let matchIndex = matchingPlacemark ? placemarksToUse.indexOf(matchingPlacemark) : -1;
          
          // Strategy 2: If no name match, assign sequentially by index
          if (!matchingPlacemark) {
            const availableIndex = placemarksToUse.findIndex((_, idx) => !usedPlacemarkIndices.has(idx));
            if (availableIndex !== -1) {
              matchingPlacemark = placemarksToUse[availableIndex];
              matchIndex = availableIndex;
            }
          }
          
          if (matchingPlacemark && matchIndex !== -1) {
            usedPlacemarkIndices.add(matchIndex);
            
            const centroid = matchingPlacemark.coordinates.reduce(
              (acc, [lng, lat]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }),
              { lat: 0, lng: 0 }
            );
            centroid.lat /= matchingPlacemark.coordinates.length;
            centroid.lng /= matchingPlacemark.coordinates.length;
            
            const { error } = await supabase
              .from('lots')
              .update({
                polygon: matchingPlacemark.coordinates,
                latitude: centroid.lat,
                longitude: centroid.lng,
                area: matchingPlacemark.area || lot.area,
              })
              .eq('id', lot.id);
            
            if (!error) {
              updatedCount++;
              console.log(`Lot ${lot.lot_number} updated with polygon (${matchingPlacemark.coordinates.length} points)`);
            }
          }
        }
        
        // Update project center
        await supabase
          .from('projects')
          .update({
            latitude: parsed.center.lat,
            longitude: parsed.center.lng,
          })
          .eq('id', projectId);
        
        if (updatedCount > 0) {
          toast.success(`${updatedCount} lotes actualizados con polígonos del KMZ`);
          setKmzLoaded(true);
          onLotsUpdated?.();
        }
        
      } catch (error) {
        console.error('Error loading KMZ from URL:', error);
      } finally {
        setLoadingKmz(false);
      }
    };
    
    loadKmzFromUrl();
  }, [kmzFileUrl, projectId, lots, kmzLoaded, onLotsUpdated, readOnly]);

  // Handle KMZ/KML file import through the unified Spatial Engine.
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;

    setImporting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error('Debes iniciar sesión para importar geometría');

      const priced = lots.filter((lot) => Number(lot.price || 0) > 0 && Number(lot.area || 0) > 0);
      const basePrice = priced.length ? Math.min(...priced.map((lot) => Number(lot.price))) : 15000000;
      const pricePerSqm = priced.length
        ? Math.max(1, Math.round(priced.reduce((sum, lot) => sum + Number(lot.price) / Number(lot.area), 0) / priced.length))
        : 3000;

      const result = await importProjectSpatialSource({
        projectId,
        userId,
        file,
        pricing: { basePrice, pricePerSqm },
        updateExisting: true,
      });

      if (result.roads > 0) {
        const roads = await extractRoadGeometries(file);
        setRoadGeojson(roads);
      }

      toast.success(
        `Spatial Engine: ${result.updated} actualizados · ${result.inserted} nuevos · ${result.roads} caminos/servidumbres`,
      );
      setKmzLoaded(true);
      onLotsUpdated?.();
    } catch (error) {
      console.error('Error importing KMZ through Spatial Engine:', error);
      toast.error(error instanceof Error ? error.message : 'Error al importar el archivo');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Regenerate polygons using advanced algorithm
  const handleRegeneratePolygons = async () => {
    if (!kmzFileUrl || !projectId) {
      toast.error('No hay archivo KMZ configurado para este proyecto');
      return;
    }
    
    setRegenerating(true);
    try {
      // Reset existing polygons first
      const { error: resetError } = await supabase
        .from('lots')
        .update({ polygon: null, latitude: null, longitude: null })
        .eq('project_id', projectId);
      
      if (resetError) throw resetError;
      
      // Fetch and parse KMZ
      const response = await fetch(kmzFileUrl);
      if (!response.ok) throw new Error('Failed to fetch KMZ');
      
      const blob = await response.blob();
      const file = new File([blob], 'project.kmz', { type: 'application/vnd.google-earth.kmz' });
      
      const parsed = kmzFileUrl.endsWith('.kml') 
        ? await parseKMLFile(file)
        : await parseKMZFile(file);
      
      console.log('=== REGENERATE POLYGONS ===');
      console.log('Parsed placemarks:', parsed.placemarks.length);
      
      // Use smart builder that connects LineStrings
      const polygons = buildPolygonsFromMixedGeometry(
        parsed.placemarks,
        lots.map(l => ({ lot_number: l.lot_number, area: l.area }))
      );
      
      console.log('Smart builder generated:', polygons.length);
      
      // If not enough, fall back to aggressive builder
      const finalPolygons = polygons.length >= lots.length * 0.3 
        ? polygons 
        : buildPolygonsAdvanced(
            parsed.placemarks, 
            lots.map(l => ({ lot_number: l.lot_number, area: l.area }))
          );
      
      console.log('Final polygons:', finalPolygons.length);
      
      // Match and update lots
      let updatedCount = 0;
      for (const polygon of finalPolygons) {
        const lotNumber = polygon.name.match(/(\d+)/)?.[1];
        if (!lotNumber) continue;
        
        const matchingLot = lots.find(l => l.lot_number === lotNumber);
        if (!matchingLot) continue;
        
        const centroid = polygon.coordinates.reduce(
          (acc, [lng, lat]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }),
          { lat: 0, lng: 0 }
        );
        centroid.lat /= polygon.coordinates.length;
        centroid.lng /= polygon.coordinates.length;
        
        const { error } = await supabase
          .from('lots')
          .update({
            polygon: polygon.coordinates,
            latitude: centroid.lat,
            longitude: centroid.lng,
            area: polygon.area || matchingLot.area,
          })
          .eq('id', matchingLot.id);
        
        if (!error) updatedCount++;
      }
      
      toast.success(`${updatedCount} polígonos regenerados con algoritmo inteligente`);
      setKmzLoaded(true);
      onLotsUpdated?.();
      
    } catch (error) {
      console.error('Error regenerating polygons:', error);
      toast.error('Error al regenerar polígonos');
    } finally {
      setRegenerating(false);
    }
  };

  // Re-import by name now uses the same Spatial Engine upsert path.
  const handleReimportByName = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;

    setImporting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error('Debes iniciar sesión para reimportar geometría');

      const priced = lots.filter((lot) => Number(lot.price || 0) > 0 && Number(lot.area || 0) > 0);
      const basePrice = priced.length ? Math.min(...priced.map((lot) => Number(lot.price))) : 15000000;
      const pricePerSqm = priced.length
        ? Math.max(1, Math.round(priced.reduce((sum, lot) => sum + Number(lot.price) / Number(lot.area), 0) / priced.length))
        : 3000;

      const result = await importProjectSpatialSource({
        projectId,
        userId,
        file,
        pricing: { basePrice, pricePerSqm },
        updateExisting: true,
      });

      const roads = await extractRoadGeometries(file);
      setRoadGeojson(roads);
      toast.success(`${result.updated} lotes sincronizados por número/nombre · ${result.roads} caminos`);
      setKmzLoaded(true);
      onLotsUpdated?.();
    } catch (error) {
      console.error('Error reimporting KMZ through Spatial Engine:', error);
      toast.error(error instanceof Error ? error.message : 'Error al reimportar el archivo');
    } finally {
      setImporting(false);
      if (reimportFileInputRef.current) reimportFileInputRef.current.value = '';
    }
  };

  // === RESTORE ORIGINAL KMZ: Re-download and assign by placemark name ===
  const handleRestoreKmz = async () => {
    if (!kmzFileUrl || !projectId) {
      toast.error('No hay archivo KMZ configurado para este proyecto');
      return;
    }

    setRestoring(true);
    toast.info('Restaurando polígonos originales del KMZ...');

    try {
      const response = await fetch(kmzFileUrl);
      if (!response.ok) throw new Error('Failed to fetch KMZ');

      const blob = await response.blob();
      const file = new File([blob], 'project.kmz', { type: 'application/vnd.google-earth.kmz' });

      const parsed = kmzFileUrl.endsWith('.kml')
        ? await parseKMLFile(file)
        : await parseKMZFile(file);

      // Extract road geometries at the same time
      const roadFile = new File([blob], 'project.kmz', { type: 'application/vnd.google-earth.kmz' });
      const roads = await extractRoadGeometries(roadFile);
      if (roads.features.length > 0) {
        setRoadGeojson(roads);
        console.log(`Extracted ${roads.features.length} road geometries`);
      }

      // Get all polygons using the smart builder
      let allPolygons = parsed.placemarks.filter(p => p.isPolygon && p.coordinates.length >= 3);
      if (allPolygons.length < lots.length * 0.5) {
        const built = buildPolygonsFromMixedGeometry(
          parsed.placemarks,
          lots.map(l => ({ lot_number: l.lot_number, area: l.area }))
        );
        if (built.length > allPolygons.length) allPolygons = built;
      }

      console.log('=== RESTORE KMZ ORIGINAL ===');
      console.log('Polygons available:', allPolygons.length);

      let updatedCount = 0;
      for (const placemark of allPolygons) {
        const match = placemark.name.match(/Lote[:\s-]*(\d+)/i) || placemark.name.match(/^(\d+)$/);
        if (!match) continue;

        const lotNum = match[1];
        const matchingLot = lots.find(l => l.lot_number === lotNum);
        if (!matchingLot) continue;

        const centroid = placemark.coordinates.reduce(
          (acc, [lng, lat]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }),
          { lat: 0, lng: 0 }
        );
        centroid.lat /= placemark.coordinates.length;
        centroid.lng /= placemark.coordinates.length;

        const { error } = await supabase
          .from('lots')
          .update({
            polygon: placemark.coordinates,
            latitude: centroid.lat,
            longitude: centroid.lng,
            name: `Lote ${lotNum}`,
          })
          .eq('id', matchingLot.id);

        if (!error) updatedCount++;
      }

      toast.success(`${updatedCount} lotes restaurados con polígonos originales del KMZ`);
      onLotsUpdated?.();
    } catch (error) {
      console.error('Error restoring KMZ:', error);
      toast.error('Error al restaurar polígonos del KMZ');
    } finally {
      setRestoring(false);
    }
  };

  // === SNAP ALGORITHM: Compact lots with road restriction ===
  const handleCompactLots = async () => {
    const lotsWithPolygons = lots.filter(l => l.polygon && Array.isArray(l.polygon) && l.polygon.length >= 3);
    if (lotsWithPolygons.length < 2) {
      toast.error('Se necesitan al menos 2 lotes con polígonos');
      return;
    }

    if (!roadGeojson || roadGeojson.features.length === 0) {
      toast.warning('No hay caminos cargados. Restaura el KMZ primero para cargar restricciones de caminos.');
    }

    setCompacting(true);
    toast.info('Compactando lotes con restricción de caminos (0.8m)...');

    try {
      // Deep copy all polygons
      const polys: { id: string; coords: [number, number][] }[] = lotsWithPolygons.map(l => ({
        id: l.id,
        coords: l.polygon.map((c: [number, number]) => [...c] as [number, number]),
      }));

      // SAFE tolerances
      const SNAP_V2V = 0.8 / 111320; // ~0.8m
      const TOLERANCE_DEG = 1.5 / 111320; // ~1.5m

      // Road segments for crossing check
      const roadSegments: { a: [number, number]; b: [number, number] }[] = [];
      if (roadGeojson) {
        for (const feature of roadGeojson.features) {
          const coords = feature.geometry.coordinates;
          for (let i = 0; i < coords.length - 1; i++) {
            roadSegments.push({
              a: [coords[i][0], coords[i][1]],
              b: [coords[i + 1][0], coords[i + 1][1]],
            });
          }
        }
      }

      // Check if line segment p1-p2 crosses any road segment
      const crossesRoad = (p1: [number, number], p2: [number, number]): boolean => {
        if (roadSegments.length === 0) return false;
        const ROAD_BUFFER = 2 / 111320; // ~2m buffer around roads
        for (const seg of roadSegments) {
          // Simple proximity check: if midpoint of p1-p2 is within buffer of any road segment
          const mid: [number, number] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
          const dx = seg.b[0] - seg.a[0], dy = seg.b[1] - seg.a[1];
          const lenSq = dx * dx + dy * dy;
          if (lenSq === 0) continue;
          let t = ((mid[0] - seg.a[0]) * dx + (mid[1] - seg.a[1]) * dy) / lenSq;
          t = Math.max(0, Math.min(1, t));
          const proj: [number, number] = [seg.a[0] + t * dx, seg.a[1] + t * dy];
          const dist = Math.sqrt((mid[0] - proj[0]) ** 2 + (mid[1] - proj[1]) ** 2);
          if (dist < ROAD_BUFFER) return true;
        }
        return false;
      };

      // Helper: distance from point P to segment AB
      const pointToSegment = (p: [number, number], a: [number, number], b: [number, number]) => {
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return { dist: Math.sqrt((p[0] - a[0]) ** 2 + (p[1] - a[1]) ** 2), proj: [...a] as [number, number] };
        let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const proj: [number, number] = [a[0] + t * dx, a[1] + t * dy];
        const dist = Math.sqrt((p[0] - proj[0]) ** 2 + (p[1] - proj[1]) ** 2);
        return { dist, proj, t };
      };

      let snappedCount = 0;
      let blockedByRoad = 0;

      // Vertex-to-vertex snap
      for (let i = 0; i < polys.length; i++) {
        for (let j = i + 1; j < polys.length; j++) {
          for (let vi = 0; vi < polys[i].coords.length; vi++) {
            for (let vj = 0; vj < polys[j].coords.length; vj++) {
              const a = polys[i].coords[vi], b = polys[j].coords[vj];
              const d = Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
              if (d < SNAP_V2V && d > 1e-10) {
                const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
                if (crossesRoad(a, mid) || crossesRoad(b, mid)) {
                  blockedByRoad++;
                  continue;
                }
                polys[i].coords[vi] = mid;
                polys[j].coords[vj] = [...mid];
                snappedCount++;
              }
            }
          }
        }
      }

      // Vertex-to-segment snap
      for (let i = 0; i < polys.length; i++) {
        for (let j = i + 1; j < polys.length; j++) {
          // A vertices → B segments
          for (let vi = 0; vi < polys[i].coords.length; vi++) {
            const v = polys[i].coords[vi];
            for (let si = 0; si < polys[j].coords.length - 1; si++) {
              const a = polys[j].coords[si], b = polys[j].coords[si + 1];
              const { dist, proj, t } = pointToSegment(v, a, b);
              if (dist < TOLERANCE_DEG && dist > 1e-10 && t !== undefined && t > 0.01 && t < 0.99) {
                const midPt: [number, number] = [(v[0] + proj[0]) / 2, (v[1] + proj[1]) / 2];
                if (crossesRoad(v, midPt)) {
                  blockedByRoad++;
                  continue;
                }
                polys[i].coords[vi] = midPt;
                polys[j].coords.splice(si + 1, 0, [...midPt]);
                snappedCount++;
                break;
              }
            }
          }
        }
      }

      console.log(`Snapped ${snappedCount} vertices (blocked by roads: ${blockedByRoad})`);

      // Update all polygons in DB
      let updatedCount = 0;
      for (const poly of polys) {
        const coords = poly.coords;
        if (coords.length >= 3) {
          const first = coords[0], last = coords[coords.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            coords.push([...first]);
          }
        }

        const validCoords = coords.filter((_, idx) => idx < coords.length - 1);
        const centroid = validCoords.reduce(
          (acc, [lng, lat]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }),
          { lat: 0, lng: 0 }
        );
        centroid.lat /= validCoords.length;
        centroid.lng /= validCoords.length;

        const { error } = await supabase
          .from('lots')
          .update({
            polygon: coords,
            latitude: centroid.lat,
            longitude: centroid.lng,
          })
          .eq('id', poly.id);

        if (!error) updatedCount++;
      }

      toast.success(`${updatedCount} lotes compactados (${snappedCount} vértices ajustados, ${blockedByRoad} bloqueados por caminos)`);
      onLotsUpdated?.();
    } catch (error) {
      console.error('Error compacting lots:', error);
      toast.error('Error al compactar lotes');
    } finally {
      setCompacting(false);
    }
  };

  const calculateBounds = useCallback(() => {
    const lotsWithPolygons = lots.filter(lot => lot.polygon && Array.isArray(lot.polygon) && lot.polygon.length >= 3);
    
    if (lotsWithPolygons.length > 0) {
      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
      
      lotsWithPolygons.forEach(lot => {
        lot.polygon.forEach(([lng, lat]: [number, number]) => {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        });
      });
      
      return new mapboxgl.LngLatBounds([minLng, minLat], [maxLng, maxLat]);
    }
    
    return null;
  }, [lots]);

  const planBearing = calculatePlanBearing(lots);

  const initializeMap = useCallback(() => {
    if (!mapContainer.current || !token || map.current) return;

    mapboxgl.accessToken = token;
    
    const bounds = calculateBounds();
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle === 'satellite' 
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : 'mapbox://styles/mapbox/streets-v12',
      center: bounds ? bounds.getCenter() : [projectCenter.lng, projectCenter.lat],
      zoom: 15,
      pitch: tourMode ? 58 : 0,
      bearing: tourMode ? planBearing - 18 : planBearing,
      antialias: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    if (tourMode) map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      if (!map.current) return;
      setMapLoaded(true);
      
      // Fit to bounds if we have real polygons — extra top/bottom padding on mobile
      // so the plan doesn't collide with sticky header, legend, color-mode toggle or mapbox attribution.
      if (bounds) {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const padding = isMobile
          ? { top: 90, bottom: 140, left: 24, right: 24 }
          : 50;
        map.current.fitBounds(bounds, {
          padding,
          pitch: tourMode ? 58 : 0,
          bearing: tourMode ? planBearing - 18 : planBearing,
          maxZoom: tourMode ? 16.2 : undefined,
          duration: tourMode ? 1600 : 0,
        });
      }

      if (tourMode) {
        if (!map.current.getSource('tour-dem')) {
          map.current.addSource('tour-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14,
          });
        }
        map.current.setTerrain({ source: 'tour-dem', exaggeration: 1.25 });
        try {
          map.current.setFog({
            color: 'rgb(215, 228, 222)',
            'high-color': 'rgb(158, 188, 181)',
            'horizon-blend': 0.08,
            'space-color': 'rgb(7, 23, 18)',
            'star-intensity': 0,
          });
        } catch {
          // Fog support varies by Mapbox style/version.
        }
      }

      const geojson = generateLotGeoJSON(lots, projectCenter);

      // Add source
      map.current.addSource('lots', {
        type: 'geojson',
        data: geojson,
      });

      // Relleno casi transparente: solo tiñe el lote, deja ver el satélite.
      map.current.addLayer({
        id: 'lots-fill',
        type: 'fill',
        source: 'lots',
        paint: {
          'fill-color': getColorExpression(colorMode, lots),
          'fill-opacity': colorMode === 'status' ? 0.12 : 0.35,
        },
      });

      // Deslinde nítido tipo plano (halo oscuro + línea blanca fina)
      map.current.addLayer({
        id: 'lots-outline-halo',
        type: 'line',
        source: 'lots',
        paint: {
          'line-color': '#04120c',
          'line-width': 3.4,
          'line-opacity': 0.45,
          'line-blur': 0.6,
        },
      });
      map.current.addLayer({
        id: 'lots-outline',
        type: 'line',
        source: 'lots',
        paint: {
          'line-color': '#ffffff',
          'line-width': 1.8,
          'line-opacity': 0.95,
        },
      });


      // Curvas de nivel (Mapbox Terrain v2): cotas reales del relieve bajo el
      // loteo, con etiquetas de elevación. Ocultas por defecto; el toggle
      // "Curvas" las muestra. Van bajo las etiquetas de lote.
      map.current.addSource('terrain-contours', {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-terrain-v2',
      });
      const contourVisibility = showContoursRef.current ? 'visible' : 'none';
      map.current.addLayer({
        id: 'contour-lines',
        type: 'line',
        source: 'terrain-contours',
        'source-layer': 'contour',
        layout: { visibility: contourVisibility },
        paint: {
          'line-color': mapStyle === 'satellite' ? '#ffe0b2' : '#8b5e34',
          'line-width': ['case', ['==', ['get', 'index'], 5], 1.4, 0.6],
          'line-opacity': 0.85,
        },
      });
      map.current.addLayer({
        id: 'contour-labels',
        type: 'symbol',
        source: 'terrain-contours',
        'source-layer': 'contour',
        filter: ['==', ['get', 'index'], 5],
        layout: {
          visibility: contourVisibility,
          'symbol-placement': 'line',
          'text-field': ['concat', ['get', 'ele'], ' m'],
          'text-size': 10,
          'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
        },
        paint: {
          'text-color': mapStyle === 'satellite' ? '#ffe0b2' : '#6d4c2a',
          'text-halo-color': 'rgba(0,0,0,0.55)',
          'text-halo-width': 1,
        },
      });

      // Hotspot circular por lote: el color comunica el estado comercial
      // (verde = disponible, ámbar = reservado, gris = vendido) y el número
      // va dentro del círculo para leerse sobre cualquier satélite.
      map.current.addLayer({
        id: 'lots-hotspot',
        type: 'circle',
        source: 'lots',
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'status'], 'sold'], '#475569',
            ['==', ['get', 'status'], 'reserved'], '#d97706',
            '#059669',
          ],
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            13, 7,
            15, 10,
            17, 13,
            19, 16,
          ],
          'circle-opacity': 0.94,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.6,
          'circle-stroke-opacity': 0.95,
        },
      });

      // Add lot numbers with better typography
      map.current.addLayer({
        id: 'lots-labels',
        type: 'symbol',
        source: 'lots',
        layout: {
          'text-field': ['get', 'lot_number'],
          'text-size': [
            'interpolate', ['linear'], ['zoom'],
            14, 10,
            16, 12,
            18, 14
          ],
          'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0,0,0,0.45)',
          'text-halo-width': 0.8,
        },
      });


      // Aplica la vista inicial solo cuando la capa de etiquetas ya existe.
      // Esto asegura el filtro y el texto abreviado también en carga inicial
      // y después de cambios de estilo del mapa.
      applyAvailabilityView(map.current, onlyAvailableRef.current, colorMode, lots);

      // Add roads layer if available
      if (roadGeojson && roadGeojson.features.length > 0) {
        map.current.addSource('roads-kmz', { type: 'geojson', data: roadGeojson });
        map.current.addLayer({
          id: 'roads-kmz-outline',
          type: 'line',
          source: 'roads-kmz',
          paint: {
            'line-color': tourMode ? '#ef2b2d' : '#fbbf24',
            'line-width': tourMode ? 5 : 4,
            'line-opacity': tourMode ? 0.9 : 0.6,
          },
        }, 'lots-fill'); // Insert below lots
        map.current.addLayer({
          id: 'roads-kmz-center',
          type: 'line',
          source: 'roads-kmz',
          paint: {
            'line-color': '#ffffff',
            'line-width': tourMode ? 1.2 : 1.5,
            'line-opacity': tourMode ? 0.95 : 0.8,
            'line-dasharray': tourMode ? [1, 0] : [4, 3],
          },
        }, 'lots-fill');
      }

      if (tourMode) {
        setOnlyAvailable(false);
        onlyAvailableRef.current = false;
        applyAvailabilityView(map.current, false, 'status', lots);
      }

      // Hover effect
      map.current.on('mouseenter', 'lots-fill', (e) => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = 'pointer';

        if (e.features && e.features[0]) {
          const props = e.features[0].properties;
          if (!props) return;

          const status = props.status === 'sold' ? 'Vendido' : 
                        props.status === 'reserved' ? 'Reservado' : 'Disponible';

          popup.current = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'lot-popup',
            maxWidth: '240px',
          })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="padding: 12px; font-family: system-ui; border-radius: 12px;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                  <strong style="font-size: 15px; font-weight: 700;">Lote ${props.lot_number}</strong>
                  <span style="font-size: 10px; padding: 2px 8px; border-radius: 9999px; font-weight: 600; color: white; background: ${
                    props.status === 'sold' ? '#475569' : 
                    props.status === 'reserved' ? '#d97706' : '#059669'
                  };">
                    ${status}
                  </span>
                </div>
                <div style="font-size: 13px; color: #64748b; line-height: 1.6;">
                  <div style="display:flex; justify-content:space-between;">
                    <span>Superficie</span>
                    <strong style="color: #0f172a;">${Number(props.area).toLocaleString()} m²</strong>
                  </div>
                  <div style="display:flex; justify-content:space-between;">
                    <span>Precio</span>
                    <strong style="color: #059669;">${formatPrice(props.price)}</strong>
                  </div>
                </div>
              </div>
            `)
            .addTo(map.current);
        }
      });

      map.current.on('mouseleave', 'lots-fill', () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = '';
        popup.current?.remove();
      });

      // Click handler — stored as ref so renumberMode can be read dynamically
      map.current.on('click', 'lots-fill', (e) => {
        if (e.features && e.features[0]) {
          const props = e.features[0].properties;
          if (!props) return;
          
          const lot = lots.find(l => l.id === props.id);
          if (!lot) return;

          // Check renumber mode via ref
          if (renumberModeRef.current) {
            setRenumberSelectedLot({ id: lot.id, lot_number: lot.lot_number });
            return;
          }

          if (lot.status !== 'sold') {
            onLotClick(lot);
          }
        }
      });
    });

    return () => {
      popup.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, [token, lots, projectCenter, onLotClick, mapStyle, calculateBounds, planBearing, tourMode, roadGeojson]);

  useEffect(() => {
    initializeMap();
    return () => {
      popup.current?.remove();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initializeMap]);

  // Update selected lot highlight
  useEffect(() => {
    if (!map.current || !mapLoaded || !map.current.isStyleLoaded()) return;

    if (map.current.getLayer('lots-selected')) {
      map.current.removeLayer('lots-selected');
    }
    if (map.current.getLayer('lots-selected-fill')) {
      map.current.removeLayer('lots-selected-fill');
    }

    if (selectedLotId) {
      map.current.addLayer({
        id: 'lots-selected-fill',
        type: 'fill',
        source: 'lots',
        filter: ['==', ['get', 'id'], selectedLotId],
        paint: {
          'fill-color': '#f6c64e',
          // Suficiente para destacar, sin tapar los árboles ni el relieve.
          'fill-opacity': 0.16,
        },
      });
      map.current.addLayer({
        id: 'lots-selected',
        type: 'line',
        source: 'lots',
        filter: ['==', ['get', 'id'], selectedLotId],
        paint: {
          'line-color': '#f6c64e',
          'line-width': 3,
          'line-opacity': 1,
        },
      });


      if (tourMode) {
        const selectedLot = lots.find((lot) => lot.id === selectedLotId);
        const normalized = selectedLot ? normalizePolygon(selectedLot.polygon) : null;
        if (normalized?.valid) {
          const selectedBounds = new mapboxgl.LngLatBounds();
          normalized.coords.forEach(([lng, lat]) => selectedBounds.extend([lng, lat]));
          map.current.fitBounds(selectedBounds, {
            padding: { top: 120, right: 120, bottom: 150, left: 120 },
            pitch: 67,
            bearing: planBearing - 18,
            maxZoom: 17,
            duration: 1400,
          });
        }
      }
    }
  }, [selectedLotId, mapLoaded, tourMode, lots, planBearing]);

  const stopCinematic = () => {
    if (cinematicTimerRef.current) {
      window.clearTimeout(cinematicTimerRef.current);
      cinematicTimerRef.current = null;
    }
  };

  const setTourView = (mode: 'top' | '3d' | 'cinematic') => {
    if (!map.current) return;
    stopCinematic();
    const bounds = calculateBounds();

    if (mode === 'top') {
      if (bounds) map.current.fitBounds(bounds, { padding: 55, pitch: 0, bearing: planBearing, duration: 1200 });
      return;
    }

    if (mode === '3d') {
      if (bounds) map.current.fitBounds(bounds, { padding: 70, pitch: 58, bearing: planBearing - 18, maxZoom: 16.2, duration: 1500 });
      return;
    }

    const center = bounds?.getCenter() ?? new mapboxgl.LngLat(projectCenter.lng, projectCenter.lat);
    map.current.flyTo({
      center,
      zoom: Math.max(map.current.getZoom(), 15.2),
      pitch: 67,
      bearing: planBearing - 32,
      duration: 2200,
      essential: true,
    });
    cinematicTimerRef.current = window.setTimeout(() => {
      if (!map.current) return;
      map.current.easeTo({
        bearing: planBearing + 35,
        pitch: 64,
        duration: 11000,
        easing: (t) => t,
        essential: true,
      });
      cinematicTimerRef.current = null;
    }, 2300);
  };

  const toggleTerrain = () => {
    if (!map.current || !tourMode) return;
    const next = !terrainEnabled;
    setTerrainEnabled(next);
    map.current.setTerrain(next ? { source: 'tour-dem', exaggeration: 1.25 } : null);
  };

  const toggleStyle = () => {
    const newStyle = mapStyle === 'satellite' ? 'streets' : 'satellite';
    setMapStyle(newStyle);
    if (map.current) {
      map.current.remove();
      map.current = null;
      setMapLoaded(false);
    }
  };

  if (tokenLoading) {
    return <Skeleton className="w-full h-[600px] rounded-xl" />;
  }

  if (tokenError) {
    return (
      <div className="w-full h-[600px] rounded-xl bg-muted flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
          <p className="text-muted-foreground">Error al cargar el mapa</p>
        </div>
      </div>
    );
  }

  // Check if lots have real polygons
  const hasRealPolygons = lots.some(lot => lot.polygon && Array.isArray(lot.polygon) && lot.polygon.length >= 3);

  return (
    <div className={`relative w-full ${tourMode ? 'h-full min-h-[520px]' : 'h-[650px]'} rounded-2xl overflow-hidden shadow-lg border border-border/50`}>
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept=".kmz,.kml" onChange={handleFileImport} className="hidden" />
      <input ref={reimportFileInputRef} type="file" accept=".kmz,.kml" onChange={handleReimportByName} className="hidden" />
      
      {/* Controls row - clean and minimal */}
      <div className="absolute top-3 left-3 z-10 flex gap-2 flex-wrap">
        {tourMode && (
          <>
            <Button variant="secondary" size="sm" className="gap-2 bg-black/60 text-white backdrop-blur-md border border-white/15 shadow-md hover:bg-black/75 hover:text-white" onClick={() => setTourView('top')}>
              <MapIcon className="h-4 w-4" /> Cenital
            </Button>
            <Button variant="secondary" size="sm" className="gap-2 bg-black/60 text-white backdrop-blur-md border border-white/15 shadow-md hover:bg-black/75 hover:text-white" onClick={() => setTourView('3d')}>
              <Mountain className="h-4 w-4" /> 3D
            </Button>
            <Button variant="secondary" size="sm" className="gap-2 bg-[#f6c64e] text-[#17352d] border border-[#f6c64e] shadow-md hover:bg-[#f6c64e]/90" onClick={() => setTourView('cinematic')}>
              <Play className="h-4 w-4" /> Recorrido
            </Button>
            <Button variant="secondary" size="sm" className="gap-2 bg-black/60 text-white backdrop-blur-md border border-white/15 shadow-md hover:bg-black/75 hover:text-white" onClick={toggleTerrain}>
              <Compass className="h-4 w-4" /> Relieve {terrainEnabled ? 'ON' : 'OFF'}
            </Button>
          </>
        )}
        {/* Style toggle */}
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 bg-background/80 backdrop-blur-md border border-border/50 shadow-md hover:bg-background/90"
          onClick={toggleStyle}
        >
          <Layers className="h-4 w-4" />
          {mapStyle === 'satellite' ? 'Calles' : 'Satélite'}
        </Button>

        {/* Contour lines toggle */}
        {!tourMode && <Button
          variant={showContours ? "default" : "secondary"}
          size="sm"
          className="gap-2 bg-background/80 backdrop-blur-md border border-border/50 shadow-md"
          onClick={() => {
            const next = !showContours;
            setShowContours(next);
            showContoursRef.current = next;
            if (map.current && map.current.isStyleLoaded()) {
              const vis = next ? 'visible' : 'none';
              ['contour-lines', 'contour-labels'].forEach((layerId) => {
                if (map.current!.getLayer(layerId)) {
                  map.current!.setLayoutProperty(layerId, 'visibility', vis);
                }
              });
            }
          }}
        >
          <Mountain className="h-4 w-4" />
          Curvas
        </Button>}

        {/* Available-only view toggle (plano comercial) */}
        {!tourMode && <Button
          variant={onlyAvailable ? "default" : "secondary"}
          size="sm"
          className="gap-2 bg-background/80 backdrop-blur-md border border-border/50 shadow-md"
          onClick={() => {
            const next = !onlyAvailable;
            setOnlyAvailable(next);
            onlyAvailableRef.current = next;
            if (map.current && map.current.isStyleLoaded()) {
              applyAvailabilityView(map.current, next, colorMode, lots);
            }
          }}
        >
          {onlyAvailable ? 'Disponibles' : 'Todos'}
        </Button>}

        {/* Roads toggle */}
        {roadGeojson && roadGeojson.features.length > 0 && (
          <Button
            variant={showRoads ? "default" : "secondary"}
            size="sm"
            className="gap-2 bg-background/80 backdrop-blur-md border border-border/50 shadow-md"
            onClick={() => {
              setShowRoads(!showRoads);
              if (map.current && map.current.isStyleLoaded()) {
                const vis = !showRoads ? 'visible' : 'none';
                ['roads-kmz-outline', 'roads-kmz-center'].forEach(layerId => {
                  if (map.current!.getLayer(layerId)) {
                    map.current!.setLayoutProperty(layerId, 'visibility', vis);
                  }
                });
              }
            }}
          >
            <Route className="h-4 w-4" />
            {tourMode ? 'Servidumbre' : 'Caminos'}
          </Button>
        )}
        
        {/* Master plan overlay toggle */}
        {masterPlanImagesList.length > 0 && (
          <>
            <Button
              variant={showMasterPlanOverlay ? "default" : "secondary"}
              size="sm"
              className="gap-2 bg-background/80 backdrop-blur-md border border-border/50 shadow-md"
              onClick={() => setShowMasterPlanOverlay(!showMasterPlanOverlay)}
            >
              <Image className="h-4 w-4" />
              Plano
            </Button>
            {onOpenCompare && (
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 bg-background/80 backdrop-blur-md border border-border/50 shadow-md"
                onClick={onOpenCompare}
              >
                <ArrowLeftRight className="h-4 w-4" />
                Comparar
              </Button>
            )}
          </>
        )}

        {/* Admin tools dropdown - only for project owners */}
        {showAdminControls && !showDrawingPanel && !renumberMode && projectId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 bg-background/80 backdrop-blur-md border border-border/50 shadow-md"
              >
                <Settings2 className="h-4 w-4" />
                Herramientas
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem onClick={showDrawingPanel ? handleDisableDrawingMode : handleEnableDrawingMode}>
                <PenTool className="h-4 w-4 mr-2" />
                Dibujar Lotes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setRenumberMode(true); setShowMasterPlanOverlay(true); }}>
                <Hash className="h-4 w-4 mr-2" />
                Renumerar Lotes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={importing}>
                <Upload className="h-4 w-4 mr-2" />
                {importing ? 'Importando...' : 'Importar KMZ'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => reimportFileInputRef.current?.click()} disabled={importing}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {importing ? 'Reimportando...' : 'Reimportar por Nombre'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCompactLots} disabled={compacting}>
                <Minimize2 className="h-4 w-4 mr-2" />
                {compacting ? 'Compactando...' : 'Compactar Lotes'}
              </DropdownMenuItem>
              {kmzFileUrl && (
                <DropdownMenuItem onClick={handleRestoreKmz} disabled={restoring}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {restoring ? 'Restaurando...' : 'Restaurar KMZ'}
                </DropdownMenuItem>
              )}
              {kmzFileUrl && (
                <DropdownMenuItem onClick={handleRegeneratePolygons} disabled={regenerating}>
                  <Layers className="h-4 w-4 mr-2" />
                  {regenerating ? 'Regenerando...' : 'Regenerar Polígonos'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Active drawing mode button */}
        {showAdminControls && showDrawingPanel && (
          <Button
            variant="default"
            size="sm"
            className="gap-2 shadow-md"
            onClick={handleDisableDrawingMode}
          >
            <PenTool className="h-4 w-4" />
            Salir Edición
          </Button>
        )}

        {/* Active renumber mode button */}
        {showAdminControls && renumberMode && (
          <Button
            variant="default"
            size="sm"
            className="gap-2 shadow-md"
            onClick={() => { setRenumberMode(false); setRenumberSelectedLot(null); }}
          >
            <Hash className="h-4 w-4" />
            Salir Renumerar
          </Button>
        )}
      </div>
      
      {/* Drawing Tool Panel */}
      {showAdminControls && showDrawingPanel && (
        <div className="absolute top-16 left-3 z-10 w-64">
          <LotDrawingTool
            lots={lots.map(l => ({ id: l.id, lot_number: l.lot_number, area: l.area, status: l.status, polygon: l.polygon }))}
            isDrawingMode={isDrawingMode}
            currentMode={currentMode}
            currentPolygon={currentPolygon}
            selectedLotId={drawingSelectedLotId}
            isSaving={isSaving}
            onStartDrawing={startDrawing}
            onStartEditing={startEditing}
            onStartDeleting={startDeleting}
            onCancelDrawing={cancelDrawing}
            onExitDrawingMode={handleDisableDrawingMode}
            onSelectLot={setDrawingSelectedLotId}
            onSavePolygon={savePolygonToLot}
            onDeletePolygon={deletePolygonFromLot}
          />
        </div>
      )}

      {/* Renumber Tool Panel */}
      {showAdminControls && renumberMode && (
        <div className="absolute top-16 left-3 z-10">
          <LotRenumberTool
            lots={lots.map(l => ({ id: l.id, lot_number: l.lot_number, area: l.area, status: l.status }))}
            selectedLot={renumberSelectedLot}
            onLotUpdated={() => { setRenumberSelectedLot(null); onLotsUpdated?.(); }}
            onFinish={() => { setRenumberMode(false); setRenumberSelectedLot(null); onLotsUpdated?.(); }}
          />
        </div>
      )}
      
      {/* Master plan overlay controls */}
      <MasterPlanOverlay
        map={map.current}
        images={masterPlanImagesList}
        isVisible={showMasterPlanOverlay}
        onClose={() => setShowMasterPlanOverlay(false)}
        projectCenter={projectCenter}
      />
      
      {/* Status indicator */}
      {!hasRealPolygons && (
        <div className="absolute top-3 right-14 px-3 py-1.5 bg-background/80 backdrop-blur-md rounded-full text-xs text-muted-foreground border border-border/50 shadow-sm">
          Polígonos simulados — Importa KMZ para datos reales
        </div>
      )}

      {/* Color Mode Selector */}
      {!tourMode && <div className="absolute bottom-16 right-3 md:bottom-4 md:right-4 flex gap-1 bg-background/90 backdrop-blur-md rounded-xl p-1 shadow-lg border border-border/50 max-w-[calc(100%-1.5rem)]">

        {[
          { key: 'status' as const, label: 'Estado' },
          { key: 'price' as const, label: 'Precio' },
          { key: 'area' as const, label: 'Área' },
        ].map(m => (
          <button
            key={m.key}
            onClick={() => {
              setColorMode(m.key);
              // Analizar por precio/superficie/estado implica ver TODOS los lotes.
              setOnlyAvailable(false);
              onlyAvailableRef.current = false;
              if (map.current && map.current.isStyleLoaded()) {
                applyAvailabilityView(map.current, false, m.key, lots);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              colorMode === m.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>}

      {/* Dynamic Legend */}
      {!tourMode && <div className="absolute bottom-16 left-3 md:bottom-4 md:left-4 bg-background/90 backdrop-blur-md rounded-xl p-2.5 md:p-3 shadow-lg border border-border/50 space-y-1.5 md:space-y-2">

        {onlyAvailable ? (
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: '#3fae49' }} />
            <span className="text-xs font-medium">
              Disponible · {lots.filter((l) => (l.status ?? 'available') === 'available').length} parcelas
            </span>
          </div>
        ) : null}
        {!onlyAvailable && colorMode === 'status' && (
          <>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Estado</p>
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-sm bg-emerald-600" /><span className="text-xs font-medium">Disponible</span></div>
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-sm bg-amber-600" /><span className="text-xs font-medium">Reservado</span></div>
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-sm bg-slate-500" /><span className="text-xs font-medium">Vendido</span></div>
          </>
        )}
        {!onlyAvailable && colorMode === 'price' && (
          <>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Precio</p>
            <div className="flex items-center gap-2">
              <div className="w-16 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, #22c55e, #eab308, #ef4444)' }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground w-16">
              <span>Bajo</span><span>Alto</span>
            </div>
          </>
        )}
        {!onlyAvailable && colorMode === 'area' && (
          <>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Superficie</p>
            <div className="flex items-center gap-2">
              <div className="w-16 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, #bfdbfe, #3b82f6, #1e3a5f)' }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground w-16">
              <span>Menor</span><span>Mayor</span>
            </div>
          </>
        )}
      </div>}

      {tourMode && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-xs text-white/80 backdrop-blur-md">
          <span className="font-semibold text-emerald-300">Terrain Tour</span>
          <span className="mx-2 text-white/25">•</span>
          Arrastra para orbitar · selecciona una parcela para acercarte
        </div>
      )}
    </div>
  );
};
