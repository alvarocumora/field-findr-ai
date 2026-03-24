import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { usePolygonDrawing } from '@/hooks/usePolygonDrawing';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Layers, Upload, Image, PenTool, ArrowLeftRight, Hash, RefreshCw, Minimize2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseKMZFile, parseKMLFile, generatePolygonsFromPoints, buildPolygonsAdvanced, buildPolygonsFromMixedGeometry } from '@/lib/kmz';
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

const getPriceColor = (price: number | null, status: string): string => {
  if (status === 'sold') return '#9ca3af'; // gray-400
  if (status === 'reserved') return '#f59e0b'; // amber-500
  
  if (!price) return '#22c55e'; // green-500
  if (price <= 15990000) return '#10b981'; // emerald-500
  if (price <= 17990000) return '#0ea5e9'; // sky-500
  if (price <= 24990000) return '#78716c'; // stone-500
  return '#1e293b'; // slate-800
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

  // === SNAP ALGORITHM: Compact lots by merging nearby vertices ===
  const handleCompactLots = async () => {
    const lotsWithPolygons = lots.filter(l => l.polygon && Array.isArray(l.polygon) && l.polygon.length >= 3);
    if (lotsWithPolygons.length < 2) {
      toast.error('Se necesitan al menos 2 lotes con polígonos');
      return;
    }

    setCompacting(true);
    toast.info('Compactando lotes con tolerancia conservadora (3m)...');

    try {
      // Deep copy all polygons
      const polys: { id: string; coords: [number, number][] }[] = lotsWithPolygons.map(l => ({
        id: l.id,
        coords: l.polygon.map((c: [number, number]) => [...c] as [number, number]),
      }));

      // CONSERVATIVE tolerances to preserve roads
      const TOLERANCE_DEG = 3 / 111320; // ~3m in degrees (was 15m)
      const SNAP_V2V = 2 / 111320; // ~2m in degrees (was 10m)

      // Helper: distance from point P to segment AB, returns projection point
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

      // For each pair of lots
      for (let i = 0; i < polys.length; i++) {
        for (let j = i + 1; j < polys.length; j++) {
          const polyA = polys[i].coords;
          const polyB = polys[j].coords;

          // Check each vertex in A against segments in B
          for (let vi = 0; vi < polyA.length; vi++) {
            const v = polyA[vi];
            for (let si = 0; si < polyB.length - 1; si++) {
              const a = polyB[si], b = polyB[si + 1];
              const { dist, proj, t } = pointToSegment(v, a, b);
              if (dist < TOLERANCE_DEG && dist > 1e-10 && t !== undefined && t > 0.01 && t < 0.99) {
                const midPt: [number, number] = [(v[0] + proj[0]) / 2, (v[1] + proj[1]) / 2];
                polyA[vi] = midPt;
                polyB.splice(si + 1, 0, [...midPt]);
                snappedCount++;
                break;
              }
            }
          }

          // Check each vertex in B against segments in A
          for (let vi = 0; vi < polyB.length; vi++) {
            const v = polyB[vi];
            for (let si = 0; si < polyA.length - 1; si++) {
              const a = polyA[si], b = polyA[si + 1];
              const { dist, proj, t } = pointToSegment(v, a, b);
              if (dist < TOLERANCE_DEG && dist > 1e-10 && t !== undefined && t > 0.01 && t < 0.99) {
                const midPt: [number, number] = [(v[0] + proj[0]) / 2, (v[1] + proj[1]) / 2];
                polyB[vi] = midPt;
                polyA.splice(si + 1, 0, [...midPt]);
                snappedCount++;
                break;
              }
            }
          }
        }
      }

      // Vertex-to-vertex snap with conservative tolerance
      for (let i = 0; i < polys.length; i++) {
        for (let j = i + 1; j < polys.length; j++) {
          for (let vi = 0; vi < polys[i].coords.length; vi++) {
            for (let vj = 0; vj < polys[j].coords.length; vj++) {
              const a = polys[i].coords[vi], b = polys[j].coords[vj];
              const d = Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
              if (d < SNAP_V2V && d > 1e-10) {
                const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
                polys[i].coords[vi] = mid;
                polys[j].coords[vj] = [...mid];
                snappedCount++;
              }
            }
          }
        }
      }

      console.log(`Snapped ${snappedCount} vertices (3m tolerance)`);

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

      toast.success(`${updatedCount} lotes compactados (${snappedCount} vértices, tolerancia 3m)`);
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

      // Add fill layer
      map.current.addLayer({
        id: 'lots-fill',
        type: 'fill',
        source: 'lots',
        paint: {
      'fill-color': [
            'case',
            ['==', ['get', 'status'], 'sold'], '#6b7280',
            ['==', ['get', 'status'], 'reserved'], '#f59e0b',
            '#10b981'
          ],
          'fill-opacity': 0.8,
        },
      });

      // Add outline layer
      map.current.addLayer({
        id: 'lots-outline',
        type: 'line',
        source: 'lots',
        paint: {
          'line-color': '#ffffff',
          'line-width': 1,
        },
      });

      // Add lot numbers
      map.current.addLayer({
        id: 'lots-labels',
        type: 'symbol',
        source: 'lots',
        layout: {
          'text-field': ['concat', 'Lote:', ['get', 'lot_number']],
          'text-size': 14,
          'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1,
        },
      });

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
          })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="padding: 8px; font-family: system-ui;">
                <strong style="font-size: 16px;">Lote ${props.lot_number}</strong>
                <div style="margin-top: 4px; font-size: 13px;">
                  <div>Área: ${Number(props.area).toLocaleString()} m²</div>
                  <div>Precio: ${formatPrice(props.price)}</div>
                  <div style="margin-top: 4px; font-weight: 600; color: ${
                    props.status === 'sold' ? '#6b7280' : 
                    props.status === 'reserved' ? '#f59e0b' : '#10b981'
                  };">
                    ${status}
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
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".kmz,.kml"
        onChange={handleFileImport}
        className="hidden"
      />
      {/* Hidden file input for reimport by name */}
      <input
        ref={reimportFileInputRef}
        type="file"
        accept=".kmz,.kml"
        onChange={handleReimportByName}
        className="hidden"
      />
      
      {/* Controls row */}
      <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
        {/* Style toggle */}
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 glass"
          onClick={toggleStyle}
        >
          <Layers className="h-4 w-4" />
          {mapStyle === 'satellite' ? 'Calles' : 'Satélite'}
        </Button>
        
        {/* Master plan overlay toggle - visible when plan images exist */}
        {masterPlanImagesList.length > 0 && (
          <>
            <Button
              variant={showMasterPlanOverlay ? "default" : "secondary"}
              size="sm"
              className="gap-2 glass"
              onClick={() => setShowMasterPlanOverlay(!showMasterPlanOverlay)}
            >
              <Image className="h-4 w-4" />
              Plano
            </Button>
            {onOpenCompare && (
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 glass"
                onClick={onOpenCompare}
              >
                <ArrowLeftRight className="h-4 w-4" />
                Comparar
              </Button>
            )}
          </>
        )}

        {/* Admin-only controls - only shown when showAdminControls is true */}
        {showAdminControls && !showDrawingPanel && !renumberMode && (
          <>
            {projectId && (
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 glass"
                onClick={showDrawingPanel ? handleDisableDrawingMode : handleEnableDrawingMode}
              >
                <PenTool className="h-4 w-4" />
                Dibujar Lotes
              </Button>
            )}

            {/* Renumber button */}
            {projectId && (
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 glass"
                onClick={() => {
                  setRenumberMode(true);
                  setShowMasterPlanOverlay(true);
                }}
              >
                <Hash className="h-4 w-4" />
                Renumerar
              </Button>
            )}
            
            {/* Import KMZ button */}
            {projectId && (
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 glass"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                <Upload className="h-4 w-4" />
                {importing ? 'Importando...' : 'Importar KMZ'}
              </Button>
            )}

            {/* Reimport KMZ by placemark name */}
            {projectId && (
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 glass"
                onClick={() => reimportFileInputRef.current?.click()}
                disabled={importing}
              >
                <RefreshCw className="h-4 w-4" />
                {importing ? 'Reimportando...' : 'Reimportar KMZ'}
              </Button>
            )}
            {/* Compact lots button */}
            {projectId && (
              <Button
                variant="secondary"
                size="sm"
                className="gap-2 glass"
                onClick={handleCompactLots}
                disabled={compacting}
              >
                <Minimize2 className="h-4 w-4" />
                {compacting ? 'Compactando...' : 'Compactar'}
              </Button>
            )}
            {/* Restore original KMZ polygons */}
            {projectId && kmzFileUrl && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 glass text-orange-600 border-orange-400"
                onClick={handleRestoreKmz}
                disabled={restoring}
              >
                <RotateCcw className="h-4 w-4" />
                {restoring ? 'Restaurando...' : 'Restaurar KMZ'}
              </Button>
            )}
            {/* Regenerate polygons button */}
            {projectId && kmzFileUrl && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 glass"
                onClick={handleRegeneratePolygons}
                disabled={regenerating}
              >
                <Layers className="h-4 w-4" />
                {regenerating ? 'Regenerando...' : 'Regenerar'}
              </Button>
            )}
          </>
        )}

        {/* Active drawing mode button */}
        {showAdminControls && showDrawingPanel && (
          <Button
            variant="default"
            size="sm"
            className="gap-2 glass"
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
            className="gap-2 glass"
            onClick={() => {
              setRenumberMode(false);
              setRenumberSelectedLot(null);
            }}
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
            lots={lots.map(l => ({ 
              id: l.id, 
              lot_number: l.lot_number, 
              area: l.area, 
              status: l.status,
              polygon: l.polygon 
            }))}
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
            onLotUpdated={() => {
              setRenumberSelectedLot(null);
              onLotsUpdated?.();
            }}
            onFinish={() => {
              setRenumberMode(false);
              setRenumberSelectedLot(null);
              onLotsUpdated?.();
            }}
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
        <div className="absolute top-3 right-14 px-3 py-1 glass rounded-full text-xs text-muted-foreground">
          Polígonos simulados - Importa KMZ para ver datos reales
        </div>
      )}

      {/* Legend - status based */}
      <div className="absolute bottom-3 left-3 p-3 glass rounded-lg text-sm space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Reservado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <span>Vendido</span>
        </div>
      </div>
    </div>
  );
};
