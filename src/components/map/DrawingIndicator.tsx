import { PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawingIndicatorProps {
  isDrawing: boolean;
  isMobile?: boolean;
  className?: string;
}

const DrawingIndicator = ({ isDrawing, isMobile = false, className }: DrawingIndicatorProps) => {
  if (!isDrawing) return null;

  return (
    <div
      className={cn(
        'px-4 py-2.5 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25',
        'flex items-center gap-2.5 animate-pulse',
        className
      )}
    >
      <div className="relative">
        <PenTool className="h-4 w-4" />
        <div className="absolute inset-0 animate-ping">
          <PenTool className="h-4 w-4 opacity-50" />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold">
          {isMobile ? 'Dibujando área' : 'Modo dibujo activo'}
        </span>
        <span className="text-[10px] opacity-80">
          {isMobile ? 'Toca para agregar puntos' : 'Haz clic para agregar puntos • Doble clic para terminar'}
        </span>
      </div>
    </div>
  );
};

export default DrawingIndicator;
