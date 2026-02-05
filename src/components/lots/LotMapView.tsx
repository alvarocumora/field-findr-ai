import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Layers, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseKMZFile, parseKMLFile } from '@/lib/kmzParser';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  onLotsUpdated?: () => void;
}

// Generate GeoJSON from lots - uses real polygons if available, otherwise generates grid
const generateLotGeoJSON = (lots: Lot[], center: { lat: number; lng: number }) => {
  const features: GeoJSON.Feature[] = [];
  
  // Check if any lots have real polygon data
  const lotsWithPolygons = lots.filter(lot => lot.polygon && Array.isArray(lot.polygon) && lot.polygon.length > 0);
  const useRealPolygons = lotsWithPolygons.length > 0;
  
  if (useRealPolygons) {
    // Use real polygon data
    lots.forEach((lot) => {
      if (lot.polygon && Array.isArray(lot.polygon) && lot.polygon.length >= 3) {
        // Ensure polygon is closed (first point = last point)
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
      }
    });
  }
  
  // If no real polygons found, generate grid-based ones
  if (features.length === 0) {
    const cols = 9;
    const lotWidth = 0.0012;
    const lotHeight = 0.0008;
    const gap = 0.0001;
    
    lots.forEach((lot, index) => {
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

export const LotMapView = ({ lots, projectCenter, onLotClick, selectedLotId, projectId, kmzFileUrl, onLotsUpdated }: LotMapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token, loading: tokenLoading, error: tokenError } = useMapboxToken();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets'>('satellite');
  const [importing, setImporting] = useState(false);
  const [loadingKmz, setLoadingKmz] = useState(false);
  const [kmzLoaded, setKmzLoaded] = useState(false);

  // Auto-load KMZ from URL if lots don't have polygons yet
  useEffect(() => {
    const loadKmzFromUrl = async () => {
      if (!kmzFileUrl || !projectId || kmzLoaded) return;
      
      // Check if lots already have polygon data
      const hasPolygons = lots.some(lot => lot.polygon && Array.isArray(lot.polygon) && lot.polygon.length > 0);
      if (hasPolygons) {
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
        
        if (parsed.placemarks.length === 0) {
          console.warn('No placemarks found in KMZ');
          return;
        }
        
        // Match placemarks to existing lots and update them
        let updatedCount = 0;
        
        for (const placemark of parsed.placemarks) {
          const lotNumberMatch = placemark.name.match(/(\d+)/);
          const lotNumber = lotNumberMatch ? lotNumberMatch[1] : placemark.name;
          
          const matchingLot = lots.find(lot => 
            lot.lot_number === lotNumber || 
            lot.lot_number === placemark.name
          );
          
          if (matchingLot) {
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
  }, [kmzFileUrl, projectId, lots, kmzLoaded, onLotsUpdated]);

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

  // Calculate actual bounds from lot polygons
  const calculateBounds = useCallback(() => {
    const lotsWithPolygons = lots.filter(lot => lot.polygon && Array.isArray(lot.polygon) && lot.polygon.length > 0);
    
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
            ['<=', ['get', 'price'], 15990000], '#10b981',
            ['<=', ['get', 'price'], 17990000], '#0ea5e9',
            ['<=', ['get', 'price'], 24990000], '#78716c',
            '#1e293b'
          ],
          'fill-opacity': 0.7,
        },
      });

      // Add outline layer
      map.current.addLayer({
        id: 'lots-outline',
        type: 'line',
        source: 'lots',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2,
        },
      });

      // Add lot numbers
      map.current.addLayer({
        id: 'lots-labels',
        type: 'symbol',
        source: 'lots',
        layout: {
          'text-field': ['get', 'lot_number'],
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

      // Click handler
      map.current.on('click', 'lots-fill', (e) => {
        if (e.features && e.features[0]) {
          const props = e.features[0].properties;
          if (!props) return;
          
          const lot = lots.find(l => l.id === props.id);
          if (lot && lot.status !== 'sold') {
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
    if (!map.current || !mapLoaded) return;

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
    return <Skeleton className="w-full h-[500px] rounded-xl" />;
  }

  if (tokenError) {
    return (
      <div className="w-full h-[500px] rounded-xl bg-muted flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
          <p className="text-muted-foreground">Error al cargar el mapa</p>
        </div>
      </div>
    );
  }

  // Check if lots have real polygons
  const hasRealPolygons = lots.some(lot => lot.polygon && Array.isArray(lot.polygon) && lot.polygon.length > 0);

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".kmz,.kml"
        onChange={handleFileImport}
        className="hidden"
      />
      
      {/* Controls row */}
      <div className="absolute top-3 left-3 flex gap-2">
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
      </div>
      
      {/* Status indicator */}
      {!hasRealPolygons && (
        <div className="absolute top-3 right-14 px-3 py-1 glass rounded-full text-xs text-muted-foreground">
          Polígonos simulados - Importa KMZ para ver datos reales
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 p-3 glass rounded-lg text-sm space-y-1">
        <div className="font-semibold mb-2">Leyenda</div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted-foreground" />
          <span>Vendido</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500" />
          <span>Reservado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500" />
          <span>$15.990.000</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-sky-500" />
          <span>$17.990.000</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-stone-500" />
          <span>$24.990.000</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-800" />
          <span>$29.990.000</span>
        </div>
      </div>
    </div>
  );
};
