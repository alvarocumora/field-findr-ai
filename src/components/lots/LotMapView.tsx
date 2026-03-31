import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { usePolygonDrawing } from '@/hooks/usePolygonDrawing';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Layers, Upload, Image, PenTool, ArrowLeftRight, Hash, RefreshCw, Minimize2, RotateCcw, Route, Settings2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { parseKMZFile, parseKMLFile, generatePolygonsFromPoints, buildPolygonsAdvanced, buildPolygonsFromMixedGeometry, extractRoadGeometries } from '@/lib/kmz';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MasterPlanOverlay } from './MasterPlanOverlay';
import { LotDrawingTool } from './LotDrawingTool';
import { LotRenumberTool } from './LotRenumberTool';

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
}

// Generate GeoJSON from lots - uses real polygons if available, otherwise generates grid
const generateLotGeoJSON = (lots: Lot[], center: { lat: number; lng: number }) => {
  const features: GeoJSON.Feature[] = [];
  
  // Separate lots with valid polygons (>=3 points) from those without
  const lotsWithValidPolygons = lots.filter(lot => lot.polygon && Array.isArray(lot.polygon) && lot.polygon.length >= 3);
  const lotsWithoutPolygons = lots.filter(lot => !lot.polygon || !Array.isArray(lot.polygon) || lot.polygon.length < 3);
  
  // Add real polygon features
  lotsWithValidPolygons.forEach((lot) => {
    const coords = [...lot.polygon];
    if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
      coords.push(coords[0]);
    }
    
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

const getStatusFillColor = (status: string): string => {
  if (status === 'sold') return '#64748b';
  if (status === 'reserved') return '#d97706';
  return '#059669';
};

const formatPrice = (price: number | null) => {
  if (!price) return 'Consultar';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(price);
};

export const LotMapView = ({ lots, projectCenter, onLotClick, selectedLotId, projectId, kmzFileUrl, planImages, onLotsUpdated, readOnly = false, showAdminControls = false, onOpenCompare }: LotMapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reimportFileInputRef = useRef<HTMLInputElement>(null);
  const renumberModeRef = useRef(false);
  const { token, loading: tokenLoading, error: tokenError } = useMapboxToken();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets'>('satellite');
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
  const [roadGeojson, setRoadGeojson] = useState<GeoJSON.FeatureCollection<GeoJSON.LineString> | null>(null);
  const [showRoads, setShowRoads] = useState(true);
  const [colorMode, setColorMode] = useState<'status' | 'price' | 'area'>('status');

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

  // Handle KMZ/KML file import
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;
    
    setImporting(true);
    try {
      const parsed = file.name.endsWith('.kml') 
        ? await parseKMLFile(file)
        : await parseKMZFile(file);
      
      if (parsed.placemarks.length === 0) {
        toast.error('No se encontraron polígonos en el archivo');
        return;
      }
      
      // Match placemarks to existing lots and update them
      let updatedCount = 0;
      let newCount = 0;
      
      for (const placemark of parsed.placemarks) {
        // Extract lot number from placemark name
        const lotNumberMatch = placemark.name.match(/(\d+)/);
        const lotNumber = lotNumberMatch ? lotNumberMatch[1] : placemark.name;
        
        // Find matching lot
        const matchingLot = lots.find(lot => 
          lot.lot_number === lotNumber || 
          lot.lot_number === placemark.name
        );
        
        if (matchingLot) {
          // Update existing lot with polygon data
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
              area: placemark.area || matchingLot.area,
            })
            .eq('id', matchingLot.id);
          
          if (!error) updatedCount++;
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
      
      toast.success(`${updatedCount} lotes actualizados con polígonos reales`);
      onLotsUpdated?.();
      
    } catch (error) {
      console.error('Error importing KMZ:', error);
      toast.error('Error al importar el archivo');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  // Re-import KMZ matching placemarks by name instead of sequential order
  const handleReimportByName = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;

    setImporting(true);
    try {
      const parsed = file.name.endsWith('.kml')
        ? await parseKMLFile(file)
        : await parseKMZFile(file);

      console.log('=== REIMPORT BY NAME ===');
      console.log('Parsed placemarks:', parsed.placemarks.length);

      if (parsed.placemarks.length === 0) {
        toast.error('No se encontraron polígonos en el archivo');
        return;
      }

      // Also try the smart builder to get real polygons from LineStrings
      let allPolygons = parsed.placemarks.filter(p => p.isPolygon && p.coordinates.length >= 3);

      // If not enough direct polygons, use the smart builder
      if (allPolygons.length < lots.length * 0.5) {
        const built = buildPolygonsFromMixedGeometry(
          parsed.placemarks,
          lots.map(l => ({ lot_number: l.lot_number, area: l.area }))
        );
        if (built.length > allPolygons.length) {
          allPolygons = built;
        }
      }

      console.log('Polygons available for matching:', allPolygons.length);

      let updatedCount = 0;
      let unmatchedNames: string[] = [];

      for (const placemark of allPolygons) {
        // Extract lot number from placemark name using flexible regex
        const match = placemark.name.match(/Lote[:\s-]*(\d+)/i) || placemark.name.match(/^(\d+)$/);
        if (!match) {
          unmatchedNames.push(placemark.name);
          continue;
        }

        const lotNum = match[1];
        const matchingLot = lots.find(l => l.lot_number === lotNum);
        if (!matchingLot) {
          unmatchedNames.push(`${placemark.name} (no lot #${lotNum})`);
          continue;
        }

        // Calculate centroid
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

        if (!error) {
          updatedCount++;
          console.log(`✓ Lote ${lotNum} → polígono asignado (${placemark.coordinates.length} pts)`);
        }
      }

      if (unmatchedNames.length > 0) {
        console.warn('Unmatched placemarks:', unmatchedNames);
      }

      // Update project center
      await supabase
        .from('projects')
        .update({ latitude: parsed.center.lat, longitude: parsed.center.lng })
        .eq('id', projectId);

      toast.success(`${updatedCount} lotes re-asignados por nombre del KMZ`);
      if (unmatchedNames.length > 0) {
        toast.info(`${unmatchedNames.length} placemarks sin coincidencia`);
      }
      onLotsUpdated?.();
    } catch (error) {
      console.error('Error reimporting KMZ by name:', error);
      toast.error('Error al reimportar el archivo');
    } finally {
      setImporting(false);
      if (reimportFileInputRef.current) {
        reimportFileInputRef.current.value = '';
      }
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
      pitch: 45,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      if (!map.current) return;
      setMapLoaded(true);
      
      // Fit to bounds if we have real polygons
      if (bounds) {
        map.current.fitBounds(bounds, { padding: 50, pitch: 45 });
      }

      const geojson = generateLotGeoJSON(lots, projectCenter);

      // Add source
      map.current.addSource('lots', {
        type: 'geojson',
        data: geojson,
      });

      // Add fill layer with dynamic color mode
      map.current.addLayer({
        id: 'lots-fill',
        type: 'fill',
        source: 'lots',
        paint: {
          'fill-color': getColorExpression(colorMode, lots),
          'fill-opacity': 0.75,
        },
      });

      // Add outline layer - crisp white borders
      map.current.addLayer({
        id: 'lots-outline',
        type: 'line',
        source: 'lots',
        paint: {
          'line-color': '#ffffff',
          'line-width': 1.5,
          'line-opacity': 0.9,
        },
      });

      // Add lot numbers with better typography
      map.current.addLayer({
        id: 'lots-labels',
        type: 'symbol',
        source: 'lots',
        layout: {
          'text-field': ['concat', 'Lote ', ['get', 'lot_number']],
          'text-size': [
            'interpolate', ['linear'], ['zoom'],
            14, 10,
            16, 13,
            18, 16
          ],
          'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
          'text-allow-overlap': false,
          'text-ignore-placement': false,
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0,0,0,0.7)',
          'text-halo-width': 1.5,
        },
      });

      // Add roads layer if available
      if (roadGeojson && roadGeojson.features.length > 0) {
        map.current.addSource('roads-kmz', { type: 'geojson', data: roadGeojson });
        map.current.addLayer({
          id: 'roads-kmz-outline',
          type: 'line',
          source: 'roads-kmz',
          paint: {
            'line-color': '#fbbf24',
            'line-width': 4,
            'line-opacity': 0.6,
          },
        }, 'lots-fill'); // Insert below lots
        map.current.addLayer({
          id: 'roads-kmz-center',
          type: 'line',
          source: 'roads-kmz',
          paint: {
            'line-color': '#ffffff',
            'line-width': 1.5,
            'line-opacity': 0.8,
            'line-dasharray': [4, 3],
          },
        }, 'lots-fill');
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
  }, [token, lots, projectCenter, onLotClick, mapStyle, calculateBounds]);

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

    if (selectedLotId) {
      map.current.addLayer({
        id: 'lots-selected',
        type: 'line',
        source: 'lots',
        filter: ['==', ['get', 'id'], selectedLotId],
        paint: {
          'line-color': '#fbbf24',
          'line-width': 4,
        },
      });
    }
  }, [selectedLotId, mapLoaded]);

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
    <div className="relative w-full h-[650px] rounded-2xl overflow-hidden shadow-lg border border-border/50">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept=".kmz,.kml" onChange={handleFileImport} className="hidden" />
      <input ref={reimportFileInputRef} type="file" accept=".kmz,.kml" onChange={handleReimportByName} className="hidden" />
      
      {/* Controls row - clean and minimal */}
      <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
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
            Caminos
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

      {/* Premium Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-md rounded-xl p-3 shadow-lg border border-border/50 space-y-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Estado</p>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-sm bg-emerald-600 shadow-sm" />
          <span className="text-xs font-medium">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-sm bg-amber-600 shadow-sm" />
          <span className="text-xs font-medium">Reservado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-sm bg-slate-500 shadow-sm" />
          <span className="text-xs font-medium">Vendido</span>
        </div>
      </div>
    </div>
  );
};
