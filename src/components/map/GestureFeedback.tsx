import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, MousePointerClick } from 'lucide-react';

interface GestureFeedbackProps {
  type: 'double-tap' | 'pinch-zoom-in' | 'pinch-zoom-out' | null;
  position: { x: number; y: number } | null;
  scale: number;
  visible: boolean;
}

const GestureFeedback = ({ type, position, scale, visible }: GestureFeedbackProps) => {
  if (!visible || !position || !type) return null;

  return (
    <>
      {/* Double-tap feedback - expanding ring */}
      {type === 'double-tap' && (
        <div
          className="pointer-events-none absolute z-50"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Outer expanding ring */}
          <div
            className="absolute rounded-full bg-primary/20 animate-ping"
            style={{
              width: 80,
              height: 80,
              left: -40,
              top: -40,
            }}
          />
          
          {/* Inner solid ring */}
          <div
            className="absolute rounded-full bg-primary/30 backdrop-blur-sm border-2 border-primary/50 animate-in zoom-in-50 duration-200"
            style={{
              width: 48,
              height: 48,
              left: -24,
              top: -24,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <ZoomIn className="h-5 w-5 text-primary" />
            </div>
          </div>
          
          {/* Tap indicator dot */}
          <div
            className="absolute w-3 h-3 rounded-full bg-primary animate-in zoom-in duration-150"
            style={{
              left: -6,
              top: -6,
            }}
          />
        </div>
      )}

      {/* Pinch zoom feedback - scaling indicator */}
      {(type === 'pinch-zoom-in' || type === 'pinch-zoom-out') && (
        <div
          className="pointer-events-none absolute z-50"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Circular progress indicator */}
          <div
            className={cn(
              "relative rounded-full backdrop-blur-md border-2 transition-all duration-100 ease-out flex items-center justify-center",
              type === 'pinch-zoom-in' 
                ? "bg-green-500/20 border-green-500/50" 
                : "bg-amber-500/20 border-amber-500/50"
            )}
            style={{
              width: 64 * Math.min(scale, 1.5),
              height: 64 * Math.min(scale, 1.5),
            }}
          >
            {type === 'pinch-zoom-in' ? (
              <ZoomIn className={cn(
                "text-green-600 transition-all duration-100",
                scale > 1.2 ? "h-7 w-7" : "h-5 w-5"
              )} />
            ) : (
              <ZoomOut className={cn(
                "text-amber-600 transition-all duration-100",
                scale < 0.8 ? "h-7 w-7" : "h-5 w-5"
              )} />
            )}
          </div>
          
          {/* Scale percentage indicator */}
          <div
            className={cn(
              "absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-medium",
              type === 'pinch-zoom-in'
                ? "bg-green-500/90 text-white"
                : "bg-amber-500/90 text-white"
            )}
          >
            {Math.round(scale * 100)}%
          </div>
          
          {/* Finger position indicators for pinch */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Left finger indicator */}
            <div
              className={cn(
                "absolute w-6 h-6 rounded-full border-2 transition-all duration-100",
                type === 'pinch-zoom-in' 
                  ? "bg-green-500/30 border-green-500/60" 
                  : "bg-amber-500/30 border-amber-500/60"
              )}
              style={{
                left: -20 * scale,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
            {/* Right finger indicator */}
            <div
              className={cn(
                "absolute w-6 h-6 rounded-full border-2 transition-all duration-100",
                type === 'pinch-zoom-in' 
                  ? "bg-green-500/30 border-green-500/60" 
                  : "bg-amber-500/30 border-amber-500/60"
              )}
              style={{
                right: -20 * scale,
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default GestureFeedback;
