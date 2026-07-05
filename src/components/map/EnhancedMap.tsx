import { useRef, useCallback } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Listing } from '@/hooks/useListings';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTouchGestures } from '@/hooks/useTouchGestures';
import { useMapInstance, MapBoundsData } from '@/hooks/useMapInstance';
import { useMapMarkers } from '@/hooks/useMapMarkers';
import { useMapLayers } from '@/hooks/useMapLayers';
import CompactMapControls from './CompactMapControls';
import MapToolsDrawer from './MapToolsDrawer';
import TouchMapControls from './TouchMapControls';
import GestureFeedback from './GestureFeedback';
import { useState } from 'react';

export type { MapBoundsData };

interface EnhancedMapProps {
  listings: Listing[];
  hoveredListing?: Listing | null;
  selectedListing?: Listing | null;
  onListingHover?: (listing: Listing | null) => void;
  onListingClick?: (listing: Listing) => void;
  onPolygonDrawn?: (polygon: number[][], area: number) => void;
  onPolygonCleared?: () => void;
  onBoundsChange?: (bounds: MapBoundsData) => void;
  className?: string;
  showDrawTools?: boolean;
}

const EnhancedMap = ({
  listings,
  hoveredListing,
  selectedListing,
  onListingHover,
  onListingClick,
  onPolygonDrawn,
  onPolygonCleared,
  onBoundsChange,
  className = '',
  showDrawTools = true,
}: EnhancedMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [showToolsDrawer, setShowToolsDrawer] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);

  // ── 1. Map instance lifecycle ──
  const {
    map,
    popupRef,
    layerTooltipRef,
    styleLoadedRef,
    isLoading,
    isDrawing,
    drawnArea,
    mapMode,
    tokenLoading,
    tokenError,
    changeMapMode,
    handleZoomIn,
    handleZoomOut,
    handleLocate,
    handleFitAll,
    handleResetNorth,
    handleResetView,
    startDrawing,
    clearDrawing,
  } = useMapInstance(mapContainer, {
    showDrawTools,
    onBoundsChange,
    onPolygonDrawn,
    onPolygonCleared,
  });

  // ── 2. GIS Layers ──
  const layersHook = useMapLayers({
    map,
    layerTooltipRef,
    styleLoadedRef,
    listings,
    isLoading,
  });

  // ── 3. Markers ──
  useMapMarkers({
    map,
    popupRef,
    listings,
    hoveredListing,
    selectedListing,
    onListingHover,
    onListingClick,
    isLoading,
    infoLayers: layersHook.infoLayers,
    fetchIsochrone: layersHook.fetchIsochrone,
  });

  // ── Touch gestures ──
  const { gestureFeedback } = useTouchGestures(map, mapContainer, {
    enableFeedback: isMobile,
  });

  // Wrapped handlers that pass listings
  const fitAll = useCallback(() => handleFitAll(listings), [handleFitAll, listings]);
  const resetView = useCallback(() => handleResetView(listings), [handleResetView, listings]);

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
            onLocate={handleLocate}
            onFitAll={fitAll}
            onResetNorth={handleResetNorth}
            onResetView={resetView}
            onChangeMapMode={changeMapMode}
            onOpenTools={() => setShowToolsDrawer(!showToolsDrawer)}
            activeLayersCount={Object.values(layersHook.infoLayers).filter(Boolean).length}
            listingsCount={listings.filter(l => l.lat && l.lng).length}
            drawnArea={drawnArea}
          />
        )}

        {/* Desktop: Tools Drawer */}
        {!isMobile && (
          <MapToolsDrawer
            open={showToolsDrawer}
            onClose={() => setShowToolsDrawer(false)}
            infoLayers={layersHook.infoLayers}
            layerConfig={layersHook.layerConfig}
            onLayerChange={layersHook.handleLayerChange}
            onConfigChange={layersHook.handleConfigChange}
            showDrawTools={showDrawTools}
            isDrawing={isDrawing}
            drawnArea={drawnArea}
            onStartDrawing={startDrawing}
            onClearDrawing={clearDrawing}
            onFitAll={fitAll}
            onResetNorth={handleResetNorth}
            onResetView={resetView}
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
          onFitAll={fitAll}
          onResetNorth={handleResetNorth}
          onResetView={resetView}
          onChangeMapMode={changeMapMode}
          onStartDrawing={startDrawing}
          onClearDrawing={clearDrawing}
          onOpenLayers={() => setShowLayersPanel(true)}
          activeLayersCount={Object.values(layersHook.infoLayers).filter(Boolean).length}
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
                <Button variant="ghost" size="sm" onClick={() => setShowLayersPanel(false)} className="h-10 px-4">
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
                    onClick={() => layersHook.handleLayerChange(key as any, !layersHook.infoLayers[key as keyof typeof layersHook.infoLayers])}
                    className={`w-full p-4 rounded-xl border transition-all touch-manipulation ${
                      layersHook.infoLayers[key as keyof typeof layersHook.infoLayers]
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
                        layersHook.infoLayers[key as keyof typeof layersHook.infoLayers] ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        {layersHook.infoLayers[key as keyof typeof layersHook.infoLayers] && (
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
                  onClick={() => layersHook.handleConfigChange({ useRealData: !layersHook.layerConfig.useRealData })}
                  className="w-full flex items-center justify-between touch-manipulation"
                >
                  <div className="text-left">
                    <p className="font-medium">{layersHook.layerConfig.useRealData ? 'Datos Reales' : 'Datos Demo'}</p>
                    <p className="text-sm text-muted-foreground">
                      {layersHook.layerConfig.useRealData ? 'IDE Chile / MINVU' : 'Datos de demostración'}
                    </p>
                  </div>
                  <div className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors ${
                    layersHook.layerConfig.useRealData ? 'bg-primary justify-end' : 'bg-muted justify-start'
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
