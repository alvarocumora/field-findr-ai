import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SparklineData {
  value: number;
}

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeLabel?: string;
  positive?: boolean;
  icon: LucideIcon;
  iconColor?: string;
  sparklineData?: SparklineData[];
  delay?: number;
}

const MiniSparkline = ({ data, positive }: { data: SparklineData[]; positive: boolean }) => {
  if (!data || data.length < 2) return null;
  
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;
  
  const width = 80;
  const height = 24;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkline-gradient-${positive ? 'pos' : 'neg'}`} x1="0" x2="0" y1="0" y2="1">
          <stop 
            offset="0%" 
            stopColor={positive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
            stopOpacity="0.3" 
          />
          <stop 
            offset="100%" 
            stopColor={positive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
            stopOpacity="0" 
          />
        </linearGradient>
      </defs>
      <polygon 
        points={areaPoints} 
        fill={`url(#sparkline-gradient-${positive ? 'pos' : 'neg'})`} 
      />
      <polyline
        points={points}
        fill="none"
        stroke={positive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const KPICard = ({
  title,
  value,
  change,
  changeLabel,
  positive = true,
  icon: Icon,
  iconColor = 'text-primary',
  sparklineData,
  delay = 0
}: KPICardProps) => {
  return (
    <Card 
      className={cn(
        'kpi-card opacity-0 animate-slide-in-up',
        delay && `stagger-${Math.min(delay, 8)}`
      )}
      style={{ animationDelay: `${delay * 0.1}s`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between">
        <div className={cn(
          'p-2.5 rounded-xl',
          'bg-primary/10 dark:bg-primary/15'
        )}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        
        {change && (
          <Badge 
            variant={positive ? 'default' : 'secondary'}
            className={cn(
              'gap-1 font-medium',
              positive 
                ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20' 
                : 'bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20'
            )}
          >
            {positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {change}
          </Badge>
        )}
      </div>
      
      <div className="mt-4 flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {changeLabel && (
            <p className="text-xs text-muted-foreground">{changeLabel}</p>
          )}
        </div>
        
        {sparklineData && sparklineData.length > 1 && (
          <div className="mb-1">
            <MiniSparkline data={sparklineData} positive={positive} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default KPICard;
