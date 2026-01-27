import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Sparkles, CheckCircle, Circle } from 'lucide-react';

interface MatchCriteria {
  label: string;
  matched: boolean;
}

interface MatchScoreBadgeProps {
  score: number; // 0-100
  criteria?: MatchCriteria[];
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

const MatchScoreBadge = ({
  score,
  criteria = [],
  size = 'md',
  showDetails = true,
  className,
}: MatchScoreBadgeProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-emerald-500 to-emerald-600';
    if (score >= 75) return 'from-emerald-400 to-sky-500';
    if (score >= 50) return 'from-sky-400 to-sky-500';
    if (score >= 25) return 'from-amber-400 to-amber-500';
    return 'from-slate-400 to-slate-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excelente match';
    if (score >= 75) return 'Muy buen match';
    if (score >= 50) return 'Buen match';
    if (score >= 25) return 'Match parcial';
    return 'Match bajo';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const matchedCriteria = criteria.filter((c) => c.matched).length;
  const totalCriteria = criteria.length;

  const BadgeContent = (
    <Badge
      className={cn(
        'bg-gradient-to-r text-white border-0 font-semibold cursor-default flex items-center gap-1',
        getScoreColor(score),
        sizeClasses[size],
        className
      )}
    >
      <Sparkles className={iconSizes[size]} />
      <span>{score}% match</span>
    </Badge>
  );

  if (!showDetails || criteria.length === 0) {
    return BadgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{BadgeContent}</TooltipTrigger>
        <TooltipContent side="bottom" className="w-64 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{getScoreLabel(score)}</span>
              <span className="text-muted-foreground text-sm">
                {matchedCriteria}/{totalCriteria} criterios
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', getScoreColor(score))}
                style={{ width: `${score}%` }}
              />
            </div>

            {/* Criteria list */}
            <div className="space-y-1.5 pt-1">
              {criteria.map((criterion, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {criterion.matched ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/50" />
                  )}
                  <span className={criterion.matched ? 'text-foreground' : 'text-muted-foreground'}>
                    {criterion.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MatchScoreBadge;
