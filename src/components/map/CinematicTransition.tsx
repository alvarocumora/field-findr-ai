import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CinematicTransitionProps {
  mapRef: React.MutableRefObject<mapboxgl.Map | null>;
  targetLot: {
    latitude: number;
    longitude: number;
    lotNumber: string;
    polygon?: number[][] | null;
    area: number;
    price?: number | null;
  } | null;
  onTransitionComplete?: () => void;
  onClose?: () => void;
  children?: React.ReactNode;
}

type TransitionPhase = 'idle' | 'flying' | 'crossfade' | '3d-active' | 'returning';

const CinematicTransition = ({
  mapRef,
  targetLot,
  onTransitionComplete,
  onClose,
  children,
}: CinematicTransitionProps) => {
  const [phase, setPhase] = useState<TransitionPhase>('idle');
  const [show3D, setShow3D] = useState(false);
  const originalView = useRef<{ center: [number, number]; zoom: number; pitch: number; bearing: number } | null>(null);

  const flyToLot = useCallback(() => {
    const map = mapRef.current;
    if (!map || !targetLot) return;

    // Save original view
    const center = map.getCenter();
    originalView.current = {
      center: [center.lng, center.lat],
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
    };

    setPhase('flying');

    map.flyTo({
      center: [targetLot.longitude, targetLot.latitude],
      zoom: 18,
      pitch: 60,
      bearing: -30,
      duration: 3000,
      essential: true,
      curve: 1.42,
    });

    // After fly completes, crossfade to 3D
    const onMoveEnd = () => {
      map.off('moveend', onMoveEnd);
      setPhase('crossfade');
      setTimeout(() => {
        setShow3D(true);
        setPhase('3d-active');
        onTransitionComplete?.();
      }, 800);
    };
    map.on('moveend', onMoveEnd);
  }, [mapRef, targetLot, onTransitionComplete]);

  const returnToMap = useCallback(() => {
    const map = mapRef.current;
    if (!map || !originalView.current) {
      onClose?.();
      return;
    }

    setPhase('returning');
    setShow3D(false);

    setTimeout(() => {
      map.flyTo({
        center: originalView.current!.center as [number, number],
        zoom: originalView.current!.zoom,
        pitch: originalView.current!.pitch,
        bearing: originalView.current!.bearing,
        duration: 2000,
        essential: true,
      });

      const onEnd = () => {
        map.off('moveend', onEnd);
        setPhase('idle');
        originalView.current = null;
        onClose?.();
      };
      map.on('moveend', onEnd);
    }, 300);
  }, [mapRef, onClose]);

  // Trigger fly when target changes
  useEffect(() => {
    if (targetLot && phase === 'idle') {
      flyToLot();
    }
  }, [targetLot, phase, flyToLot]);

  return (
    <AnimatePresence>
      {/* Crossfade overlay */}
      {(phase === 'crossfade' || phase === 'returning') && (
        <motion.div
          className="absolute inset-0 z-overlay bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'crossfade' ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      )}

      {/* Flying indicator */}
      {phase === 'flying' && (
        <motion.div
          className="absolute inset-0 z-map-overlay pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="bg-background/60 backdrop-blur-xl rounded-2xl px-6 py-4 border border-border/20">
            <p className="text-sm font-medium text-foreground animate-pulse">
              Navegando a Lote #{targetLot?.lotNumber}...
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">
              {targetLot?.latitude.toFixed(4)}° S, {Math.abs(targetLot?.longitude || 0).toFixed(4)}° W
            </p>
          </div>
        </motion.div>
      )}

      {/* 3D Canvas overlay */}
      {show3D && (
        <motion.div
          className="absolute inset-0 z-modal dark"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Close button */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-background/60 backdrop-blur-xl border-border/20 hover:bg-background/80"
              onClick={returnToMap}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Lot info bar */}
          <div className="absolute top-4 left-4 z-10 bg-background/60 backdrop-blur-xl rounded-xl px-4 py-2 border border-border/20">
            <p className="text-xs font-bold text-foreground">Lote #{targetLot?.lotNumber}</p>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {targetLot?.area.toLocaleString('es-CL')} m² 
              {targetLot?.price ? ` · $${targetLot.price.toLocaleString('es-CL')}` : ''}
            </p>
          </div>

          {/* 3D content (ParcelaDesigner3D passed as children) */}
          <div className="h-full w-full bg-background">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CinematicTransition;
