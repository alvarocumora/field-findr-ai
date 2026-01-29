import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';

interface TouchGestureOptions {
  onDoubleTap?: (center: { x: number; y: number }) => void;
  onPinchStart?: () => void;
  onPinchEnd?: (scale: number) => void;
  enableFeedback?: boolean;
}

interface GestureFeedback {
  type: 'double-tap' | 'pinch-zoom-in' | 'pinch-zoom-out' | null;
  position: { x: number; y: number } | null;
  scale: number;
  visible: boolean;
}

export const useTouchGestures = (
  mapRef: React.MutableRefObject<mapboxgl.Map | null>,
  containerRef: React.RefObject<HTMLDivElement>,
  options: TouchGestureOptions = {}
) => {
  const { enableFeedback = true } = options;
  
  const [gestureFeedback, setGestureFeedback] = useState<GestureFeedback>({
    type: null,
    position: null,
    scale: 1,
    visible: false,
  });
  
  const lastTapRef = useRef<number>(0);
  const lastTapPositionRef = useRef<{ x: number; y: number } | null>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const isPinchingRef = useRef(false);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showFeedback = useCallback((
    type: GestureFeedback['type'],
    position: { x: number; y: number },
    scale: number = 1
  ) => {
    if (!enableFeedback) return;
    
    // Clear any existing timeout
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    
    setGestureFeedback({
      type,
      position,
      scale,
      visible: true,
    });
    
    // Hide feedback after animation
    feedbackTimeoutRef.current = setTimeout(() => {
      setGestureFeedback(prev => ({ ...prev, visible: false }));
    }, 400);
  }, [enableFeedback]);

  const getTouchDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getTouchCenter = useCallback((touches: TouchList): { x: number; y: number } => {
    if (touches.length === 1) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }, []);

  // Double-tap handler with improved detection
  const handleDoubleTap = useCallback((e: TouchEvent) => {
    const map = mapRef.current;
    if (!map || e.touches.length !== 1) return;

    const now = Date.now();
    const touch = e.touches[0];
    const currentPosition = { x: touch.clientX, y: touch.clientY };
    
    // Check if this is a double tap (within 300ms and 30px of last tap)
    const timeDiff = now - lastTapRef.current;
    const lastPos = lastTapPositionRef.current;
    
    if (timeDiff < 300 && lastPos) {
      const distance = Math.sqrt(
        Math.pow(currentPosition.x - lastPos.x, 2) +
        Math.pow(currentPosition.y - lastPos.y, 2)
      );
      
      if (distance < 30) {
        e.preventDefault();
        
        // Get container bounds to calculate relative position
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const relativeX = currentPosition.x - rect.left;
          const relativeY = currentPosition.y - rect.top;
          
          // Show feedback at tap position
          showFeedback('double-tap', { x: relativeX, y: relativeY });
          
          // Zoom in at the tapped location
          const currentZoom = map.getZoom();
          const lngLat = map.unproject([relativeX, relativeY]);
          
          map.easeTo({
            center: lngLat,
            zoom: currentZoom + 1.5,
            duration: 300,
            easing: (t) => t * (2 - t), // Ease out quad
          });
          
          options.onDoubleTap?.({ x: relativeX, y: relativeY });
        }
        
        // Reset tap tracking
        lastTapRef.current = 0;
        lastTapPositionRef.current = null;
        return;
      }
    }
    
    lastTapRef.current = now;
    lastTapPositionRef.current = currentPosition;
  }, [mapRef, containerRef, showFeedback, options]);

  // Pinch zoom handlers with visual feedback
  const handlePinchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 2) return;
    
    initialPinchDistanceRef.current = getTouchDistance(e.touches);
    isPinchingRef.current = true;
    options.onPinchStart?.();
  }, [getTouchDistance, options]);

  const handlePinchMove = useCallback((e: TouchEvent) => {
    const map = mapRef.current;
    if (!map || !isPinchingRef.current || e.touches.length !== 2) return;
    
    const currentDistance = getTouchDistance(e.touches);
    const initialDistance = initialPinchDistanceRef.current;
    
    if (!initialDistance) return;
    
    const scale = currentDistance / initialDistance;
    const center = getTouchCenter(e.touches);
    
    // Get container bounds
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const relativeCenter = {
        x: center.x - rect.left,
        y: center.y - rect.top,
      };
      
      // Update feedback based on scale direction
      const type = scale > 1 ? 'pinch-zoom-in' : 'pinch-zoom-out';
      setGestureFeedback({
        type,
        position: relativeCenter,
        scale: Math.min(Math.max(scale, 0.5), 2),
        visible: true,
      });
    }
  }, [mapRef, containerRef, getTouchDistance, getTouchCenter]);

  const handlePinchEnd = useCallback((e: TouchEvent) => {
    if (!isPinchingRef.current) return;
    
    const currentDistance = getTouchDistance(e.changedTouches);
    const initialDistance = initialPinchDistanceRef.current;
    
    if (initialDistance) {
      const scale = currentDistance / initialDistance;
      options.onPinchEnd?.(scale);
    }
    
    isPinchingRef.current = false;
    initialPinchDistanceRef.current = null;
    
    // Hide feedback
    setTimeout(() => {
      setGestureFeedback(prev => ({ ...prev, visible: false }));
    }, 200);
  }, [getTouchDistance, options]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleDoubleTap(e);
      } else if (e.touches.length === 2) {
        handlePinchStart(e);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        handlePinchMove(e);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isPinchingRef.current) {
        handlePinchEnd(e);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, [containerRef, handleDoubleTap, handlePinchStart, handlePinchMove, handlePinchEnd]);

  return { gestureFeedback };
};

export default useTouchGestures;
