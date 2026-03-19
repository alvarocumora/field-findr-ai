import { Mountain, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ValuationFiltersProps {
  selectedSlopes: string[];
  onToggleSlope: (slope: string) => void;
  selectedValuation: string[];
  onToggleValuation: (val: string) => void;
  className?: string;
}

const SLOPE_OPTIONS = [
  { value: 'flat', label: 'Plano', icon: '⬜', description: '< 5°' },
  { value: 'slight', label: 'Suave', icon: '⬔', description: '5°–15°' },
  { value: 'steep', label: 'Fuerte', icon: '▲', description: '> 15°' },
];

const VALUATION_OPTIONS = [
  { value: 'low', label: 'Bajo', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'medium', label: 'Medio', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'high', label: 'Alto', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
];

const ValuationFilters = ({
  selectedSlopes,
  onToggleSlope,
  selectedValuation,
  onToggleValuation,
  className,
}: ValuationFiltersProps) => {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Topography Filter */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <Mountain className="h-3 w-3" />
          <span>Topografía</span>
        </div>
        <div className="flex gap-1">
          {SLOPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onToggleSlope(opt.value)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border transition-all',
                selectedSlopes.includes(opt.value)
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-muted/30 text-muted-foreground border-border/30 hover:bg-muted/50'
              )}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Valuation / Appreciation Filter */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          <span>Plusvalía estimada</span>
        </div>
        <div className="flex gap-1">
          {VALUATION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onToggleValuation(opt.value)}
              className={cn(
                'px-2 py-1 rounded-lg text-[10px] font-medium border transition-all',
                selectedValuation.includes(opt.value)
                  ? opt.color
                  : 'bg-muted/30 text-muted-foreground border-border/30 hover:bg-muted/50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ValuationFilters;
